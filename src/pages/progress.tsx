import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { GRADE_LABELS } from '@/lib/utils';
import type { GrowthGoal, TestSession } from '@/types/database';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function ProgressPage() {
  const profile = useAuthStore((s) => s.profile);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['progress-sessions', profile?.id],
    enabled: !!profile,
    queryFn: async (): Promise<TestSession[]> => {
      const { data, error } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('student_id', profile!.id)
        .eq('status', 'completed')
        .order('completed_at');
      if (error) throw error;
      return (data ?? []) as TestSession[];
    },
  });

  const { data: goals } = useQuery({
    queryKey: ['progress-goals', profile?.id],
    enabled: !!profile,
    queryFn: async (): Promise<GrowthGoal[]> => {
      const { data, error } = await supabase
        .from('growth_goals')
        .select('*')
        .eq('student_id', profile!.id);
      if (error) throw error;
      return (data ?? []) as GrowthGoal[];
    },
  });

  const chartData =
    sessions?.map((s) => ({
      date: format(new Date(s.completed_at ?? s.started_at), 'MMM d'),
      english: s.final_rit_english,
      math: s.final_rit_math,
    })) ?? [];

  const englishGoal = goals?.find((g) => g.subject === 'english');
  const mathGoal = goals?.find((g) => g.subject === 'math');

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My progress</h1>
        <p className="text-muted-foreground">RIT growth across completed tests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>RIT over time</CardTitle>
          <CardDescription>
            {(goals?.length ?? 0) > 0
              ? 'Dashed lines show your growth goals'
              : 'Complete more tests to see a trend'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-72" />
          ) : chartData.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No completed sessions yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="english" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="math" stroke="#0ea5e9" strokeWidth={2} />
                {englishGoal && (
                  <ReferenceLine
                    y={englishGoal.target_rit}
                    stroke="#10b981"
                    strokeDasharray="5 5"
                    label={{ value: `Eng goal ${englishGoal.target_rit}`, fontSize: 10, fill: '#10b981' }}
                  />
                )}
                {mathGoal && (
                  <ReferenceLine
                    y={mathGoal.target_rit}
                    stroke="#0ea5e9"
                    strokeDasharray="5 5"
                    label={{ value: `Math goal ${mathGoal.target_rit}`, fontSize: 10, fill: '#0ea5e9' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>English</TableHead>
                  <TableHead>Math</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sessions ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{format(new Date(s.completed_at ?? s.started_at), 'PP')}</TableCell>
                    <TableCell>{GRADE_LABELS[s.grade_level_taken]}</TableCell>
                    <TableCell>{s.final_rit_english}</TableCell>
                    <TableCell>{s.final_rit_math}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/results/${s.id}`} className="text-sm text-primary hover:underline">
                        View
                      </Link>
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
