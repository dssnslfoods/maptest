-- =========================================================================
-- MAP Test System - RLS Policies
-- =========================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role (SECURITY DEFINER bypasses RLS recursion)
CREATE OR REPLACE FUNCTION current_user_role() RETURNS user_role
LANGUAGE SQL SECURITY DEFINER STABLE
SET search_path = public AS $$
    SELECT role FROM profiles WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION current_user_role() TO authenticated;

-- PROFILES
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
CREATE POLICY "Users view own profile" ON profiles FOR SELECT
    USING (id = auth.uid() OR current_user_role() IN ('teacher','admin'));

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE
    USING (id = auth.uid() OR current_user_role() = 'admin');

DROP POLICY IF EXISTS "Admins insert profiles" ON profiles;
CREATE POLICY "Admins insert profiles" ON profiles FOR INSERT
    WITH CHECK (current_user_role() = 'admin' OR id = auth.uid());

-- QUESTIONS
DROP POLICY IF EXISTS "Authenticated read questions" ON questions;
CREATE POLICY "Authenticated read questions" ON questions FOR SELECT
    USING (auth.role() = 'authenticated' AND active = TRUE);

DROP POLICY IF EXISTS "Admins manage questions" ON questions;
CREATE POLICY "Admins manage questions" ON questions FOR ALL
    USING (current_user_role() = 'admin')
    WITH CHECK (current_user_role() = 'admin');

-- TEST SESSIONS
DROP POLICY IF EXISTS "Students view own sessions" ON test_sessions;
CREATE POLICY "Students view own sessions" ON test_sessions FOR SELECT
    USING (student_id = auth.uid() OR current_user_role() IN ('teacher','admin'));

DROP POLICY IF EXISTS "Students create own sessions" ON test_sessions;
CREATE POLICY "Students create own sessions" ON test_sessions FOR INSERT
    WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students update own active session" ON test_sessions;
CREATE POLICY "Students update own active session" ON test_sessions FOR UPDATE
    USING (student_id = auth.uid() AND status = 'in_progress');

-- TEST RESPONSES
DROP POLICY IF EXISTS "Students view own responses" ON test_responses;
CREATE POLICY "Students view own responses" ON test_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM test_sessions s
            WHERE s.id = session_id
              AND (s.student_id = auth.uid() OR current_user_role() IN ('teacher','admin'))
        )
    );

DROP POLICY IF EXISTS "Students insert own responses" ON test_responses;
CREATE POLICY "Students insert own responses" ON test_responses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM test_sessions s
            WHERE s.id = session_id
              AND s.student_id = auth.uid()
              AND s.status = 'in_progress'
        )
    );

-- GROWTH GOALS
DROP POLICY IF EXISTS "View own goals" ON growth_goals;
CREATE POLICY "View own goals" ON growth_goals FOR SELECT
    USING (student_id = auth.uid() OR current_user_role() IN ('teacher','admin'));

DROP POLICY IF EXISTS "Teachers manage goals" ON growth_goals;
CREATE POLICY "Teachers manage goals" ON growth_goals FOR ALL
    USING (current_user_role() IN ('teacher','admin'))
    WITH CHECK (current_user_role() IN ('teacher','admin'));

-- QUESTION DRAFTS (admin only)
DROP POLICY IF EXISTS "Admins manage drafts" ON question_drafts;
CREATE POLICY "Admins manage drafts" ON question_drafts FOR ALL
    USING (current_user_role() = 'admin')
    WITH CHECK (current_user_role() = 'admin');

-- USER SETTINGS (own row only)
DROP POLICY IF EXISTS "Own settings" ON user_settings;
CREATE POLICY "Own settings" ON user_settings FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
