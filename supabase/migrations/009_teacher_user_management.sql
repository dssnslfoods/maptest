-- =========================================================================
-- MAP Test System - Teacher-scoped user management RPCs
-- Lets teachers create / edit / delete / reset-password their OWN students.
-- Admins can call these too and get no scoping limit.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Confirm a freshly-signed-up user and finalize them as a student under a
-- teacher. Teacher callers always assign to themselves; admins may pass an
-- explicit p_teacher_id (defaults to themselves if omitted).
CREATE OR REPLACE FUNCTION teacher_confirm_student(
    p_user_id UUID,
    p_grade_level INT,
    p_school_name TEXT DEFAULT NULL,
    p_full_name TEXT DEFAULT NULL,
    p_teacher_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    v_teacher UUID;
BEGIN
    IF current_user_role() NOT IN ('teacher', 'admin') THEN
        RAISE EXCEPTION 'Teachers or admins only';
    END IF;

    IF current_user_role() = 'admin' THEN
        v_teacher := p_teacher_id;
    ELSE
        v_teacher := auth.uid();
    END IF;

    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = p_user_id;

    UPDATE profiles SET
        full_name = COALESCE(p_full_name, full_name),
        role = 'student',
        grade_level = p_grade_level,
        school_name = p_school_name,
        teacher_id = v_teacher,
        updated_at = NOW()
    WHERE id = p_user_id;
END $$;

GRANT EXECUTE ON FUNCTION teacher_confirm_student(UUID, INT, TEXT, TEXT, UUID) TO authenticated;

-- Delete a student. Teachers can only delete their own students; admins can
-- delete any user via this function (or via admin_delete_user).
CREATE OR REPLACE FUNCTION teacher_delete_student(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    IF current_user_role() NOT IN ('teacher', 'admin') THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot delete your own account';
    END IF;
    IF current_user_role() = 'teacher' THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles
            WHERE id = p_user_id AND role = 'student' AND teacher_id = auth.uid()
        ) THEN
            RAISE EXCEPTION 'Not your student';
        END IF;
    END IF;
    DELETE FROM auth.users WHERE id = p_user_id;
END $$;

GRANT EXECUTE ON FUNCTION teacher_delete_student(UUID) TO authenticated;

-- Reset a student's password. Teacher scoped to own students; admin = any.
CREATE OR REPLACE FUNCTION teacher_reset_student_password(
    p_user_id UUID,
    p_new_password TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    IF current_user_role() NOT IN ('teacher', 'admin') THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    IF length(p_new_password) < 6 THEN
        RAISE EXCEPTION 'Password must be at least 6 characters';
    END IF;
    IF current_user_role() = 'teacher' THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles
            WHERE id = p_user_id AND role = 'student' AND teacher_id = auth.uid()
        ) THEN
            RAISE EXCEPTION 'Not your student';
        END IF;
    END IF;
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = p_user_id;
END $$;

GRANT EXECUTE ON FUNCTION teacher_reset_student_password(UUID, TEXT) TO authenticated;
