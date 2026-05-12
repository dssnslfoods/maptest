import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { ENGLISH_STRANDS, MATH_STRANDS, formatStrand } from '@/lib/utils';
import { decryptApiKey } from '@/features/admin/api-key';
import { generateQuestions, type GeneratedQuestion } from '@/features/admin/gemini-generator';
import { gradeNorm } from '@/lib/rit';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import type { Subject, UserSettings } from '@/types/database';

interface Draft extends GeneratedQuestion {
  localId: string;
}

export function AdminGeneratorPage() {
  const profile = useAuthStore((s) => s.profile);
  const qc = useQueryClient();
  const [subject, setSubject] = useState<Subject>('math');
  const [strand, setStrand] = useState<string>('number_operations');
  const [gradeBand, setGradeBand] = useState(5);
  const [targetRit, setTargetRit] = useState(gradeNorm('math', 5));
  const [count, setCount] = useState(3);
  const [busy, setBusy] = useState(false);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const { data: settings } = useQuery({
    queryKey: ['settings', profile?.id],
    enabled: !!profile,
    queryFn: async (): Promise<UserSettings | null> => {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', profile!.id)
        .maybeSingle();
      return (data as UserSettings | null) ?? null;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['draft-stats'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const iso = today.toISOString();
      const [total, approved] = await Promise.all([
        supabase
          .from('question_drafts')
          .select('*', { head: true, count: 'exact' })
          .gte('created_at', iso),
        supabase
          .from('question_drafts')
          .select('*', { head: true, count: 'exact' })
          .eq('review_status', 'approved')
          .gte('reviewed_at', iso),
      ]);
      return {
        generated: total.count ?? 0,
        approved: approved.count ?? 0,
      };
    },
    refetchInterval: 30_000,
  });

  const hasApiKey = !!settings?.gemini_api_key_encrypted;

  const handleGenerate = async () => {
    if (!hasApiKey || !profile) {
      toast.error('Configure your Gemini API key in Settings first');
      return;
    }
    setBusy(true);
    setRetryStatus(null);
    try {
      const apiKey = await decryptApiKey(settings!.gemini_api_key_encrypted!, profile.id);
      const result = await generateQuestions(
        { apiKey, subject, strand, gradeBand, targetRit, count },
        {
          maxRetries: 3,
          onRetry: (attempt, delayMs) => {
            const secs = Math.round(delayMs / 1000);
            const msg = `Gemini overloaded — retrying in ${secs}s (attempt ${attempt + 1}/3)`;
            setRetryStatus(msg);
            toast.message(msg);
          },
        },
      );
      setRetryStatus(null);
      setDrafts(
        result.questions.map((q, i) => ({ ...q, localId: `${Date.now()}-${i}` })),
      );
      // Persist all as pending drafts
      const rows = result.questions.map((q) => ({
        generated_by: profile.id,
        subject,
        strand,
        grade_band: gradeBand,
        target_rit: targetRit,
        question_text: q.question_text,
        passage_text: q.passage_text ?? null,
        choice_a: q.choice_a,
        choice_b: q.choice_b,
        choice_c: q.choice_c,
        choice_d: q.choice_d,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        ai_model: 'gemini-2.5-flash',
        ai_prompt_used: result.prompt,
        review_status: 'pending' as const,
      }));
      const { error } = await supabase.from('question_drafts').insert(rows as never);
      if (error) toast.error(error.message);
      else {
        toast.success(`Generated ${result.questions.length} draft(s)`);
        qc.invalidateQueries({ queryKey: ['draft-stats'] });
        qc.invalidateQueries({ queryKey: ['admin-drafts'] });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Generation failed';
      toast.error(msg, { duration: 8000 });
    } finally {
      setBusy(false);
      setRetryStatus(null);
    }
  };

  const strands = subject === 'math' ? MATH_STRANDS : ENGLISH_STRANDS;

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI question generator</h1>
          <p className="text-muted-foreground">
            Generate MAP-style items with Gemini. Drafts require human review before going live.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <StatPill label="Generated today" value={stats?.generated ?? 0} />
          <StatPill label="Approved today" value={stats?.approved ?? 0} />
          <StatPill
            label="Approval rate"
            value={
              stats && stats.generated > 0
                ? `${Math.round((stats.approved / stats.generated) * 100)}%`
                : '—'
            }
          />
        </div>
      </div>

      {!hasApiKey && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-900">Gemini API key required</CardTitle>
            <CardDescription className="text-amber-900/80">
              Go to <Link to="/settings" className="font-medium underline">Settings</Link> and save your Gemini API key. Get one free at{' '}
              <a className="underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                Google AI Studio
              </a>.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Batch configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-5">
            <div>
              <Label>Subject</Label>
              <Select
                value={subject}
                onChange={(e) => {
                  const s = e.target.value as Subject;
                  setSubject(s);
                  setStrand(s === 'math' ? 'number_operations' : 'vocabulary');
                  setTargetRit(gradeNorm(s, gradeBand));
                }}
              >
                <option value="math">Math</option>
                <option value="english">English</option>
              </Select>
            </div>
            <div>
              <Label>Strand</Label>
              <Select value={strand} onChange={(e) => setStrand(e.target.value)}>
                {strands.map((s) => (
                  <option key={s} value={s}>
                    {formatStrand(s)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Grade band</Label>
              <Input
                type="number"
                min={0}
                max={12}
                value={gradeBand}
                onChange={(e) => {
                  const g = Number(e.target.value);
                  setGradeBand(g);
                  setTargetRit(gradeNorm(subject, g));
                }}
              />
            </div>
            <div>
              <Label>Target RIT</Label>
              <Input
                type="number"
                min={100}
                max={350}
                value={targetRit}
                onChange={(e) => setTargetRit(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Count (1–10)</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e) => setCount(Math.min(10, Math.max(1, Number(e.target.value))))}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            {retryStatus ? (
              <p className="text-xs text-amber-700">{retryStatus}</p>
            ) : (
              <span />
            )}
            <Button onClick={handleGenerate} disabled={busy || !hasApiKey} size="lg">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate {count} question{count > 1 ? 's' : ''}
            </Button>
          </div>
        </CardContent>
      </Card>

      {busy && (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      )}

      {drafts.length > 0 && !busy && (
        <Card>
          <CardHeader>
            <CardTitle>Drafts pending review</CardTitle>
            <CardDescription>
              All drafts saved to the queue —{' '}
              <Link className="underline" to="/admin/drafts">
                review them here
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {drafts.map((d) => (
                <div key={d.localId} className="rounded-md border p-4 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="info">
                      {subject} · {formatStrand(strand)} · RIT {targetRit}
                    </Badge>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  {d.passage_text && (
                    <div className="mb-2 rounded bg-muted/50 p-2 text-xs">{d.passage_text}</div>
                  )}
                  <div className="mb-2 font-medium">{d.question_text}</div>
                  <ul className="space-y-0.5 text-xs">
                    {(['A', 'B', 'C', 'D'] as const).map((l) => (
                      <li
                        key={l}
                        className={d.correct_answer === l ? 'font-semibold text-emerald-700' : ''}
                      >
                        {l}. {d[`choice_${l.toLowerCase()}` as 'choice_a']}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <X className="h-4 w-4" />
          AI questions go to the draft queue only — they never insert into the live bank without admin approval.
        </CardContent>
      </Card>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-background px-3 py-1.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

