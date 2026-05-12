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
}

// PostgREST error code for "function not found in schema cache"
const FN_NOT_FOUND = 'PGRST202';

const MIGRATION_HINT =
  'Apply migration 005_admin_user_management.sql in the Supabase dashboard to enable this feature.';

// Create a user from the admin browser without disturbing the admin's session.
//
// Flow:
//   1. A temp Supabase client (no session persistence) calls auth.signUp().
//      GoTrue creates auth.users + auth.identities and the
//      on_auth_user_created trigger inserts the matching profile with
//      role/full_name/grade_level taken from raw_user_meta_data.
//   2. We try the admin_confirm_user RPC for school_name + email confirmation.
//      If the RPC doesn't exist yet (migration 005 not applied), we fall back
//      to a direct UPDATE on profiles for school_name. The Supabase project
//      already auto-confirms emails, so the user can sign in either way.
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

  // Try the RPC first
  const rpc = await supabase.rpc('admin_confirm_user', {
    p_user_id: data.user.id,
    p_role: input.role,
    p_grade_level: input.gradeLevel ?? null,
    p_school_name: input.schoolName ?? null,
    p_full_name: input.fullName,
  });

  if (rpc.error) {
    // Migration 005 not applied yet — fall back to direct profile update.
    // The trigger already filled in role/grade_level/full_name from metadata.
    // We only need to set school_name (which the trigger doesn't touch).
    if (rpc.error.code === FN_NOT_FOUND && input.schoolName) {
      const upd = await supabase
        .from('profiles')
        .update({ school_name: input.schoolName })
        .eq('id', data.user.id);
      if (upd.error) throw new Error(upd.error.message);
    } else if (rpc.error.code !== FN_NOT_FOUND) {
      throw new Error(rpc.error.message);
    }
  }

  return data.user.id;
}

export async function adminDeleteUser(userId: string): Promise<void> {
  const { error } = await supabase.rpc('admin_delete_user', { p_user_id: userId });
  if (error) throw friendlyError(error, 'delete');
}

export async function adminResetPassword(userId: string, newPassword: string): Promise<void> {
  const { error } = await supabase.rpc('admin_reset_password', {
    p_user_id: userId,
    p_new_password: newPassword,
  });
  if (error) throw friendlyError(error, 'reset_password');
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

function friendlyError(err: PostgrestError, _action: 'delete' | 'reset_password'): Error {
  if (err.code === FN_NOT_FOUND) {
    return new Error(`This action requires the admin user-management RPCs. ${MIGRATION_HINT}`);
  }
  return new Error(err.message);
}
