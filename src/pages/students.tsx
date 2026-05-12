import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { GRADE_LABELS } from '@/lib/utils';
import type { Profile, TestSession } from '@/types/database';

interface StudentRow extends Profile {
  latest_english: number | null;
  latest_math: number | null;
  test_count: number;
  last_test_at: string | null;
}

export function StudentsPage() {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['students-roster'],
    queryFn: async (): Promise<StudentRow[]> => {
      const { data: students } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name');
      if (!students) return [];

      const { data: sessions } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      const byStudent = new Map<string, TestSession[]>();
      for (const s of (sessions ?? []) as TestSession[]) {
        const arr = byStudent.get(s.student_id) ?? [];
        arr.push(s);
        byStudent.set(s.student_id, arr);
      }
      return (students as Profile[]).map((p) => {
        const ss = byStudent.get(p.id) ?? [];
        const latest = ss[0];
        return {
          ...p,
          latest_english: latest?.final_rit_english ?? null,
          latest_math: latest?.final_rit_math ?? null,
          test_count: ss.length,
          last_test_at: latest?.completed_at ?? null,
        };
      });
    },
  });

  const filtered =
    data?.filter((s) => {
      const matchSearch =
        !search ||
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (s.school_name ?? '').toLowerCase().includes(search.toLowerCase());
      const matchGrade = gradeFilter === 'all' || s.grade_level === Number(gradeFilter);
      return matchSearch && matchGrade;
    }) ?? [];

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground">Browse students and review their latest scores</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="Search by name or school…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:col-span-2"
            />
            <Select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
              <option value="all">All grades</option>
              {Object.entries(GRADE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </div>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Tests</TableHead>
                  <TableHead>Last English</TableHead>
                  <TableHead>Last Math</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.full_name}</TableCell>
                    <TableCell>
                      {s.grade_level !== null ? (
                        <Badge variant="secondary">{GRADE_LABELS[s.grade_level]}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{s.school_name ?? '—'}</TableCell>
                    <TableCell>{s.test_count}</TableCell>
                    <TableCell>{s.latest_english ?? '—'}</TableCell>
                    <TableCell>{s.latest_math ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/reports?student=${s.id}`} className="text-sm text-primary hover:underline">
                        Reports
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                      No students found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
