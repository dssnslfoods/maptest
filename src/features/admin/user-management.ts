import { createClient, type PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database';

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  gradeLevel?: number | null;
  schoolName?: string | null;
  teacherId?: string | null; // admin only — assign a student to a teacher
}

// PostgREST error code for "function not found in schema cache"
const FN_NOT_FOUND = 'PGRST202';
const MIGRATION_HINT =
  'Apply migrations 005 / 008 / 009 in the Supabase dashboard to enable this feature.';

// Create a user from the browser without disturbing the caller's session.
//
//   1. A temp Supabase client (no session persistence) calls auth.signUp().
//      GoTrue creates auth.users + auth.identities and the
//      on_auth_user_created trigger inserts the matching profile.
//   2. The caller's own session finalizes the new user via the RPC matching
//      the target role:
//        - student → teacher_confirm_student (works for teacher + admin)
//        - teacher/admin → admin_confirm_user (admin only)
export async function adminCreateUser(input: CreateUserInput): Promise<string> {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const temp = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `admin-create-${Date.now()}`,
    },
  });

  const { data, error } = await temp.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        role: input.role,
        grade_level: input.gradeLevel != null ? String(input.gradeLevel) : '',
      },
    },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Sign-up returned no user');
  await temp.auth.signOut().catch(() => undefined);

  const userId = data.user.id;

  if (input.role === 'student') {
    const rpc = await supabase.rpc('teacher_confirm_student', {
      p_user_id: userId,
      p_grade_level: input.gradeLevel ?? 0,
      p_school_name: input.schoolName ?? null,
      p_full_name: input.fullName,
      p_teacher_id: input.teacherId ?? null,
    });
    if (rpc.error) {
      if (rpc.error.code === FN_NOT_FOUND) {
        // Migration 009 not applied yet — fall back to direct profile update.
        // teacher_id can't be set from the client without admin rights, but
        // school_name + grade can. Admin can also patch teacher_id directly
        // via the same UPDATE since their RLS allows it.
        await fallbackProfileUpdate(userId, {
          ...input,
          role: 'student',
        });
      } else {
        throw new Error(rpc.error.message);
      }
    }
  } else {
    // teacher / admin — admin-only path
    const rpc = await supabase.rpc('admin_confirm_user', {
      p_user_id: userId,
      p_role: input.role,
      p_grade_level: input.gradeLevel ?? null,
      p_school_name: input.schoolName ?? null,
      p_full_name: input.fullName,
    });
    if (rpc.error) {
      if (rpc.error.code === FN_NOT_FOUND) {
        await fallbackProfileUpdate(userId, input);
      } else {
        throw new Error(rpc.error.message);
      }
    }
  }

  return userId;
}

async function fallbackProfileUpdate(userId: string, input: CreateUserInput): Promise<void> {
  const patch: Record<string, unknown> = {
    full_name: input.fullName,
    role: input.role,
    school_name: input.schoolName ?? null,
    updated_at: new Date().toISOString(),
  };
  if (input.role === 'student') {
    patch.grade_level = input.gradeLevel ?? null;
    if (input.teacherId !== undefined) patch.teacher_id = input.teacherId;
  } else {
    patch.grade_level = null;
  }
  const upd = await supabase.from('profiles').update(patch).eq('id', userId);
  if (upd.error) throw new Error(upd.error.message);
}

// Delete a user. Teachers may only delete their own students; admins anyone.
export async function adminDeleteUser(
  userId: string,
  options: { isStudentOfCaller: boolean; callerRole: UserRole },
): Promise<void> {
  const fn = options.callerRole === 'admin' ? 'admin_delete_user' : 'teacher_delete_student';
  const { error } = await supabase.rpc(fn, { p_user_id: userId });
  if (error) {
    if (error.code === FN_NOT_FOUND) {
      throw new Error(`Delete requires the user-management RPCs. ${MIGRATION_HINT}`);
    }
    throw friendlyError(error);
  }
  // Silence unused warning — kept for API symmetry with caller filter logic.
  void options.isStudentOfCaller;
}

// Reset a user's password.
export async function adminResetPassword(
  userId: string,
  newPassword: string,
  callerRole: UserRole,
): Promise<void> {
  const fn = callerRole === 'admin' ? 'admin_reset_password' : 'teacher_reset_student_password';
  const { error } = await supabase.rpc(fn, {
    p_user_id: userId,
    p_new_password: newPassword,
  });
  if (error) {
    if (error.code === FN_NOT_FOUND) {
      throw new Error(`Password reset requires the user-management RPCs. ${MIGRATION_HINT}`);
    }
    throw friendlyError(error);
  }
}

// Direct profile patch — admin RLS allows all, teacher RLS allows own students.
export async function adminUpdateProfile(
  userId: string,
  updates: {
    full_name?: string;
    role?: UserRole;
    grade_level?: number | null;
    school_name?: string | null;
    teacher_id?: string | null;
  },
): Promise<void> {
  const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
  if (updates.role && updates.role !== 'student') {
    payload.grade_level = null;
    payload.teacher_id = null;
  }
  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  if (error) throw new Error(error.message);
}

function friendlyError(err: PostgrestError): Error {
  return new Error(err.message);
}
