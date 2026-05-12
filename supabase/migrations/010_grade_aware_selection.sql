-- =========================================================================
-- MAP Test System - Grade-aware question selection
--
-- Same adaptive philosophy as before (RIT-first), but adds a tiered grade
-- preference so two students at the same RIT but different grade levels are
-- more likely to receive grade-appropriate content when one exists.
--
-- Tie-break order:
--   1. inside ±5 RIT band  (the adaptive band — top priority)
--   2. grade-band proximity bucket
--        bucket 0  →  within ±1 grade
--        bucket 1  →  within ±3 grades
--        bucket 2  →  anything else
--   3. absolute RIT distance
--   4. random
--
-- The ±5 RIT band still beats grade match, so the adaptive algorithm keeps
-- working when the bank is thin at the student's grade — we just never
-- gratuitously hand a grade-3 child an 8th-grade item if a grade-3 item at
-- the same RIT exists.
-- =========================================================================

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
          SELECT 1 FROM test_responses r
          WHERE r.session_id = p_session_id AND r.question_id = q.id
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
