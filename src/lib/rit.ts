// RIT scale utilities and grade-level norms (kept in sync with start_test_session)

export const RIT_NORMS = {
  english: {
    0: 142, 1: 160, 2: 174, 3: 188, 4: 198, 5: 206,
    6: 211, 7: 214, 8: 217, 9: 220, 10: 223, 11: 224, 12: 225,
  } as Record<number, number>,
  math: {
    0: 140, 1: 162, 2: 177, 3: 190, 4: 201, 5: 210,
    6: 215, 7: 219, 8: 222, 9: 226, 10: 229, 11: 230, 12: 231,
  } as Record<number, number>,
};

export type Subject = 'english' | 'math';

export function gradeNorm(subject: Subject, grade: number): number {
  return RIT_NORMS[subject][grade] ?? 200;
}

// Approximate percentile from RIT relative to a grade-level norm
// Uses a rough normal-distribution approximation around the norm with SD ~15.
export function approximatePercentile(rit: number, subject: Subject, grade: number): number {
  const mean = gradeNorm(subject, grade);
  const sd = 15;
  const z = (rit - mean) / sd;
  // Abramowitz-Stegun approximation of standard normal CDF
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804 * Math.exp(-(z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const cdf = z > 0 ? 1 - p : p;
  return Math.round(cdf * 100);
}

export function performanceBand(
  rit: number,
  subject: Subject,
  grade: number,
): 'below' | 'at' | 'above' {
  const mean = gradeNorm(subject, grade);
  if (rit >= mean + 5) return 'above';
  if (rit <= mean - 5) return 'below';
  return 'at';
}
