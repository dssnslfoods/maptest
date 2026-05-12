import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

export function useAuth() {
  const { session, profile, loading, setSession, setProfile, setLoading, reset } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (userId: string) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (mounted) setProfile(data ?? null);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        reset();
      }
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { session, profile, loading };
}

export function useSignOut() {
  const reset = useAuthStore((s) => s.reset);
  return async () => {
    await supabase.auth.signOut();
    reset();
  };
}
