-- =========================================================================
-- MAP Test System - Admin: delete a completed/abandoned test session
-- Cascades to test_responses (ON DELETE CASCADE).
-- =========================================================================

CREATE OR REPLACE FUNCTION admin_delete_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
    IF current_user_role() <> 'admin' THEN
        RAISE EXCEPTION 'Admin only';
    END IF;
    DELETE FROM test_sessions WHERE id = p_session_id;
END $$;

GRANT EXECUTE ON FUNCTION admin_delete_session(UUID) TO authenticated;
