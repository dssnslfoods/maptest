import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GRADE_LABELS } from '@/lib/utils';
import { gradeNorm } from '@/lib/rit';
import type { Profile, TestSession } from '@/types/database';
import Papa from 'papaparse';
import { Download } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface SessionWithStudent extends TestSession {
  profiles: Pick<Profile, 'full_name' | 'school_name' | 'grade_level'> | null;
}

export function ReportsPage() {
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['report-sessions'],
    queryFn: async (): Promise<SessionWithStudent[]> => {
      const { data, error } = await supabase
        .from('test_sessions')
        .select('*, profiles(full_name, school_name, grade_level)')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SessionWithStudent[];
    },
  });

  const schools = Array.from(new Set((sessions ?? []).map((s) => s.profiles?.school_name).filter(Boolean) as string[]));

  const filtered = (sessions ?? []).filter((s) => {
    const okGrade = gradeFilter === 'all' || s.grade_level_taken === Number(gradeFilter);
    const okSchool = schoolFilter === 'all' || s.profiles?.school_name === schoolFilter;
    return okGrade && okSchool;
  });

  const distribution = buildDistribution(filtered);

  const handleExport = () => {
    const rows = filtered.map((s) => ({
      student: s.profiles?.full_name,
      school: s.profiles?.school_name,
      grade: s.grade_level_taken,
      completed_at: s.completed_at,
      final_rit_english: s.final_rit_english,
      final_rit_math: s.final_rit_math,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `map_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const flagged = filtered.filter((s) => {
    if (!s.final_rit_english || !s.final_rit_math) return false;
    const eNorm = gradeNorm('english', s.grade_level_taken);
    const mNorm = gradeNorm('math', s.grade_level_taken);
    return s.final_rit_english < eNorm - 10 || s.final_rit_math < mNorm - 10;
  });

  const topGrowth = [...filtered]
    .filter((s) => s.final_rit_english && s.final_rit_math)
    .sort((a, b) => {
      const aSum = (a.final_rit_english ?? 0) + (a.final_rit_math ?? 0);
      const bSum = (b.final_rit_english ?? 0) + (b.final_rit_math ?? 0);
      return bSum - aSum;
    })
    .slice(0, 10);

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Class aggregates and student performance</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Grade</label>
              <Select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                <option value="all">All grades</option>
                {Object.entries(GRADE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">School</label>
              <Select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)}>
                <option value="all">All schools</option>
                {schools.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>English RIT distribution</CardTitle>
            <CardDescription>{filtered.length} sessions in filter</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-60" /> : <DistChart data={distribution.english} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Math RIT distribution</CardTitle>
            <CardDescription>{filtered.length} sessions in filter</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-60" /> : <DistChart data={distribution.math} />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="top">
            <TabsList>
              <TabsTrigger value="top">Top performers</TabsTrigger>
              <TabsTrigger value="flagged">Flagged for support</TabsTrigger>
            </TabsList>
            <TabsContent value="top">
              <SessionTable rows={topGrowth} />
            </TabsContent>
            <TabsContent value="flagged">
              <SessionTable rows={flagged} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SessionTable({ rows }: { rows: SessionWithStudent[] }) {
  if (rows.length === 0) {
    return <div className="py-6 text-center text-sm text-muted-foreground">No data</div>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>English</TableHead>
          <TableHead>Math</TableHead>
          <TableHead>School</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-medium">{s.profiles?.full_name}</TableCell>
            <TableCell>{GRADE_LABELS[s.grade_level_taken]}</TableCell>
            <TableCell>{s.final_rit_english}</TableCell>
            <TableCell>{s.final_rit_math}</TableCell>
            <TableCell>{s.profiles?.school_name ?? '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DistChart({ data }: { data: { bin: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="bin" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="hsl(var(--primary))" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function buildDistribution(sessions: SessionWithStudent[]) {
  const bins = ['<160', '160-180', '180-200', '200-220', '220-240', '240+'];
  const make = (key: 'final_rit_english' | 'final_rit_math') => {
    const counts = new Map<string, number>(bins.map((b) => [b, 0]));
    for (const s of sessions) {
      const v = s[key];
      if (v == null) continue;
      let bin = '<160';
      if (v >= 240) bin = '240+';
      else if (v >= 220) bin = '220-240';
      else if (v >= 200) bin = '200-220';
      else if (v >= 180) bin = '180-200';
      else if (v >= 160) bin = '160-180';
      counts.set(bin, (counts.get(bin) ?? 0) + 1);
    }
    return bins.map((b) => ({ bin: b, count: counts.get(b) ?? 0 }));
  };
  return { english: make('final_rit_english'), math: make('final_rit_math') };
}
