-- =========================================================================
-- MAP Test System - Performance: get_next_question
-- Replaces the iterative-radius WHILE loop with a single query that already
-- ranks candidates by closeness to the current RIT (with a strong preference
-- for the ±5 band). One query instead of up to ~6 iterations of the same
-- expensive question scan.
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
BEGIN
    SELECT student_id, questions_answered INTO v_student_id, v_answered
    FROM test_sessions WHERE id = p_session_id;

    IF v_student_id <> auth.uid() AND current_user_role() NOT IN ('teacher','admin') THEN
        RAISE EXCEPTION 'Not authorized to read session';
    END IF;

    v_next_subject := CASE WHEN v_answered % 2 = 0 THEN 'math' ELSE 'english' END;

    SELECT CASE WHEN v_next_subject = 'math' THEN current_rit_math ELSE current_rit_english END
        INTO v_current_rit FROM test_sessions WHERE id = p_session_id;

    -- Single query — ranks candidates by:
    --   1. inside-±5 first (preserves the spec's adaptive band)
    --   2. then absolute distance to the current RIT
    --   3. then random tie-break
    -- This replaces a WHILE loop that re-ran the same scan up to ~6 times.
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
        ABS(q.difficulty_rit - v_current_rit),
        RANDOM()
    LIMIT 1;
END $$;

GRANT EXECUTE ON FUNCTION get_next_question(UUID) TO authenticated;
