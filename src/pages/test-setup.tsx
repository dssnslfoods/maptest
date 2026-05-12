import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { GRADE_LABELS } from '@/lib/utils';
import { gradeNorm } from '@/lib/rit';
import { Loader2, Play, BookOpen, Calculator } from 'lucide-react';

export function TestSetupPage() {
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const [grade, setGrade] = useState<string>(String(profile?.grade_level ?? 5));
  const [busy, setBusy] = useState(false);

  const start = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('start_test_session', {
      p_grade_level: Number(grade),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate(`/test/${data}`);
  };

  const englishNorm = gradeNorm('english', Number(grade));
  const mathNorm = gradeNorm('math', Number(grade));

  return (
    <div className="container mx-auto max-w-2xl space-y-4 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Begin a new MAP test</CardTitle>
          <CardDescription>
            40 questions, interleaved between English and Math. The difficulty adapts to your answers in real time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="grade">Grade level</Label>
            <Select id="grade" value={grade} onChange={(e) => setGrade(e.target.value)}>
              {Object.entries(GRADE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <p className="text-xs text-muted-foreground">
              The test starts at your grade-level norm and adapts from there.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border bg-muted/40 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground">
                <BookOpen className="h-4 w-4" /> English start
              </div>
              <div className="mt-1 text-2xl font-semibold">RIT {englishNorm}</div>
            </div>
            <div className="rounded-md border bg-muted/40 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-sm font-medium text-muted-foreground">
                <Calculator className="h-4 w-4" /> Math start
              </div>
              <div className="mt-1 text-2xl font-semibold">RIT {mathNorm}</div>
            </div>
          </div>

          <div className="rounded-md border-l-4 border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
            <strong>Heads up:</strong> Once started, you cannot revisit previous questions. Choose your answer carefully.
          </div>

          <Button size="lg" className="w-full" onClick={start} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Start test
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
