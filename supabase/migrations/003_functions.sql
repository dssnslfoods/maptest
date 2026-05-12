-- =========================================================================
-- MAP Test System - Database Functions (Adaptive Engine)
-- =========================================================================

-- Start a new test session: seeds RIT from grade-level norms
CREATE OR REPLACE FUNCTION start_test_session(p_grade_level INT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_session_id UUID;
    v_start_math INT;
    v_start_english INT;
BEGIN
    IF p_grade_level IS NULL OR p_grade_level < 0 OR p_grade_level > 12 THEN
        RAISE EXCEPTION 'Invalid grade level: %', p_grade_level;
    END IF;

    v_start_math := CASE p_grade_level
        WHEN 0 THEN 140 WHEN 1 THEN 162 WHEN 2 THEN 177 WHEN 3 THEN 190
        WHEN 4 THEN 201 WHEN 5 THEN 210 WHEN 6 THEN 215 WHEN 7 THEN 219
        WHEN 8 THEN 222 WHEN 9 THEN 226 WHEN 10 THEN 229 WHEN 11 THEN 230
        WHEN 12 THEN 231 ELSE 200 END;

    v_start_english := CASE p_grade_level
        WHEN 0 THEN 142 WHEN 1 THEN 160 WHEN 2 THEN 174 WHEN 3 THEN 188
        WHEN 4 THEN 198 WHEN 5 THEN 206 WHEN 6 THEN 211 WHEN 7 THEN 214
        WHEN 8 THEN 217 WHEN 9 THEN 220 WHEN 10 THEN 223 WHEN 11 THEN 224
        WHEN 12 THEN 225 ELSE 200 END;

    INSERT INTO test_sessions (
        student_id, grade_level_taken, current_rit_math, current_rit_english
    ) VALUES (
        auth.uid(), p_grade_level, v_start_math, v_start_english
    ) RETURNING id INTO v_session_id;

    RETURN v_session_id;
END $$;

GRANT EXECUTE ON FUNCTION start_test_session(INT) TO authenticated;

-- Get next adaptive question for a session
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
    v_search_radius INT := 5;
BEGIN
    SELECT student_id, questions_answered INTO v_student_id, v_answered
    FROM test_sessions WHERE id = p_session_id;

    IF v_student_id <> auth.uid() AND current_user_role() NOT IN ('teacher','admin') THEN
        RAISE EXCEPTION 'Not authorized to read session';
    END IF;

    v_next_subject := CASE WHEN v_answered % 2 = 0 THEN 'math' ELSE 'english' END;

    SELECT CASE WHEN v_next_subject = 'math' THEN current_rit_math ELSE current_rit_english END
        INTO v_current_rit FROM test_sessions WHERE id = p_session_id;

    -- Expand search radius gradually if the strict ±5 has no candidates
    WHILE v_search_radius <= 50 LOOP
        RETURN QUERY
        SELECT q.id, q.subject, q.question_text, q.passage_text, q.question_image_url,
               q.choice_a, q.choice_b, q.choice_c, q.choice_d, q.difficulty_rit
        FROM questions q
        WHERE q.subject = v_next_subject
          AND q.active = TRUE
          AND q.difficulty_rit BETWEEN v_current_rit - v_search_radius
                                   AND v_current_rit + v_search_radius
          AND q.id NOT IN (
              SELECT question_id FROM test_responses WHERE session_id = p_session_id
          )
        ORDER BY ABS(q.difficulty_rit - v_current_rit), RANDOM()
        LIMIT 1;

        IF FOUND THEN RETURN; END IF;
        v_search_radius := v_search_radius + 10;
    END LOOP;

    RETURN;
END $$;

GRANT EXECUTE ON FUNCTION get_next_question(UUID) TO authenticated;

-- Submit answer, update RIT, possibly finalize
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

    -- Step size decays: 8 -> 2 over 40 questions
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

-- Finalize session: compute final RIT from last 10 items per subject
CREATE OR REPLACE FUNCTION finalize_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_final_math INT;
    v_final_english INT;
BEGIN
    SELECT ROUND(AVG(difficulty_rit_at_serve))::INT INTO v_final_math
    FROM (
        SELECT difficulty_rit_at_serve FROM test_responses
        WHERE session_id = p_session_id AND subject = 'math'
        ORDER BY sequence_number DESC LIMIT 10
    ) t;

    SELECT ROUND(AVG(difficulty_rit_at_serve))::INT INTO v_final_english
    FROM (
        SELECT difficulty_rit_at_serve FROM test_responses
        WHERE session_id = p_session_id AND subject = 'english'
        ORDER BY sequence_number DESC LIMIT 10
    ) t;

    UPDATE test_sessions
    SET status = 'completed',
        completed_at = NOW(),
        final_rit_math = v_final_math,
        final_rit_english = v_final_english
    WHERE id = p_session_id;
END $$;

GRANT EXECUTE ON FUNCTION finalize_session(UUID) TO authenticated;

-- Manually abandon a session (student leaves test)
CREATE OR REPLACE FUNCTION abandon_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_student_id UUID;
BEGIN
    SELECT student_id INTO v_student_id FROM test_sessions WHERE id = p_session_id;
    IF v_student_id <> auth.uid() THEN
        RAISE EXCEPTION 'Not the session owner';
    END IF;
    UPDATE test_sessions
    SET status = 'abandoned', completed_at = NOW()
    WHERE id = p_session_id AND status = 'in_progress';
END $$;

GRANT EXECUTE ON FUNCTION abandon_session(UUID) TO authenticated;

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    INSERT INTO profiles (id, full_name, role, grade_level)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'),
        NULLIF(NEW.raw_user_meta_data->>'grade_level','')::INT
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Recalibrate a single question based on observed performance
CREATE OR REPLACE FUNCTION recalibrate_question(p_question_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_attempts INT;
    v_avg_rit_correct NUMERIC;
    v_avg_rit_incorrect NUMERIC;
    v_new_difficulty INT;
BEGIN
    IF current_user_role() <> 'admin' THEN
        RAISE EXCEPTION 'Admin only';
    END IF;

    SELECT COUNT(*) INTO v_attempts FROM test_responses WHERE question_id = p_question_id;
    IF v_attempts < 30 THEN RETURN; END IF;

    SELECT AVG(rit_estimate_after) INTO v_avg_rit_correct
        FROM test_responses WHERE question_id = p_question_id AND is_correct = TRUE;
    SELECT AVG(rit_estimate_after) INTO v_avg_rit_incorrect
        FROM test_responses WHERE question_id = p_question_id AND is_correct = FALSE;

    v_new_difficulty := ROUND(
        (COALESCE(v_avg_rit_correct, 200) + COALESCE(v_avg_rit_incorrect, 200)) / 2
    )::INT;

    UPDATE questions SET difficulty_rit = v_new_difficulty WHERE id = p_question_id;
END $$;

GRANT EXECUTE ON FUNCTION recalibrate_question(UUID) TO authenticated;

-- Bulk recalibrate every eligible question
CREATE OR REPLACE FUNCTION recalibrate_all_questions()
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_count INT := 0;
    rec RECORD;
BEGIN
    IF current_user_role() <> 'admin' THEN
        RAISE EXCEPTION 'Admin only';
    END IF;

    FOR rec IN
        SELECT question_id
        FROM test_responses
        GROUP BY question_id
        HAVING COUNT(*) >= 30
    LOOP
        PERFORM recalibrate_question(rec.question_id);
        v_count := v_count + 1;
    END LOOP;
    RETURN v_count;
END $$;

GRANT EXECUTE ON FUNCTION recalibrate_all_questions() TO authenticated;

-- Approve a draft into the live questions table
CREATE OR REPLACE FUNCTION approve_draft(p_draft_id UUID, p_grade_band INT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_question_id UUID;
    d question_drafts%ROWTYPE;
BEGIN
    IF current_user_role() <> 'admin' THEN
        RAISE EXCEPTION 'Admin only';
    END IF;

    SELECT * INTO d FROM question_drafts WHERE id = p_draft_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Draft not found'; END IF;
    IF d.review_status = 'approved' THEN
        RETURN d.approved_question_id;
    END IF;

    INSERT INTO questions (
        subject, strand, grade_band, difficulty_rit,
        question_text, passage_text,
        choice_a, choice_b, choice_c, choice_d,
        correct_answer, explanation, active
    ) VALUES (
        d.subject, d.strand, COALESCE(p_grade_band, d.grade_band), d.target_rit,
        d.question_text, d.passage_text,
        d.choice_a, d.choice_b, d.choice_c, d.choice_d,
        d.correct_answer, d.explanation, TRUE
    ) RETURNING id INTO v_question_id;

    UPDATE question_drafts
    SET review_status = 'approved',
        reviewed_by = auth.uid(),
        reviewed_at = NOW(),
        approved_question_id = v_question_id
    WHERE id = p_draft_id;

    RETURN v_question_id;
END $$;

GRANT EXECUTE ON FUNCTION approve_draft(UUID, INT) TO authenticated;
