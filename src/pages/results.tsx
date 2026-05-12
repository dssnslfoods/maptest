import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatStrand, GRADE_LABELS } from '@/lib/utils';
import { approximatePercentile, gradeNorm, performanceBand } from '@/lib/rit';
import { useAuthStore } from '@/store/auth';
import { MathText } from '@/features/test/question-renderer';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  questions: Question | null;
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
        .select('*, questions(*)')
        .eq('session_id', sessionId!)
        .order('sequence_number');
      if (error) throw error;
      return (data ?? []) as unknown as ResponseWithQuestion[];
    },
  });

  const profile = useAuthStore((s) => s.profile);
  const canReview = profile?.role === 'teacher' || profile?.role === 'admin';

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

      {canReview && responses && responses.length > 0 && (
        <QuestionReview responses={responses} />
      )}
    </div>
  );
}

function QuestionReview({ responses }: { responses: ResponseWithQuestion[] }) {
  const correctCount = responses.filter((r) => r.is_correct).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Question review</CardTitle>
        <CardDescription>
          Teacher/admin view — student answer vs. correct answer for all {responses.length} items
          {' · '}
          <span className="font-medium text-foreground">{correctCount} correct</span>
          {' · '}
          <span className="font-medium text-foreground">{responses.length - correctCount} wrong</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {responses.map((r) => (
          <QuestionReviewCard key={r.id} response={r} />
        ))}
      </CardContent>
    </Card>
  );
}

function QuestionReviewCard({ response }: { response: ResponseWithQuestion }) {
  const q = response.questions;
  if (!q) return null;
  const letters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  return (
    <details className="group rounded-2xl border border-white/50 bg-white/40 backdrop-blur-md transition-colors open:bg-white/55">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
            response.is_correct
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700',
          )}
        >
          {response.sequence_number + 1}
        </span>
        <Badge variant={response.subject === 'math' ? 'info' : 'success'}>
          {response.subject === 'math' ? 'Math' : 'English'}
        </Badge>
        <Badge variant="outline">RIT {response.difficulty_rit_at_serve}</Badge>
        <Badge variant="outline">{formatStrand(q.strand)}</Badge>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span>{response.time_spent_seconds ?? 0}s</span>
          <span className="inline-flex items-center gap-1 font-medium">
            <span className="text-foreground/70">You:</span>
            <span
              className={cn(
                'inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 font-semibold',
                response.is_correct
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-700',
              )}
            >
              {response.student_answer ?? '—'}
            </span>
            <span className="text-foreground/70 ml-1">Key:</span>
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-emerald-100 px-1.5 font-semibold text-emerald-800">
              {q.correct_answer}
            </span>
          </span>
          <span className="text-foreground/50 transition group-open:rotate-180">▾</span>
        </div>
      </summary>
      <div className="space-y-3 border-t border-white/50 px-4 pb-4 pt-4">
        {q.passage_text && (
          <div className="max-h-56 overflow-y-auto rounded-xl border border-white/50 bg-white/50 p-3 text-sm leading-relaxed glass-scroll">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Passage
            </div>
            <MathText text={q.passage_text} />
          </div>
        )}
        <div className="text-sm font-medium leading-snug">
          <MathText text={q.question_text} />
        </div>
        <ul className="space-y-1.5 text-sm">
          {letters.map((l) => {
            const isCorrect = q.correct_answer === l;
            const isStudent = response.student_answer === l;
            const variant: 'correct' | 'wrong' | 'neutral' = isCorrect
              ? 'correct'
              : isStudent
                ? 'wrong'
                : 'neutral';
            return (
              <li
                key={l}
                className={cn(
                  'flex items-start gap-3 rounded-xl border px-3 py-2',
                  variant === 'correct' &&
                    'border-emerald-300 bg-emerald-50/80 ring-1 ring-emerald-200',
                  variant === 'wrong' &&
                    'border-rose-300 bg-rose-50/80 ring-1 ring-rose-200',
                  variant === 'neutral' && 'border-white/55 bg-white/40',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold',
                    variant === 'correct' && 'bg-emerald-600 text-white',
                    variant === 'wrong' && 'bg-rose-600 text-white',
                    variant === 'neutral' && 'bg-white/70 text-foreground/70',
                  )}
                >
                  {l}
                </span>
                <span className="flex-1 pt-0.5">
                  <MathText text={q[`choice_${l.toLowerCase()}` as 'choice_a']} />
                </span>
                {isCorrect && (
                  <Badge variant="success" className="shrink-0">
                    <Check className="h-3 w-3" />
                    Correct
                  </Badge>
                )}
                {!isCorrect && isStudent && (
                  <Badge variant="destructive" className="shrink-0">
                    <X className="h-3 w-3" />
                    Student
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
        {q.explanation && (
          <div className="rounded-xl border border-sky-200/70 bg-sky-50/70 p-3 text-sm leading-relaxed text-sky-900">
            <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-700">
              Explanation
            </div>
            {q.explanation}
          </div>
        )}
      </div>
    </details>
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
