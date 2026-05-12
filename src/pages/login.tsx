import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AmbientBackground } from '@/components/ambient-background';
import { DeveloperFooter } from '@/components/developer-footer';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { BookOpen, Loader2 } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);

  if (session) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back');
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      <AmbientBackground />
      <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md p-2">
        <CardHeader>
          <div className="mb-3 inline-flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]"
              style={{ backgroundImage: 'linear-gradient(135deg, hsl(235 88% 62%), hsl(280 80% 65%))' }}
            >
              <BookOpen className="h-4.5 w-4.5" />
            </span>
            <span className="text-base font-semibold tracking-tight">MAP Test</span>
          </div>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
          <CardDescription>Adaptive measure of academic progress.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@school.edu"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              No account?{' '}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
      </div>
      <DeveloperFooter onAmbient />
    </div>
  );
}
