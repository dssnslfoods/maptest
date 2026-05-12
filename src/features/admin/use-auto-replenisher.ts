import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';
import { supabase } from '@/lib/supabase';
import { decryptApiKey } from '@/features/admin/api-key';
import { generateQuestions } from '@/features/admin/gemini-generator';
import { toast } from 'sonner';
import { ENGLISH_STRANDS, MATH_STRANDS } from '@/lib/utils';
import type { Subject, UserSettings } from '@/types/database';

interface ReplenishmentRequest {
  id: string;
  session_id: string | null;
  student_id: string;
  subject: Subject;
  grade_band: number;
  target_rit: number;
  status: 'pending' | 'fulfilling' | 'fulfilled' | 'failed';
}

const POLL_INTERVAL_MS = 12_000;
const BATCH_COUNT = 5;

/**
 * Admin browser worker — polls replenishment_requests every ~12s, claims
 * pending rows atomically (so multiple admin tabs don't race), uses the
 * admin's own Gemini key to generate questions, inserts them as active
 * items in the question bank, and marks the request fulfilled.
 *
 * Mounted from AppLayout so it runs whenever any admin has the app open.
 * Silently no-ops if the admin has no Gemini key configured.
 */
export function useAutoReplenisher(): void {
  const profile = useAuthStore((s) => s.profile);
  const isAdmin = profile?.role === 'admin';
  const busy = useRef(false);

  useEffect(() => {
    if (!isAdmin || !profile?.id) return;
    let cancelled = false;

    const tick = async () => {
      if (cancelled || busy.current) return;
      busy.current = true;
      try {
        const { data: requests, error: listError } = await supabase
          .from('replenishment_requests')
          .select('id, session_id, student_id, subject, grade_band, target_rit, status')
          .eq('status', 'pending')
          .order('created_at')
          .limit(3);
        if (listError) return;
        if (!requests || requests.length === 0) return;

        // Admin's Gemini key — fetch once per tick
        const { data: settingsRow } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', profile.id)
          .maybeSingle();
        const settings = settingsRow as UserSettings | null;
        if (!settings?.gemini_api_key_encrypted) return;
        let apiKey: string;
        try {
          apiKey = await decryptApiKey(settings.gemini_api_key_encrypted, profile.id);
        } catch {
          return;
        }

        for (const req of requests as ReplenishmentRequest[]) {
          if (cancelled) break;

          // Claim atomically — only one admin tab will succeed
          const { data: claimed, error: claimErr } = await supabase.rpc(
            'claim_replenishment',
            { p_request_id: req.id },
          );
          if (claimErr || !claimed) continue;

          // Pick a strand at random from the right subject pool so the batch
          // gets diverse content over time. The student's adaptive engine only
          // requires RIT-appropriate items; strand cycling is for coverage.
          const strands = req.subject === 'math' ? MATH_STRANDS : ENGLISH_STRANDS;
          const strand = strands[Math.floor(Math.random() * strands.length)];

          try {
            const { questions: gen } = await generateQuestions(
              {
                apiKey,
                subject: req.subject,
                strand,
                gradeBand: req.grade_band,
                targetRit: req.target_rit,
                count: BATCH_COUNT,
              },
              { maxRetries: 3 },
            );

            const rows = gen.map((q) => ({
              subject: req.subject,
              strand,
              grade_band: req.grade_band,
              difficulty_rit: req.target_rit,
              question_text: q.question_text,
              passage_text: q.passage_text ?? null,
              question_image_url: null,
              choice_a: q.choice_a,
              choice_b: q.choice_b,
              choice_c: q.choice_c,
              choice_d: q.choice_d,
              correct_answer: q.correct_answer,
              explanation: q.explanation ?? null,
              active: true,
            }));

            const { error: insErr } = await supabase.from('questions').insert(rows);
            if (insErr) throw insErr;

            const { error: fulfillErr } = await supabase.rpc('fulfill_replenishment', {
              p_request_id: req.id,
              p_count: rows.length,
            });
            if (fulfillErr) throw fulfillErr;

            toast.success(
              `Auto-generated ${rows.length} new ${req.subject} questions for a student.`,
            );
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Unknown error';
            await supabase
              .rpc('fail_replenishment', { p_request_id: req.id, p_error: msg })
              .then(() => undefined, () => undefined);
            toast.error(`Auto-replenishment failed: ${msg}`);
          }
        }
      } finally {
        busy.current = false;
      }
    };

    // Run once immediately, then on interval
    tick();
    const interval = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isAdmin, profile?.id]);
}
