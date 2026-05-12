import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { GRADE_LABELS } from '@/lib/utils';
import type { TestSession } from '@/types/database';

interface DashboardSession extends TestSession {
  profiles: { full_name: string | null; school_name: string | null } | null;
}
import { ArrowRight, Calendar, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function DashboardPage() {
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isAdmin = profile?.role === 'admin';
  const isTeacherOrAdmin = profile?.role === 'teacher' || profile?.role === 'admin';

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['dashboard-sessions', profile?.id],
    enabled: !!profile,
    queryFn: async (): Promise<DashboardSession[]> => {
      const q = supabase
        .from('test_sessions')
        .select('*, profiles:student_id(full_name, school_name)')
        .order('started_at', { ascending: false })
        .limit(10);
      if (profile?.role === 'student') q.eq('student_id', profile.id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as DashboardSession[];
    },
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('admin_delete_session', { p_session_id: id });
      if (error) {
        if (error.code === 'PGRST202') {
          throw new Error(
            'This action requires migration 007_admin_delete_session.sql to be applied in the Supabase dashboard.',
          );
        }
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success('Session deleted');
      qc.invalidateQueries({ queryKey: ['dashboard-sessions'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const inProgress = sessions?.find((s) => s.status === 'in_progress');

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
            {profile?.role === 'student' ? 'Student' : profile?.role === 'teacher' ? 'Teacher' : 'Admin'}
          </p>
          <h1 className="mt-1 text-4xl font-bold tracking-tight">
            Welcome, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {profile?.role === 'student'
              ? 'Track your progress and take a new MAP test.'
              : 'Overview of recent student activity.'}
          </p>
        </div>
        {profile?.role === 'student' && (
          <Button size="lg" onClick={() => navigate(inProgress ? `/test/${inProgress.id}` : '/test/setup')}>
            <Play className="h-4 w-4" />
            {inProgress ? 'Resume test' : 'Start new test'}
          </Button>
        )}
      </div>

      {inProgress && profile?.role === 'student' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">Test in progress</CardTitle>
            <CardDescription className="text-amber-900/80">
              You have an unfinished test from {format(new Date(inProgress.started_at), 'PP')} — answered{' '}
              {inProgress.questions_answered}/40 questions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(`/test/${inProgress.id}`)} variant="default">
              Resume <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
          <CardDescription>
            {profile?.role === 'student' ? 'Your past tests' : 'All recent test sessions'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !sessions || sessions.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              <Calendar className="mx-auto mb-2 h-8 w-8 opacity-50" />
              No test sessions yet.
              {profile?.role === 'student' && (
                <div className="mt-3">
                  <Link to="/test/setup" className="text-primary hover:underline">
                    Start your first test →
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  {isTeacherOrAdmin && <TableHead>Student</TableHead>}
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>English RIT</TableHead>
                  <TableHead>Math RIT</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(s.started_at), 'PP')}
                    </TableCell>
                    {isTeacherOrAdmin && (
                      <TableCell>
                        <div className="font-medium leading-tight">
                          {s.profiles?.full_name ?? '—'}
                        </div>
                        {s.profiles?.school_name && (
                          <div className="text-xs text-muted-foreground">
                            {s.profiles.school_name}
                          </div>
                        )}
                      </TableCell>
                    )}
                    <TableCell>{GRADE_LABELS[s.grade_level_taken]}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === 'completed'
                            ? 'success'
                            : s.status === 'in_progress'
                              ? 'warning'
                              : 'secondary'
                        }
                      >
                        {s.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.final_rit_english ?? s.current_rit_english ?? '—'}</TableCell>
                    <TableCell>{s.final_rit_math ?? s.current_rit_math ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.status === 'completed' ? (
                          <Link
                            to={`/results/${s.id}`}
                            className="rounded-lg px-2 py-1 text-sm font-medium text-primary hover:bg-white/55"
                          >
                            {isTeacherOrAdmin ? 'Review' : 'View results'}
                          </Link>
                        ) : s.status === 'in_progress' && profile?.role === 'student' ? (
                          <Link
                            to={`/test/${s.id}`}
                            className="rounded-lg px-2 py-1 text-sm font-medium text-primary hover:bg-white/55"
                          >
                            Resume
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {isAdmin && (
                          <Button
                            size="icon"
                            variant="ghost"
                            title="Delete session"
                            onClick={() => {
                              if (
                                confirm(
                                  `Delete this session?\n\nAll ${s.questions_answered} responses will also be deleted. This cannot be undone.`,
                                )
                              ) {
                                deleteSession.mutate(s.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
