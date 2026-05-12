import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { useTestSessionStore } from '@/store/test-session';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { MathText } from '@/features/test/question-renderer';
import type {
  NextQuestion,
  SubmitAnswerResult,
  TestSession,
} from '@/types/database';
import { BookOpen, Calculator, Clock, Loader2, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOTAL_QUESTIONS = 40;
type Choice = 'A' | 'B' | 'C' | 'D';

export function TestActivePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const {
    session,
    currentQuestion,
    selectedAnswer,
    startedQuestionAt,
    feedback,
    setSession,
    setQuestion,
    setSelectedAnswer,
    setFeedback,
    reset,
  } = useTestSessionStore();

  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const loadSession = useCallback(async () => {
    if (!sessionId) return;
    const { data, error } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (error || !data) {
      toast.error('Session not found');
      navigate('/dashboard');
      return;
    }
    if (data.student_id !== profile?.id) {
      toast.error('Not your session');
      navigate('/dashboard');
      return;
    }
    setSession(data as TestSession);
    if (data.status !== 'in_progress') {
      navigate(`/results/${sessionId}`);
    }
  }, [sessionId, profile?.id, navigate, setSession]);

  const loadNextQuestion = useCallback(async () => {
    if (!sessionId) return;
    setLoadingQuestion(true);
    const { data, error } = await supabase.rpc('get_next_question', { p_session_id: sessionId });
    setLoadingQuestion(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const next = (data as NextQuestion[] | null)?.[0] ?? null;
    if (!next) {
      toast.error('No suitable question available. Please contact admin to expand the question bank.');
      return;
    }
    setQuestion(next);
  }, [sessionId, setQuestion]);

  useEffect(() => {
    loadSession();
    return () => reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (session && session.status === 'in_progress' && !currentQuestion) {
      loadNextQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (!startedQuestionAt) return;
    setElapsed(0);
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedQuestionAt) / 1000)), 500);
    return () => clearInterval(id);
  }, [startedQuestionAt]);

  const submit = async () => {
    if (!sessionId || !currentQuestion || !selectedAnswer) return;
    setSubmitting(true);
    const time = startedQuestionAt ? Math.floor((Date.now() - startedQuestionAt) / 1000) : 0;
    const { data, error } = await supabase.rpc('submit_answer', {
      p_session_id: sessionId,
      p_question_id: currentQuestion.question_id,
      p_answer: selectedAnswer,
      p_time_spent: time,
    });
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }
    const result = data as SubmitAnswerResult;
    setFeedback(result.is_correct ? 'correct' : 'wrong');
    // Refresh local session counters
    const { data: refreshed } = await supabase
      .from('test_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
    if (refreshed) setSession(refreshed as TestSession);

    setTimeout(() => {
      setSubmitting(false);
      setFeedback(null);
      if (result.finished) {
        navigate(`/results/${sessionId}`);
      } else {
        loadNextQuestion();
      }
    }, 700);
  };

  const abandon = async () => {
    if (!sessionId) return;
    if (!confirm('Exit the test? Your progress will be saved, but the test will end.')) return;
    const { error } = await supabase.rpc('abandon_session', { p_session_id: sessionId });
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate('/dashboard');
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const answered = session.questions_answered;
  const subjectIcon =
    currentQuestion?.subject === 'math' ? (
      <Calculator className="h-4 w-4" />
    ) : (
      <BookOpen className="h-4 w-4" />
    );

  return (
    <div
      className={cn(
        'flex min-h-screen flex-col bg-background',
        feedback === 'correct' && 'test-flash-correct',
        feedback === 'wrong' && 'test-flash-wrong',
      )}
    >
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            {currentQuestion && (
              <Badge variant={currentQuestion.subject === 'math' ? 'info' : 'success'}>
                <span className="inline-flex items-center gap-1">
                  {subjectIcon}
                  {currentQuestion.subject === 'math' ? 'Math' : 'English'}
                </span>
              </Badge>
            )}
            <div className="text-sm font-medium">
              Question {Math.min(answered + 1, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}
            </div>
          </div>
          <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
            <span>Current RIT</span>
            <Badge variant="outline">M {session.current_rit_math ?? '—'}</Badge>
            <Badge variant="outline">E {session.current_rit_english ?? '—'}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
              <Clock className="h-4 w-4" />
              {elapsed}s
            </div>
            <Button variant="ghost" size="sm" onClick={abandon}>
              <LogOut className="h-4 w-4" /> Exit
            </Button>
          </div>
        </div>
        <Progress value={answered} max={TOTAL_QUESTIONS} className="h-1 rounded-none" />
      </header>

      <main className="container mx-auto w-full max-w-3xl flex-1 p-4 md:p-8">
        {loadingQuestion || !currentQuestion ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            <p className="mt-3 text-sm">Selecting next question…</p>
          </Card>
        ) : (
          <Card className="space-y-6 p-6 md:p-8">
            {currentQuestion.passage_text && (
              <div className="max-h-72 overflow-y-auto rounded-md border bg-muted/40 p-4 text-sm leading-relaxed">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Passage
                </div>
                <MathText text={currentQuestion.passage_text} />
              </div>
            )}

            {currentQuestion.question_image_url && (
              <img
                src={currentQuestion.question_image_url}
                alt=""
                className="mx-auto max-h-72 rounded-md border"
              />
            )}

            <div className="text-lg font-medium leading-snug">
              <MathText text={currentQuestion.question_text} />
            </div>

            <div className="grid gap-2">
              {(['A', 'B', 'C', 'D'] as Choice[]).map((letter) => {
                const text = currentQuestion[`choice_${letter.toLowerCase()}` as 'choice_a'];
                const active = selectedAnswer === letter;
                return (
                  <button
                    key={letter}
                    type="button"
                    onClick={() => !submitting && setSelectedAnswer(letter)}
                    disabled={submitting}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-md border bg-background p-3 text-left transition-colors',
                      active
                        ? 'border-primary bg-primary/5 ring-2 ring-primary'
                        : 'hover:border-primary/40 hover:bg-muted/50',
                      submitting && 'opacity-70',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                        active ? 'border-primary bg-primary text-primary-foreground' : 'bg-muted',
                      )}
                    >
                      {letter}
                    </span>
                    <span className="pt-0.5 text-sm leading-relaxed">
                      <MathText text={text} />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <p className="text-xs text-muted-foreground">
                Adaptive item · No backtracking · Choose carefully
              </p>
              <Button size="lg" onClick={submit} disabled={!selectedAnswer || submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit answer
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
