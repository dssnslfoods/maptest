import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const GeneratedQuestionSchema = z.object({
  question_text: z.string().min(5),
  passage_text: z.string().optional().nullable(),
  choice_a: z.string().min(1),
  choice_b: z.string().min(1),
  choice_c: z.string().min(1),
  choice_d: z.string().min(1),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(5),
});

export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;

const BatchSchema = z.object({ questions: z.array(GeneratedQuestionSchema) });

export type GenerationParams = {
  apiKey: string;
  subject: 'math' | 'english';
  strand: string;
  gradeBand: number;
  targetRit: number;
  count: number;
};

export interface GenerateOptions {
  maxRetries?: number;
  onRetry?: (attempt: number, delayMs: number, error: Error) => void;
}

// Detect retryable Gemini failures — 503 (overloaded), 429 (rate limit),
// 500 (transient internal). Anything else (auth, schema, etc.) is fatal.
function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /\b(503|429|500)\b|overloaded|unavailable|temporarily|rate.?limit/i.test(msg);
}

// Map a raw SDK error into a friendlier message
function humanize(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (/\b503\b|overloaded|unavailable/i.test(raw)) {
    return 'Gemini is temporarily overloaded (503). Please try again in a minute or two.';
  }
  if (/\b429\b|rate.?limit/i.test(raw)) {
    return 'Gemini rate limit hit (429). Wait a moment and retry, or generate fewer questions per batch.';
  }
  if (/\b401\b|api.?key|invalid|unauthor/i.test(raw)) {
    return 'Gemini rejected the API key (401). Check the key in Settings → AI provider settings.';
  }
  if (/\b400\b|invalid.?request/i.test(raw)) {
    return 'Gemini rejected the request (400). The prompt may be malformed — try a smaller count.';
  }
  return raw;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generateQuestions(
  p: GenerationParams,
  options: GenerateOptions = {},
): Promise<{ questions: GeneratedQuestion[]; prompt: string }> {
  const maxRetries = options.maxRetries ?? 3;
  const genAI = new GoogleGenerativeAI(p.apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const prompt = buildPrompt(p);

  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.text();
      const parsed = BatchSchema.parse(JSON.parse(raw));
      return { questions: parsed.questions, prompt };
    } catch (e) {
      lastError = e;
      const remaining = maxRetries - attempt - 1;
      if (remaining > 0 && isTransient(e)) {
        // Exponential backoff with jitter: 1.5s, 4s, 9s …
        const baseDelay = 1500 * Math.pow(2, attempt);
        const jitter = Math.floor(Math.random() * 500);
        const delay = baseDelay + jitter;
        options.onRetry?.(attempt + 1, delay, e instanceof Error ? e : new Error(String(e)));
        await sleep(delay);
        continue;
      }
      break;
    }
  }
  throw new Error(humanize(lastError));
}

export async function testApiKey(apiKey: string): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Reply with the single word: OK');
    const txt = result.response.text();
    return /OK/i.test(txt);
  } catch {
    return false;
  }
}

function buildPrompt(p: GenerationParams): string {
  return `You are an expert assessment item writer for the NWEA MAP Growth test.
Generate ${p.count} multiple-choice question(s) following these strict rules:

SUBJECT: ${p.subject}
STRAND: ${p.strand}
GRADE BAND: ${p.gradeBand} (US grade level, K=0)
TARGET DIFFICULTY: RIT ${p.targetRit} (Rasch Unit scale 100-350)

RIT DIFFICULTY GUIDE:
- RIT 140-160: Early elementary, basic concepts, simple vocabulary
- RIT 160-185: Elementary, single-step problems, common words
- RIT 185-210: Upper elementary, two-step problems, grade-level vocabulary
- RIT 210-225: Middle school, multi-step reasoning, abstract concepts
- RIT 225-245: High school, complex inference, advanced vocabulary
- RIT 245+: Advanced high school / college-prep, nuanced reasoning

REQUIREMENTS:
1. Exactly 4 answer choices (A, B, C, D), only ONE correct.
2. Distractors must reflect plausible misconceptions students at this RIT actually make.
3. Question text appropriate to grade reading level.
4. ${
    p.subject === 'english'
      ? 'If strand is "reading_literature" or "reading_informational", include a 60-150 word passage_text. Otherwise leave passage_text empty/null.'
      : 'For math, use plain text expressions or LaTeX-style notation in $...$ delimiters (e.g., $\\frac{3}{4}$). Do NOT include passage_text.'
  }
5. Provide a clear 1-2 sentence explanation of why the correct answer is right.
6. No cultural bias, no real-name references, no controversial topics.
7. Avoid "all of the above" / "none of the above" distractors.

OUTPUT FORMAT (strict JSON, no markdown fences):
{
  "questions": [
    {
      "question_text": "...",
      "passage_text": "..." or null,
      "choice_a": "...",
      "choice_b": "...",
      "choice_c": "...",
      "choice_d": "...",
      "correct_answer": "A" | "B" | "C" | "D",
      "explanation": "..."
    }
  ]
}`;
}
