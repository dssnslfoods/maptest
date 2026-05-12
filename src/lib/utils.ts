import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GRADE_LABELS: Record<number, string> = {
  0: 'Kindergarten',
  1: 'Grade 1',
  2: 'Grade 2',
  3: 'Grade 3',
  4: 'Grade 4',
  5: 'Grade 5',
  6: 'Grade 6',
  7: 'Grade 7',
  8: 'Grade 8',
  9: 'Grade 9',
  10: 'Grade 10',
  11: 'Grade 11',
  12: 'Grade 12',
};

export const ENGLISH_STRANDS = [
  'reading_literature',
  'reading_informational',
  'vocabulary',
  'language_usage',
  'writing',
] as const;

export const MATH_STRANDS = [
  'operations_algebraic',
  'number_operations',
  'measurement_data',
  'geometry',
  'statistics_probability',
  'ratios_proportions',
  'functions',
] as const;

export function formatStrand(strand: string): string {
  return strand
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
