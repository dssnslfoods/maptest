import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types/database';

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  gradeLevel?: number | null;
  schoolName?: string | null;
}

// Create a user from the admin browser without disturbing the admin's session.
// 1. Temp Supabase client (no session persistence) calls auth.signUp() — this
//    inserts auth.users + auth.identities and fires the on_auth_user_created
//    trigger that creates the profile row.
// 2. The admin's own session then calls admin_confirm_user RPC to set the
//    role/grade/school and mark the email as confirmed so the new user can
//    sign in immediately without email verification.
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

  // Drop any session the temp client may have stored
  await temp.auth.signOut().catch(() => undefined);

  // Confirm + finalize profile under the admin's session
  const { error: rpcError } = await supabase.rpc('admin_confirm_user', {
    p_user_id: data.user.id,
    p_role: input.role,
    p_grade_level: input.gradeLevel ?? null,
    p_school_name: input.schoolName ?? null,
    p_full_name: input.fullName,
  });
  if (rpcError) throw new Error(`User created but confirmation failed: ${rpcError.message}`);

  return data.user.id;
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId });
  if (error) throw new Error(error.message);
}

export async function adminResetPassword(userId: string, newPassword: string): Promise<void> {
  const { error } = await supabase.rpc('admin_reset_password', {
    p_user_id: userId,
    p_new_password: newPassword,
  });
  if (error) throw new Error(error.message);
}

export async function adminUpdateProfile(
  userId: string,
  updates: { full_name?: string; role?: UserRole; grade_level?: number | null; school_name?: string | null },
): Promise<void> {
  const payload: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
  if (updates.role && updates.role !== 'student') payload.grade_level = null;
  const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
  if (error) throw new Error(error.message);
}
