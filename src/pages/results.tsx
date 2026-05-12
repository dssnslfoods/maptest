import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatStrand, GRADE_LABELS } from '@/lib/utils';
import { approximatePercentile, gradeNorm, performanceBand } from '@/lib/rit';
import type { Question, TestResponse, TestSession } from '@/types/database';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BookOpen, Calculator, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResponseWithQuestion extends TestResponse {
  questions: Pick<Question, 'strand' | 'subject'>;
}

export function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ['session', sessionId],
    enabled: !!sessionId,
    queryFn: async (): Promise<TestSession> => {
      const { data, error } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('id', sessionId!)
        .single();
      if (error) throw error;
      return data as TestSession;
    },
  });

  const { data: responses, isLoading: loadingResp } = useQuery({
    queryKey: ['responses', sessionId],
    enabled: !!sessionId,
    queryFn: async (): Promise<ResponseWithQuestion[]> => {
      const { data, error } = await supabase
        .from('test_responses')
        .select('*, questions(strand, subject)')
        .eq('session_id', sessionId!)
        .order('sequence_number');
      if (error) throw error;
      return (data ?? []) as unknown as ResponseWithQuestion[];
    },
  });

  if (loadingSession || loadingResp) {
    return (
      <div className="container mx-auto space-y-4 p-4 md:p-8">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!session) return <div className="p-8">Session not found.</div>;

  const grade = session.grade_level_taken;
  const finalE = session.final_rit_english ?? session.current_rit_english ?? 0;
  const finalM = session.final_rit_math ?? session.current_rit_math ?? 0;

  const totalSeconds = (responses ?? []).reduce((sum, r) => sum + (r.time_spent_seconds ?? 0), 0);

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/dashboard" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Test results</h1>
          <p className="text-muted-foreground">
            {GRADE_LABELS[grade]} · {responses?.length ?? 0} questions answered
          </p>
        </div>
        <Link to="/progress">
          <Button variant="outline">View all progress</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SubjectScoreCard
          subject="english"
          rit={finalE}
          sem={session.sem_english}
          grade={grade}
          icon={<BookOpen className="h-5 w-5" />}
        />
        <SubjectScoreCard
          subject="math"
          rit={finalM}
          sem={session.sem_math}
          grade={grade}
          icon={<Calculator className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Strand breakdown</CardTitle>
            <CardDescription>Correct / total per content strand</CardDescription>
          </CardHeader>
          <CardContent>
            <StrandBreakdown responses={responses ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Time on task
            </CardTitle>
            <CardDescription>
              {Math.round(totalSeconds / 60)} minutes total ·{' '}
              {(responses ?? []).length > 0
                ? Math.round(totalSeconds / (responses ?? []).length)
                : 0}{' '}
              s avg
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={responses ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sequence_number" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="time_spent_seconds"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name="Seconds"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>RIT trajectory</CardTitle>
          <CardDescription>How the estimate moved across the test</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={buildTrajectory(responses ?? [])}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="seq" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="math" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="english" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function SubjectScoreCard({
  subject,
  rit,
  sem,
  grade,
  icon,
}: {
  subject: 'english' | 'math';
  rit: number;
  sem: number;
  grade: number;
  icon: React.ReactNode;
}) {
  const pct = approximatePercentile(rit, subject, grade);
  const norm = gradeNorm(subject, grade);
  const band = performanceBand(rit, subject, grade);
  const bandLabel = band === 'above' ? 'Above grade' : band === 'below' ? 'Below grade' : 'At grade';
  const bandVariant: 'success' | 'warning' | 'info' =
    band === 'above' ? 'success' : band === 'below' ? 'warning' : 'info';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 capitalize">
          {icon}
          {subject}
        </CardTitle>
        <CardDescription>Final RIT score with measurement error band</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-5xl font-bold tracking-tight">{rit || '—'}</div>
            <div className="text-sm text-muted-foreground">
              RIT {rit ? `${rit - sem} – ${rit + sem}` : ''} · SEM ±{sem}
            </div>
          </div>
          <div className="text-right">
            <Badge variant={bandVariant}>{bandLabel}</Badge>
            <div className="mt-1 text-sm text-muted-foreground">
              Grade norm: <span className="font-medium text-foreground">{norm}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Approx percentile: <span className="font-medium text-foreground">{pct}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StrandBreakdown({ responses }: { responses: ResponseWithQuestion[] }) {
  const map = new Map<string, { strand: string; subject: string; correct: number; total: number }>();
  for (const r of responses) {
    const strand = r.questions?.strand ?? 'unknown';
    const subject = r.questions?.subject ?? r.subject;
    const key = `${subject}:${strand}`;
    const cur = map.get(key) ?? { strand, subject, correct: 0, total: 0 };
    cur.total += 1;
    if (r.is_correct) cur.correct += 1;
    map.set(key, cur);
  }
  const data = Array.from(map.values()).map((d) => ({
    label: `${d.subject[0].toUpperCase()} · ${formatStrand(d.strand)}`,
    correct: d.correct,
    incorrect: d.total - d.correct,
  }));

  if (data.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">No data</div>;
  }
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ left: 90 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={140} />
        <Tooltip />
        <Legend />
        <Bar dataKey="correct" stackId="a" fill="#10b981" />
        <Bar dataKey="incorrect" stackId="a" fill="#f43f5e" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function buildTrajectory(responses: ResponseWithQuestion[]) {
  let lastM = 0;
  let lastE = 0;
  return responses.map((r) => {
    if (r.subject === 'math') lastM = r.rit_estimate_after;
    else lastE = r.rit_estimate_after;
    return { seq: r.sequence_number, math: lastM || null, english: lastE || null };
  });
}
