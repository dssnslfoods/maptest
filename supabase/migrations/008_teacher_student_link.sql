-- =========================================================================
-- MAP Test System - Teacher ↔ Student membership
--
-- A student belongs to one teacher. Teachers can only see and manage the
-- students assigned to them. Admins see and manage everything.
-- =========================================================================

-- 1. Add the teacher_id column on profiles (self-reference)
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_teacher_id
    ON profiles(teacher_id) WHERE role = 'student';

-- 2. Backfill: assign every existing student that has no teacher to the
--    earliest-created teacher account. If there is no teacher yet this is a
--    no-op (NULL update).
UPDATE profiles
SET teacher_id = (
    SELECT id FROM profiles
    WHERE role = 'teacher'
    ORDER BY created_at
    LIMIT 1
)
WHERE role = 'student' AND teacher_id IS NULL;

-- 3. RLS: PROFILES
--    - everyone sees their own row
--    - admins see everyone
--    - teachers see their own students (and themselves via the first clause)
DROP POLICY IF EXISTS "Users view own profile" ON profiles;
DROP POLICY IF EXISTS "View profiles" ON profiles;
CREATE POLICY "View profiles" ON profiles FOR SELECT
    USING (
        id = auth.uid()
        OR current_user_role() = 'admin'
        OR (current_user_role() = 'teacher' AND teacher_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
DROP POLICY IF EXISTS "Update profiles" ON profiles;
CREATE POLICY "Update profiles" ON profiles FOR UPDATE
    USING (
        id = auth.uid()
        OR current_user_role() = 'admin'
        OR (current_user_role() = 'teacher' AND teacher_id = auth.uid())
    );

-- 4. RLS: TEST_SESSIONS
DROP POLICY IF EXISTS "Students view own sessions" ON test_sessions;
DROP POLICY IF EXISTS "View sessions" ON test_sessions;
CREATE POLICY "View sessions" ON test_sessions FOR SELECT
    USING (
        student_id = auth.uid()
        OR current_user_role() = 'admin'
        OR (
            current_user_role() = 'teacher'
            AND EXISTS (
                SELECT 1 FROM profiles p
                WHERE p.id = student_id AND p.teacher_id = auth.uid()
            )
        )
    );

-- 5. RLS: TEST_RESPONSES
DROP POLICY IF EXISTS "Students view own responses" ON test_responses;
DROP POLICY IF EXISTS "View responses" ON test_responses;
CREATE POLICY "View responses" ON test_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM test_sessions s
            WHERE s.id = session_id AND (
                s.student_id = auth.uid()
                OR current_user_role() = 'admin'
                OR (
                    current_user_role() = 'teacher'
                    AND EXISTS (
                        SELECT 1 FROM profiles p
                        WHERE p.id = s.student_id AND p.teacher_id = auth.uid()
                    )
                )
            )
        )
    );

-- 6. RLS: GROWTH_GOALS
DROP POLICY IF EXISTS "View own goals" ON growth_goals;
DROP POLICY IF EXISTS "View goals" ON growth_goals;
CREATE POLICY "View goals" ON growth_goals FOR SELECT
    USING (
        student_id = auth.uid()
        OR current_user_role() = 'admin'
        OR (
            current_user_role() = 'teacher'
            AND EXISTS (
                SELECT 1 FROM profiles p
                WHERE p.id = student_id AND p.teacher_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Teachers manage goals" ON growth_goals;
DROP POLICY IF EXISTS "Manage goals" ON growth_goals;
CREATE POLICY "Manage goals" ON growth_goals FOR ALL
    USING (
        current_user_role() = 'admin'
        OR (
            current_user_role() = 'teacher'
            AND EXISTS (
                SELECT 1 FROM profiles p
                WHERE p.id = student_id AND p.teacher_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        current_user_role() = 'admin'
        OR (
            current_user_role() = 'teacher'
            AND EXISTS (
                SELECT 1 FROM profiles p
                WHERE p.id = student_id AND p.teacher_id = auth.uid()
            )
        )
    );
