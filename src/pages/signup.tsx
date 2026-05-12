import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AmbientBackground } from '@/components/ambient-background';
import { DeveloperFooter } from '@/components/developer-footer';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { toast } from 'sonner';
import { BookOpen, Loader2 } from 'lucide-react';
import { GRADE_LABELS } from '@/lib/utils';

export function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [gradeLevel, setGradeLevel] = useState('5');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const session = useAuthStore((s) => s.session);

  if (session) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          grade_level: role === 'student' ? gradeLevel : '',
        },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created. Sign in to continue.');
      navigate('/login');
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
              <BookOpen className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">MAP Test</span>
          </div>
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>Sign up as a student, teacher, or admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
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
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as typeof role)}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </Select>
              </div>
              {role === 'student' && (
                <div className="space-y-1.5">
                  <Label htmlFor="grade">Grade</Label>
                  <Select
                    id="grade"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                  >
                    {Object.entries(GRADE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
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
