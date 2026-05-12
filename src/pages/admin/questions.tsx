import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import Papa from 'papaparse';
import {
  Download,
  Edit2,
  Eye,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-react';
import type { Question, Subject } from '@/types/database';
import { ENGLISH_STRANDS, MATH_STRANDS, formatStrand } from '@/lib/utils';

const CSV_TEMPLATE_HEADERS = [
  'subject',
  'strand',
  'grade_band',
  'difficulty_rit',
  'question_text',
  'passage_text',
  'choice_a',
  'choice_b',
  'choice_c',
  'choice_d',
  'correct_answer',
  'explanation',
];

export function AdminQuestionsPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({
    subject: 'all' as 'all' | Subject,
    strand: 'all',
    minRit: '',
    maxRit: '',
    active: 'true' as 'all' | 'true' | 'false',
  });
  const [editTarget, setEditTarget] = useState<Question | null>(null);
  const [previewTarget, setPreviewTarget] = useState<Question | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ['admin-questions', filters],
    queryFn: async () => {
      let q = supabase.from('questions').select('*').order('difficulty_rit');
      if (filters.subject !== 'all') q = q.eq('subject', filters.subject);
      if (filters.strand !== 'all') q = q.eq('strand', filters.strand);
      if (filters.minRit) q = q.gte('difficulty_rit', Number(filters.minRit));
      if (filters.maxRit) q = q.lte('difficulty_rit', Number(filters.maxRit));
      if (filters.active !== 'all') q = q.eq('active', filters.active === 'true');
      const { data, error } = await q.limit(500);
      if (error) throw error;
      return (data ?? []) as Question[];
    },
  });

  const recalibrateAll = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('recalibrate_all_questions');
      if (error) throw error;
      return data as number;
    },
    onSuccess: (n) => {
      toast.success(`Recalibrated ${n} question(s)`);
      qc.invalidateQueries({ queryKey: ['admin-questions'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (q: Question) => {
      const { error } = await supabase
        .from('questions')
        .update({ active: !q.active })
        .eq('id', q.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Updated');
      qc.invalidateQueries({ queryKey: ['admin-questions'] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Deleted');
      qc.invalidateQueries({ queryKey: ['admin-questions'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const downloadTemplate = () => {
    const csv = Papa.unparse({ fields: CSV_TEMPLATE_HEADERS, data: [] });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onCsvFile = async (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows = (result.data as Record<string, string>[]).map((r) => ({
          subject: r.subject as Subject,
          strand: r.strand,
          grade_band: Number(r.grade_band),
          difficulty_rit: Number(r.difficulty_rit),
          question_text: r.question_text,
          passage_text: r.passage_text || null,
          choice_a: r.choice_a,
          choice_b: r.choice_b,
          choice_c: r.choice_c,
          choice_d: r.choice_d,
          correct_answer: r.correct_answer?.toUpperCase(),
          explanation: r.explanation || null,
          active: true,
        }));
        const { error } = await supabase.from('questions').insert(rows as never);
        if (error) toast.error(error.message);
        else {
          toast.success(`Imported ${rows.length} question(s)`);
          qc.invalidateQueries({ queryKey: ['admin-questions'] });
        }
      },
    });
  };

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Question bank</h1>
          <p className="text-muted-foreground">Manage adaptive items, import from CSV, recalibrate</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => recalibrateAll.mutate()} disabled={recalibrateAll.isPending}>
            <RefreshCw className={recalibrateAll.isPending ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            Recalibrate
          </Button>
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" /> CSV template
          </Button>
          <label className="inline-flex">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onCsvFile(e.target.files[0])}
            />
            <span className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
              <Upload className="h-4 w-4" /> Import CSV
            </span>
          </label>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New question
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-5">
            <Select
              value={filters.subject}
              onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value as 'all' | Subject, strand: 'all' }))}
            >
              <option value="all">All subjects</option>
              <option value="english">English</option>
              <option value="math">Math</option>
            </Select>
            <Select value={filters.strand} onChange={(e) => setFilters((f) => ({ ...f, strand: e.target.value }))}>
              <option value="all">All strands</option>
              {(filters.subject === 'math' ? MATH_STRANDS : filters.subject === 'english' ? ENGLISH_STRANDS : [...MATH_STRANDS, ...ENGLISH_STRANDS]).map(
                (s) => (
                  <option key={s} value={s}>
                    {formatStrand(s)}
                  </option>
                ),
              )}
            </Select>
            <Input
              placeholder="Min RIT"
              value={filters.minRit}
              onChange={(e) => setFilters((f) => ({ ...f, minRit: e.target.value }))}
            />
            <Input
              placeholder="Max RIT"
              value={filters.maxRit}
              onChange={(e) => setFilters((f) => ({ ...f, maxRit: e.target.value }))}
            />
            <Select value={filters.active} onChange={(e) => setFilters((f) => ({ ...f, active: e.target.value as 'all' | 'true' | 'false' }))}>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
              <option value="all">All</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>{questions?.length ?? 0} matching items</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Strand</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>RIT</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(questions ?? []).map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="capitalize">{q.subject}</TableCell>
                    <TableCell className="text-xs">{formatStrand(q.strand)}</TableCell>
                    <TableCell>{q.grade_band}</TableCell>
                    <TableCell className="font-mono">{q.difficulty_rit}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs" title={q.question_text}>
                      {q.question_text}
                    </TableCell>
                    <TableCell>
                      <Badge variant={q.active ? 'success' : 'secondary'}>{q.active ? 'Active' : 'Inactive'}</Badge>
                    </TableCell>
                    <TableCell className="space-x-1 text-right">
                      <Button size="icon" variant="ghost" onClick={() => setPreviewTarget(q)} title="Preview">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setEditTarget(q)} title="Edit">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => toggleActive.mutate(q)} title="Toggle active">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm('Delete this question? This cannot be undone.')) remove.mutate(q.id);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!previewTarget} onOpenChange={() => setPreviewTarget(null)}>
        <DialogContent onClose={() => setPreviewTarget(null)}>
          {previewTarget && <QuestionPreview q={previewTarget} />}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen || !!editTarget} onOpenChange={(o) => !o && (setEditTarget(null), setCreateOpen(false))}>
        <DialogContent onClose={() => (setEditTarget(null), setCreateOpen(false))}>
          <QuestionForm
            question={editTarget}
            onClose={() => {
              setEditTarget(null);
              setCreateOpen(false);
              qc.invalidateQueries({ queryKey: ['admin-questions'] });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QuestionPreview({ q }: { q: Question }) {
  return (
    <div className="space-y-3">
      <DialogHeader>
        <DialogTitle>Question preview</DialogTitle>
        <DialogDescription>
          {q.subject} · {formatStrand(q.strand)} · Grade {q.grade_band} · RIT {q.difficulty_rit}
        </DialogDescription>
      </DialogHeader>
      {q.passage_text && (
        <div className="rounded border bg-muted/40 p-3 text-sm">
          <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Passage</div>
          <div className="whitespace-pre-wrap">{q.passage_text}</div>
        </div>
      )}
      <div className="font-medium">{q.question_text}</div>
      <ul className="space-y-1 text-sm">
        {(['A', 'B', 'C', 'D'] as const).map((l) => (
          <li
            key={l}
            className={`rounded border p-2 ${q.correct_answer === l ? 'border-emerald-500 bg-emerald-50' : ''}`}
          >
            <strong>{l}.</strong> {q[`choice_${l.toLowerCase()}` as 'choice_a']}
            {q.correct_answer === l && (
              <Badge variant="success" className="ml-2">
                Correct
              </Badge>
            )}
          </li>
        ))}
      </ul>
      {q.explanation && (
        <div className="rounded bg-sky-50 p-3 text-sm">
          <div className="text-xs font-semibold uppercase text-sky-900">Explanation</div>
          <div className="text-sky-900/90">{q.explanation}</div>
        </div>
      )}
    </div>
  );
}

function QuestionForm({ question, onClose }: { question: Question | null; onClose: () => void }) {
  const editing = !!question;
  const [form, setForm] = useState({
    subject: question?.subject ?? ('math' as Subject),
    strand: question?.strand ?? 'number_operations',
    grade_band: question?.grade_band ?? 5,
    difficulty_rit: question?.difficulty_rit ?? 200,
    question_text: question?.question_text ?? '',
    passage_text: question?.passage_text ?? '',
    choice_a: question?.choice_a ?? '',
    choice_b: question?.choice_b ?? '',
    choice_c: question?.choice_c ?? '',
    choice_d: question?.choice_d ?? '',
    correct_answer: (question?.correct_answer ?? 'A') as 'A' | 'B' | 'C' | 'D',
    explanation: question?.explanation ?? '',
    active: question?.active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const payload = { ...form, passage_text: form.passage_text || null, explanation: form.explanation || null };
    if (editing && question) {
      const { error } = await supabase.from('questions').update(payload).eq('id', question.id);
      if (error) toast.error(error.message);
      else {
        toast.success('Saved');
        onClose();
      }
    } else {
      const { error } = await supabase.from('questions').insert(payload as never);
      if (error) toast.error(error.message);
      else {
        toast.success('Created');
        onClose();
      }
    }
    setSaving(false);
  };

  const strands = form.subject === 'math' ? MATH_STRANDS : ENGLISH_STRANDS;

  return (
    <div className="space-y-3">
      <DialogHeader>
        <DialogTitle>{editing ? 'Edit question' : 'New question'}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Subject</Label>
          <Select
            value={form.subject}
            onChange={(e) =>
              setForm((f) => ({ ...f, subject: e.target.value as Subject, strand: e.target.value === 'math' ? 'number_operations' : 'vocabulary' }))
            }
          >
            <option value="math">Math</option>
            <option value="english">English</option>
          </Select>
        </div>
        <div>
          <Label>Strand</Label>
          <Select value={form.strand} onChange={(e) => setForm((f) => ({ ...f, strand: e.target.value }))}>
            {strands.map((s) => (
              <option key={s} value={s}>
                {formatStrand(s)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Grade band (0–12)</Label>
          <Input
            type="number"
            min={0}
            max={12}
            value={form.grade_band}
            onChange={(e) => setForm((f) => ({ ...f, grade_band: Number(e.target.value) }))}
          />
        </div>
        <div>
          <Label>Difficulty RIT (100–350)</Label>
          <Input
            type="number"
            min={100}
            max={350}
            value={form.difficulty_rit}
            onChange={(e) => setForm((f) => ({ ...f, difficulty_rit: Number(e.target.value) }))}
          />
        </div>
      </div>
      <div>
        <Label>Passage (optional)</Label>
        <Textarea value={form.passage_text} onChange={(e) => setForm((f) => ({ ...f, passage_text: e.target.value }))} />
      </div>
      <div>
        <Label>Question text</Label>
        <Textarea value={form.question_text} onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {(['a', 'b', 'c', 'd'] as const).map((l) => (
          <div key={l}>
            <Label>Choice {l.toUpperCase()}</Label>
            <Input
              value={form[`choice_${l}` as 'choice_a']}
              onChange={(e) => setForm((f) => ({ ...f, [`choice_${l}`]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Correct answer</Label>
          <Select
            value={form.correct_answer}
            onChange={(e) => setForm((f) => ({ ...f, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' }))}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Active
          </label>
        </div>
      </div>
      <div>
        <Label>Explanation</Label>
        <Textarea value={form.explanation} onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {editing ? 'Save' : 'Create'}
        </Button>
      </div>
    </div>
  );
}
