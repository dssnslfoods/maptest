// Manual lightweight typing of the Supabase schema. Keeps `supabase.from(...)` generic.
// Regenerate using `supabase gen types typescript` after schema changes.

export type UserRole = 'student' | 'teacher' | 'admin';
export type Subject = 'english' | 'math';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  grade_level: number | null;
  school_name: string | null;
  student_id_external: string | null;
  teacher_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  subject: Subject;
  strand: string;
  grade_band: number;
  difficulty_rit: number;
  question_text: string;
  question_image_url: string | null;
  passage_text: string | null;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  active: boolean;
  created_at: string;
}

export interface TestSession {
  id: string;
  student_id: string;
  grade_level_taken: number;
  status: SessionStatus;
  started_at: string;
  completed_at: string | null;
  current_rit_english: number | null;
  current_rit_math: number | null;
  final_rit_english: number | null;
  final_rit_math: number | null;
  sem_english: number;
  sem_math: number;
  questions_answered: number;
  created_at: string;
}

export interface TestResponse {
  id: string;
  session_id: string;
  question_id: string;
  sequence_number: number;
  subject: Subject;
  difficulty_rit_at_serve: number;
  student_answer: string | null;
  is_correct: boolean;
  time_spent_seconds: number | null;
  rit_estimate_after: number;
  answered_at: string;
}

export interface GrowthGoal {
  id: string;
  student_id: string;
  subject: Subject;
  target_rit: number;
  target_date: string;
  set_by: string | null;
  created_at: string;
}

export interface QuestionDraft {
  id: string;
  generated_by: string;
  subject: Subject;
  strand: string;
  grade_band: number;
  target_rit: number;
  question_text: string;
  passage_text: string | null;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string | null;
  ai_model: string;
  ai_prompt_used: string | null;
  review_status: 'pending' | 'approved' | 'rejected' | 'edited';
  reviewed_by: string | null;
  reviewed_at: string | null;
  approved_question_id: string | null;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  gemini_api_key_encrypted: string | null;
  preferences: Record<string, unknown>;
  updated_at: string;
}

export interface NextQuestion {
  question_id: string;
  subject: Subject;
  question_text: string;
  passage_text: string | null;
  question_image_url: string | null;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  difficulty_rit: number;
}

export interface SubmitAnswerResult {
  is_correct: boolean;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  new_rit: number;
  subject: Subject;
  questions_answered: number;
  finished: boolean;
}

// Generic Database type for createClient — schema kept minimal
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; full_name: string }; Update: Partial<Profile> };
      questions: { Row: Question; Insert: Omit<Question, 'id' | 'created_at'>; Update: Partial<Question> };
      test_sessions: { Row: TestSession; Insert: Partial<TestSession>; Update: Partial<TestSession> };
      test_responses: { Row: TestResponse; Insert: Partial<TestResponse>; Update: Partial<TestResponse> };
      growth_goals: { Row: GrowthGoal; Insert: Partial<GrowthGoal>; Update: Partial<GrowthGoal> };
      question_drafts: { Row: QuestionDraft; Insert: Partial<QuestionDraft>; Update: Partial<QuestionDraft> };
      user_settings: { Row: UserSettings; Insert: Partial<UserSettings>; Update: Partial<UserSettings> };
    };
    Views: Record<string, never>;
    Functions: {
      start_test_session: { Args: { p_grade_level: number }; Returns: string };
      get_next_question: { Args: { p_session_id: string }; Returns: NextQuestion[] };
      submit_answer: {
        Args: { p_session_id: string; p_question_id: string; p_answer: string; p_time_spent: number };
        Returns: SubmitAnswerResult;
      };
      finalize_session: { Args: { p_session_id: string }; Returns: null };
      abandon_session: { Args: { p_session_id: string }; Returns: null };
      recalibrate_question: { Args: { p_question_id: string }; Returns: null };
      recalibrate_all_questions: { Args: Record<string, never>; Returns: number };
      approve_draft: { Args: { p_draft_id: string; p_grade_band?: number }; Returns: string };
    };
    Enums: { user_role: UserRole; subject_type: Subject };
  };
};
