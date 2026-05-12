import { create } from 'zustand';
import type { NextQuestion, TestSession } from '@/types/database';

interface TestSessionState {
  session: TestSession | null;
  currentQuestion: NextQuestion | null;
  selectedAnswer: 'A' | 'B' | 'C' | 'D' | null;
  startedQuestionAt: number | null;
  feedback: 'correct' | 'wrong' | null;
  setSession: (s: TestSession | null) => void;
  setQuestion: (q: NextQuestion | null) => void;
  setSelectedAnswer: (a: 'A' | 'B' | 'C' | 'D' | null) => void;
  setStartedAt: (n: number | null) => void;
  setFeedback: (f: 'correct' | 'wrong' | null) => void;
  reset: () => void;
}

export const useTestSessionStore = create<TestSessionState>((set) => ({
  session: null,
  currentQuestion: null,
  selectedAnswer: null,
  startedQuestionAt: null,
  feedback: null,
  setSession: (session) => set({ session }),
  setQuestion: (currentQuestion) =>
    set({ currentQuestion, selectedAnswer: null, startedQuestionAt: Date.now(), feedback: null }),
  setSelectedAnswer: (selectedAnswer) => set({ selectedAnswer }),
  setStartedAt: (startedQuestionAt) => set({ startedQuestionAt }),
  setFeedback: (feedback) => set({ feedback }),
  reset: () =>
    set({
      session: null,
      currentQuestion: null,
      selectedAnswer: null,
      startedQuestionAt: null,
      feedback: null,
    }),
}));
