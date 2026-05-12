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

export async function generateQuestions(p: GenerationParams): Promise<{
  questions: GeneratedQuestion[];
  prompt: string;
}> {
  const genAI = new GoogleGenerativeAI(p.apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7,
    },
  });

  const prompt = buildPrompt(p);
  const result = await model.generateContent(prompt);
  const raw = result.response.text();
  const parsed = BatchSchema.parse(JSON.parse(raw));
  return { questions: parsed.questions, prompt };
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
