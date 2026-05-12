-- =========================================================================
-- MAP Test System - Initial schema
-- Tables, enums, indexes
-- =========================================================================

-- ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE subject_type AS ENUM ('english', 'math');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE english_strand AS ENUM (
        'reading_literature',
        'reading_informational',
        'vocabulary',
        'language_usage',
        'writing'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE math_strand AS ENUM (
        'operations_algebraic',
        'number_operations',
        'measurement_data',
        'geometry',
        'statistics_probability',
        'ratios_proportions',
        'functions'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PROFILES (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    grade_level INT CHECK (grade_level BETWEEN 0 AND 12),
    school_name TEXT,
    student_id_external TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QUESTION BANK
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject subject_type NOT NULL,
    strand TEXT NOT NULL,
    grade_band INT NOT NULL,
    difficulty_rit INT NOT NULL CHECK (difficulty_rit BETWEEN 100 AND 350),
    question_text TEXT NOT NULL,
    question_image_url TEXT,
    passage_text TEXT,
    choice_a TEXT NOT NULL,
    choice_b TEXT NOT NULL,
    choice_c TEXT NOT NULL,
    choice_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A','B','C','D')),
    explanation TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_subject_difficulty
    ON questions(subject, difficulty_rit) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_questions_grade_band
    ON questions(grade_band) WHERE active = TRUE;

-- TEST SESSIONS
CREATE TABLE IF NOT EXISTS test_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id),
    grade_level_taken INT NOT NULL,
    status session_status NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    current_rit_english INT,
    current_rit_math INT,
    final_rit_english INT,
    final_rit_math INT,
    sem_english INT DEFAULT 3,
    sem_math INT DEFAULT 3,
    questions_answered INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_sessions_student
    ON test_sessions(student_id, completed_at DESC);

-- TEST RESPONSES
CREATE TABLE IF NOT EXISTS test_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    sequence_number INT NOT NULL,
    subject subject_type NOT NULL,
    difficulty_rit_at_serve INT NOT NULL,
    student_answer CHAR(1),
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INT,
    rit_estimate_after INT NOT NULL,
    answered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_session
    ON test_responses(session_id, sequence_number);

-- GROWTH GOALS
CREATE TABLE IF NOT EXISTS growth_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id),
    subject subject_type NOT NULL,
    target_rit INT NOT NULL,
    target_date DATE NOT NULL,
    set_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI-GENERATED QUESTION DRAFTS
CREATE TABLE IF NOT EXISTS question_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_by UUID NOT NULL REFERENCES profiles(id),
    subject subject_type NOT NULL,
    strand TEXT NOT NULL,
    grade_band INT NOT NULL,
    target_rit INT NOT NULL,
    question_text TEXT NOT NULL,
    passage_text TEXT,
    choice_a TEXT NOT NULL,
    choice_b TEXT NOT NULL,
    choice_c TEXT NOT NULL,
    choice_d TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL,
    explanation TEXT,
    ai_model TEXT DEFAULT 'gemini-2.5-flash',
    ai_prompt_used TEXT,
    review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected','edited')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    approved_question_id UUID REFERENCES questions(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drafts_status
    ON question_drafts(review_status, created_at DESC);

-- USER SETTINGS
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    gemini_api_key_encrypted TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
