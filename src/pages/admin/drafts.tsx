import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import type { QuestionDraft } from '@/types/database';
import { Check, Edit2, Save, X } from 'lucide-react';
import { formatStrand } from '@/lib/utils';

export function AdminDraftsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const { data: drafts, isLoading } = useQuery({
    queryKey: ['admin-drafts', filter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_drafts')
        .select('*')
        .eq('review_status', filter)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as QuestionDraft[];
    },
  });

  const approveAll = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        const { error } = await supabase.rpc('approve_draft', { p_draft_id: id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('All drafts approved');
      qc.invalidateQueries({ queryKey: ['admin-drafts'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectAll = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('question_drafts')
        .update({ review_status: 'rejected', reviewed_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Drafts rejected');
      qc.invalidateQueries({ queryKey: ['admin-drafts'] });
    },
  });

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Draft review</h1>
          <p className="text-muted-foreground">Approve, edit, or reject AI-generated questions before they go live</p>
        </div>
        {filter === 'pending' && (drafts?.length ?? 0) > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => rejectAll.mutate(drafts!.map((d) => d.id))}
              disabled={rejectAll.isPending}
            >
              <X className="h-4 w-4" /> Reject all
            </Button>
            <Button
              onClick={() => approveAll.mutate(drafts!.map((d) => d.id))}
              disabled={approveAll.isPending}
            >
              <Check className="h-4 w-4" /> Approve all
            </Button>
          </div>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        <TabsContent value={filter}>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-72" />
              <Skeleton className="h-72" />
            </div>
          ) : (drafts?.length ?? 0) === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No {filter} drafts.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {drafts!.map((d) => (
                <DraftCard key={d.id} draft={d} editable={filter === 'pending'} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DraftCard({ draft, editable }: { draft: QuestionDraft; editable: boolean }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(draft);

  const approve = useMutation({
    mutationFn: async () => {
      if (editing) {
        const { error: e1 } = await supabase
          .from('question_drafts')
          .update({
            question_text: form.question_text,
            passage_text: form.passage_text,
            choice_a: form.choice_a,
            choice_b: form.choice_b,
            choice_c: form.choice_c,
            choice_d: form.choice_d,
            correct_answer: form.correct_answer,
            explanation: form.explanation,
            target_rit: form.target_rit,
            grade_band: form.grade_band,
            review_status: 'edited',
          })
          .eq('id', draft.id);
        if (e1) throw e1;
      }
      const { error } = await supabase.rpc('approve_draft', { p_draft_id: draft.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Approved to live bank');
      qc.invalidateQueries({ queryKey: ['admin-drafts'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('question_drafts')
        .update({ review_status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', draft.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Rejected');
      qc.invalidateQueries({ queryKey: ['admin-drafts'] });
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="info">{draft.subject}</Badge>
          <Badge variant="secondary">{formatStrand(draft.strand)}</Badge>
          <Badge variant="outline">Grade {draft.grade_band}</Badge>
          <Badge variant="outline">RIT {draft.target_rit}</Badge>
        </div>
        <CardTitle className="text-base">Draft</CardTitle>
        <CardDescription className="line-clamp-1 text-xs">
          {new Date(draft.created_at).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <>
            {draft.subject === 'english' && (
              <div>
                <Label className="text-xs">Passage</Label>
                <Textarea
                  rows={3}
                  value={form.passage_text ?? ''}
                  onChange={(e) => setForm({ ...form, passage_text: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label className="text-xs">Question</Label>
              <Textarea
                rows={2}
                value={form.question_text}
                onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(['a', 'b', 'c', 'd'] as const).map((l) => (
                <div key={l}>
                  <Label className="text-xs">Choice {l.toUpperCase()}</Label>
                  <Input
                    value={form[`choice_${l}` as 'choice_a']}
                    onChange={(e) => setForm({ ...form, [`choice_${l}`]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Correct</Label>
                <Select
                  value={form.correct_answer}
                  onChange={(e) =>
                    setForm({ ...form, correct_answer: e.target.value as 'A' | 'B' | 'C' | 'D' })
                  }
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Target RIT</Label>
                <Input
                  type="number"
                  value={form.target_rit}
                  onChange={(e) => setForm({ ...form, target_rit: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-xs">Grade</Label>
                <Input
                  type="number"
                  min={0}
                  max={12}
                  value={form.grade_band}
                  onChange={(e) => setForm({ ...form, grade_band: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Explanation</Label>
              <Textarea
                rows={2}
                value={form.explanation ?? ''}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              />
            </div>
          </>
        ) : (
          <>
            {draft.passage_text && (
              <div className="rounded bg-muted/50 p-2 text-xs">{draft.passage_text}</div>
            )}
            <div className="text-sm font-medium">{draft.question_text}</div>
            <ul className="space-y-1 text-sm">
              {(['A', 'B', 'C', 'D'] as const).map((l) => (
                <li
                  key={l}
                  className={`rounded border p-1.5 text-xs ${
                    draft.correct_answer === l ? 'border-emerald-500 bg-emerald-50 font-medium' : ''
                  }`}
                >
                  {l}. {draft[`choice_${l.toLowerCase()}` as 'choice_a']}
                </li>
              ))}
            </ul>
            {draft.explanation && (
              <div className="rounded bg-sky-50 p-2 text-xs text-sky-900">{draft.explanation}</div>
            )}
          </>
        )}
        {editable && (
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (editing) {
                  setForm(draft);
                }
                setEditing((e) => !e);
              }}
            >
              {editing ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              {editing ? 'Cancel edits' : 'Edit'}
            </Button>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="outline" onClick={() => reject.mutate()} disabled={reject.isPending}>
                <X className="h-4 w-4" /> Reject
              </Button>
              <Button size="sm" onClick={() => approve.mutate()} disabled={approve.isPending}>
                {editing ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                {editing ? 'Save & Approve' : 'Approve'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
