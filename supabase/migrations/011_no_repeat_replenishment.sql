-- =========================================================================
-- MAP Test System
--   1. Cross-session dedup — a student never sees a question they have
--      answered in ANY previous session of theirs.
--   2. Defense-in-depth — submit_answer also rejects duplicates server-side.
--   3. Replenishment queue — when the bank is exhausted for a student, the
--      student opens a row in `replenishment_requests`; an admin browser
--      with a Gemini key picks it up, generates new questions, and the
--      student's poll picks them up automatically.
-- =========================================================================

-- ----- 1. get_next_question: cross-session dedup --------------------------
CREATE OR REPLACE FUNCTION get_next_question(p_session_id UUID)
RETURNS TABLE (
    question_id UUID,
    subject subject_type,
    question_text TEXT,
    passage_text TEXT,
    question_image_url TEXT,
    choice_a TEXT,
    choice_b TEXT,
    choice_c TEXT,
    choice_d TEXT,
    difficulty_rit INT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_next_subject subject_type;
    v_current_rit INT;
    v_answered INT;
    v_student_id UUID;
    v_grade_taken INT;
BEGIN
    SELECT student_id, questions_answered, grade_level_taken
        INTO v_student_id, v_answered, v_grade_taken
    FROM test_sessions WHERE id = p_session_id;

    IF v_student_id <> auth.uid() AND current_user_role() NOT IN ('teacher','admin') THEN
        RAISE EXCEPTION 'Not authorized to read session';
    END IF;

    v_next_subject := CASE WHEN v_answered % 2 = 0 THEN 'math' ELSE 'english' END;

    SELECT CASE WHEN v_next_subject = 'math' THEN current_rit_math ELSE current_rit_english END
        INTO v_current_rit FROM test_sessions WHERE id = p_session_id;

    RETURN QUERY
    SELECT q.id, q.subject, q.question_text, q.passage_text, q.question_image_url,
           q.choice_a, q.choice_b, q.choice_c, q.choice_d, q.difficulty_rit
    FROM questions q
    WHERE q.subject = v_next_subject
      AND q.active = TRUE
      AND NOT EXISTS (
          SELECT 1
          FROM test_responses r
          JOIN test_sessions s ON s.id = r.session_id
          WHERE s.student_id = v_student_id
            AND r.question_id = q.id
      )
    ORDER BY
        CASE WHEN ABS(q.difficulty_rit - v_current_rit) <= 5 THEN 0 ELSE 1 END,
        CASE
            WHEN ABS(q.grade_band - v_grade_taken) <= 1 THEN 0
            WHEN ABS(q.grade_band - v_grade_taken) <= 3 THEN 1
            ELSE 2
        END,
        ABS(q.difficulty_rit - v_current_rit),
        RANDOM()
    LIMIT 1;
END $$;

GRANT EXECUTE ON FUNCTION get_next_question(UUID) TO authenticated;

-- ----- 2. submit_answer: defense-in-depth dedup ---------------------------
CREATE OR REPLACE FUNCTION submit_answer(
    p_session_id UUID,
    p_question_id UUID,
    p_answer CHAR(1),
    p_time_spent INT
) RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_correct CHAR(1);
    v_is_correct BOOLEAN;
    v_subject subject_type;
    v_difficulty INT;
    v_current_rit INT;
    v_new_rit INT;
    v_step INT;
    v_answered INT;
    v_seq INT;
    v_student_id UUID;
BEGIN
    SELECT student_id INTO v_student_id FROM test_sessions WHERE id = p_session_id;
    IF v_student_id <> auth.uid() THEN
        RAISE EXCEPTION 'Not the session owner';
    END IF;

    -- Reject if the same student already answered this question in any prior
    -- session. Inside the current session, the unique constraint on
    -- (session_id, question_id) — implicit via the insert below — protects
    -- against double-submit. We compare across all sessions for replay
    -- prevention.
    IF EXISTS (
        SELECT 1
        FROM test_responses r
        JOIN test_sessions s ON s.id = r.session_id
        WHERE s.student_id = v_student_id
          AND r.question_id = p_question_id
          AND r.session_id <> p_session_id
    ) THEN
        RAISE EXCEPTION 'You have already answered this question in a previous test';
    END IF;

    SELECT correct_answer, subject, difficulty_rit
        INTO v_correct, v_subject, v_difficulty
        FROM questions WHERE id = p_question_id;

    IF v_correct IS NULL THEN
        RAISE EXCEPTION 'Question not found';
    END IF;

    v_is_correct := (p_answer = v_correct);

    SELECT questions_answered + 1,
           CASE WHEN v_subject = 'math' THEN current_rit_math ELSE current_rit_english END
        INTO v_answered, v_current_rit
        FROM test_sessions WHERE id = p_session_id;

    v_step := GREATEST(2, 8 - (v_answered / 7));

    v_new_rit := v_current_rit + CASE WHEN v_is_correct THEN v_step ELSE -v_step END;
    v_new_rit := GREATEST(100, LEAST(350, v_new_rit));

    v_seq := v_answered;

    INSERT INTO test_responses (
        session_id, question_id, sequence_number, subject,
        difficulty_rit_at_serve, student_answer, is_correct,
        time_spent_seconds, rit_estimate_after
    ) VALUES (
        p_session_id, p_question_id, v_seq, v_subject,
        v_difficulty, p_answer, v_is_correct, p_time_spent, v_new_rit
    );

    IF v_subject = 'math' THEN
        UPDATE test_sessions
        SET current_rit_math = v_new_rit, questions_answered = v_answered
        WHERE id = p_session_id;
    ELSE
        UPDATE test_sessions
        SET current_rit_english = v_new_rit, questions_answered = v_answered
        WHERE id = p_session_id;
    END IF;

    IF v_answered >= 40 THEN
        PERFORM finalize_session(p_session_id);
    END IF;

    RETURN json_build_object(
        'is_correct', v_is_correct,
        'correct_answer', v_correct,
        'new_rit', v_new_rit,
        'subject', v_subject,
        'questions_answered', v_answered,
        'finished', v_answered >= 40
    );
END $$;

GRANT EXECUTE ON FUNCTION submit_answer(UUID, UUID, CHAR(1), INT) TO authenticated;

-- ----- 3. Replenishment queue + RPCs --------------------------------------

CREATE TABLE IF NOT EXISTS replenishment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES test_sessions(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES profiles(id),
    subject subject_type NOT NULL,
    grade_band INT NOT NULL,
    target_rit INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','fulfilling','fulfilled','failed')),
    questions_generated INT DEFAULT 0,
    fulfilled_by UUID REFERENCES profiles(id),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    fulfilled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_repl_pending
    ON replenishment_requests(status, created_at) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_repl_student
    ON replenishment_requests(student_id, created_at DESC);

ALTER TABLE replenishment_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "view replenishment" ON replenishment_requests;
CREATE POLICY "view replenishment" ON replenishment_requests FOR SELECT
    USING (
        student_id = auth.uid()
        OR current_user_role() IN ('teacher','admin')
    );

DROP POLICY IF EXISTS "admin manage replenishment" ON replenishment_requests;
CREATE POLICY "admin manage replenishment" ON replenishment_requests FOR UPDATE
    USING (current_user_role() = 'admin')
    WITH CHECK (current_user_role() = 'admin');

-- Student-initiated request (called when get_next_question returns no row)
CREATE OR REPLACE FUNCTION request_replenishment(p_session_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_student_id UUID;
    v_subject subject_type;
    v_target_rit INT;
    v_grade INT;
    v_answered INT;
    v_request_id UUID;
BEGIN
    SELECT student_id, questions_answered, grade_level_taken
        INTO v_student_id, v_answered, v_grade
    FROM test_sessions WHERE id = p_session_id;

    IF v_student_id <> auth.uid() THEN
        RAISE EXCEPTION 'Not your session';
    END IF;

    v_subject := CASE WHEN v_answered % 2 = 0 THEN 'math' ELSE 'english' END;
    SELECT CASE WHEN v_subject = 'math' THEN current_rit_math ELSE current_rit_english END
        INTO v_target_rit FROM test_sessions WHERE id = p_session_id;

    -- Reuse a recent pending/fulfilling request for the same (student, subject)
    SELECT id INTO v_request_id FROM replenishment_requests
    WHERE student_id = v_student_id
      AND subject = v_subject
      AND status IN ('pending','fulfilling')
      AND created_at > NOW() - INTERVAL '10 minutes'
    ORDER BY created_at DESC
    LIMIT 1;
    IF v_request_id IS NOT NULL THEN
        RETURN v_request_id;
    END IF;

    INSERT INTO replenishment_requests
        (session_id, student_id, subject, grade_band, target_rit)
    VALUES (p_session_id, v_student_id, v_subject, v_grade, v_target_rit)
    RETURNING id INTO v_request_id;

    RETURN v_request_id;
END $$;

GRANT EXECUTE ON FUNCTION request_replenishment(UUID) TO authenticated;

-- Admin claims a pending request (atomic, prevents double-work across tabs)
CREATE OR REPLACE FUNCTION claim_replenishment(p_request_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_rows INT;
BEGIN
    IF current_user_role() <> 'admin' THEN
        RAISE EXCEPTION 'Admin only';
    END IF;
    UPDATE replenishment_requests
    SET status = 'fulfilling', fulfilled_by = auth.uid()
    WHERE id = p_request_id AND status = 'pending';
    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN v_rows > 0;
END $$;

GRANT EXECUTE ON FUNCTION claim_replenishment(UUID) TO authenticated;

-- Admin marks a request fulfilled with N new questions inserted
CREATE OR REPLACE FUNCTION fulfill_replenishment(p_request_id UUID, p_count INT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF current_user_role() <> 'admin' THEN
        RAISE EXCEPTION 'Admin only';
    END IF;
    UPDATE replenishment_requests SET
        status = 'fulfilled',
        questions_generated = p_count,
        fulfilled_at = NOW()
    WHERE id = p_request_id;
END $$;

GRANT EXECUTE ON FUNCTION fulfill_replenishment(UUID, INT) TO authenticated;

-- Admin marks a request failed (e.g., Gemini error)
CREATE OR REPLACE FUNCTION fail_replenishment(p_request_id UUID, p_error TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF current_user_role() <> 'admin' THEN
        RAISE EXCEPTION 'Admin only';
    END IF;
    UPDATE replenishment_requests SET
        status = 'failed',
        error_message = p_error,
        fulfilled_at = NOW()
    WHERE id = p_request_id;
END $$;

GRANT EXECUTE ON FUNCTION fail_replenishment(UUID, TEXT) TO authenticated;
