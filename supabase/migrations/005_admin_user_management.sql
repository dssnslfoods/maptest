-- =========================================================================
-- MAP Test System - Admin user management RPCs
-- Lets admins create/edit/delete users from the Settings page without
-- exposing the service_role key to the frontend.
--
-- Flow for "create user":
--   1. Admin browser calls supabase.auth.signUp() via a temp client.
--      This creates auth.users row + identity (handled by GoTrue) and the
--      on_auth_user_created trigger inserts the matching profile.
--   2. Admin's own session then calls admin_confirm_user() RPC to:
--      - Mark email as confirmed (skip email verification)
--      - Set role, grade_level, school_name on the profile
-- =========================================================================

-- Confirm a freshly-signed-up user and assign their role / metadata
CREATE OR REPLACE FUNCTION admin_confirm_user(
    p_user_id UUID,
    p_role user_role,
    p_grade_level INT DEFAULT NULL,
    p_school_name TEXT DEFAULT NULL,
    p_full_name TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    IF current_user_role() <> 'admin' THEN
        RAISE EXCEPTION 'Admin only';
    END IF;

    -- Mark email confirmed so the new user can sign in immediately
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Set role / grade / school on the profile
    UPDATE profiles SET
        full_name = COALESCE(p_full_name, full_name),
        role = p_role,
        grade_level = CASE WHEN p_role = 'student' THEN p_grade_level ELSE NULL END,
        school_name = p_school_name,
        updated_at = NOW()
    WHERE id = p_user_id;
END $$;

GRANT EXECUTE ON FUNCTION admin_confirm_user(UUID, user_role, INT, TEXT, TEXT) TO authenticated;

-- Delete a user (cascades to profiles, sessions, responses, etc.)
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    IF current_user_role() <> 'admin' THEN
        RAISE EXCEPTION 'Admin only';
    END IF;
    IF p_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot delete your own account';
    END IF;
    DELETE FROM auth.users WHERE id = p_user_id;
END $$;

GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;

-- Reset a user's password (admin-initiated). Uses pgcrypto bcrypt hash
-- compatible with GoTrue's verifier.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION admin_reset_password(
    p_user_id UUID,
    p_new_password TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    IF current_user_role() <> 'admin' THEN
        RAISE EXCEPTION 'Admin only';
    END IF;
    IF length(p_new_password) < 6 THEN
        RAISE EXCEPTION 'Password must be at least 6 characters';
    END IF;
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = NOW()
    WHERE id = p_user_id;
END $$;

GRANT EXECUTE ON FUNCTION admin_reset_password(UUID, TEXT) TO authenticated;
