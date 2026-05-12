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
import { AmbientBackground } from '@/components/ambient-background';
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
        'relative flex min-h-screen flex-col',
        feedback === 'correct' && 'test-flash-correct',
        feedback === 'wrong' && 'test-flash-wrong',
      )}
    >
      <AmbientBackground />
      <header className="sticky top-3 z-20 mx-3 md:mx-6">
        <div className="glass-strong mx-auto flex max-w-3xl items-center gap-3 rounded-2xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            {currentQuestion && (
              <Badge variant={currentQuestion.subject === 'math' ? 'info' : 'success'}>
                {subjectIcon}
                {currentQuestion.subject === 'math' ? 'Math' : 'English'}
              </Badge>
            )}
            <div className="text-sm font-semibold tracking-tight">
              {Math.min(answered + 1, TOTAL_QUESTIONS)}
              <span className="text-muted-foreground"> / {TOTAL_QUESTIONS}</span>
            </div>
          </div>
          <div className="hidden flex-1 items-center justify-center gap-2 text-xs text-muted-foreground md:flex">
            <Badge variant="outline">M · {session.current_rit_math ?? '—'}</Badge>
            <Badge variant="outline">E · {session.current_rit_english ?? '—'}</Badge>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
              <Clock className="h-3.5 w-3.5" />
              {elapsed}s
            </div>
            <Button variant="ghost" size="sm" onClick={abandon}>
              <LogOut className="h-4 w-4" /> Exit
            </Button>
          </div>
        </div>
        <div className="mx-auto mt-2 max-w-3xl px-1">
          <Progress value={answered} max={TOTAL_QUESTIONS} className="h-1.5" />
        </div>
      </header>

      <main className="container mx-auto w-full max-w-3xl flex-1 p-4 pt-6 md:p-8 md:pt-8">
        {loadingQuestion || !currentQuestion ? (
          <Card className="p-12 text-center text-muted-foreground">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
            <p className="mt-3 text-sm">Selecting next question…</p>
          </Card>
        ) : (
          <Card className="space-y-6 p-6 md:p-8">
            {currentQuestion.passage_text && (
              <div className="max-h-72 overflow-y-auto rounded-xl border border-white/50 bg-white/40 p-4 text-sm leading-relaxed backdrop-blur glass-scroll">
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Passage
                </div>
                <MathText text={currentQuestion.passage_text} />
              </div>
            )}

            {currentQuestion.question_image_url && (
              <img
                src={currentQuestion.question_image_url}
                alt=""
                className="mx-auto max-h-72 rounded-xl border border-white/50 shadow-sm"
              />
            )}

            <div className="text-lg font-medium leading-snug text-foreground/90">
              <MathText text={currentQuestion.question_text} />
            </div>

            <div className="grid gap-2.5">
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
                      'group flex w-full items-start gap-3 rounded-xl border bg-white/50 p-3.5 text-left backdrop-blur-md',
                      'transition-all duration-200 ease-out shadow-[inset_0_1px_0_0_rgba(255,255,255,0.7)]',
                      active
                        ? 'border-primary/60 bg-primary/10 ring-2 ring-primary/30 -translate-y-px shadow-[0_8px_24px_-8px_rgba(91,107,255,0.35)]'
                        : 'border-white/60 hover:-translate-y-px hover:bg-white/70 hover:shadow-[0_6px_18px_-6px_rgba(70,80,160,0.18)]',
                      submitting && 'opacity-70',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                        active
                          ? 'text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.45)]'
                          : 'bg-white/70 text-foreground/70 group-hover:bg-white',
                      )}
                      style={
                        active
                          ? { backgroundImage: 'linear-gradient(135deg, hsl(235 88% 62%), hsl(280 80% 65%))' }
                          : undefined
                      }
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

            <div className="flex items-center justify-between border-t border-white/50 pt-4">
              <p className="text-xs text-muted-foreground">
                Adaptive · No backtracking · Choose carefully
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
