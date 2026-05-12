import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { GRADE_LABELS } from '@/lib/utils';
import type { TestSession } from '@/types/database';
import { ArrowRight, Calendar, Play } from 'lucide-react';

export function DashboardPage() {
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['dashboard-sessions', profile?.id],
    enabled: !!profile,
    queryFn: async (): Promise<TestSession[]> => {
      const q = supabase
        .from('test_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);
      if (profile?.role === 'student') q.eq('student_id', profile.id);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TestSession[];
    },
  });

  const inProgress = sessions?.find((s) => s.status === 'in_progress');

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {profile?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            {profile?.role === 'student'
              ? 'Track your progress and take a new MAP test'
              : 'Overview of recent student activity'}
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
                      {s.status === 'completed' ? (
                        <Link to={`/results/${s.id}`} className="text-sm text-primary hover:underline">
                          View results
                        </Link>
                      ) : s.status === 'in_progress' && profile?.role === 'student' ? (
                        <Link to={`/test/${s.id}`} className="text-sm text-primary hover:underline">
                          Resume
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
