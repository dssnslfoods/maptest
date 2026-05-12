import { useMemo } from 'react';
import { InlineMath, BlockMath } from 'react-katex';

// Render plain text with $...$ inline-math and $$...$$ block-math delimiters
export function MathText({ text }: { text: string }) {
  const segments = useMemo(() => parse(text), [text]);
  return (
    <>
      {segments.map((s, i) => {
        if (s.type === 'inline') {
          return <InlineMath key={i} math={s.value} />;
        }
        if (s.type === 'block') {
          return <BlockMath key={i} math={s.value} />;
        }
        // preserve newlines in plain text
        return (
          <span key={i} style={{ whiteSpace: 'pre-wrap' }}>
            {s.value}
          </span>
        );
      })}
    </>
  );
}

type Segment = { type: 'text' | 'inline' | 'block'; value: string };

function parse(input: string): Segment[] {
  const out: Segment[] = [];
  let i = 0;
  while (i < input.length) {
    if (input.startsWith('$$', i)) {
      const end = input.indexOf('$$', i + 2);
      if (end === -1) {
        out.push({ type: 'text', value: input.slice(i) });
        break;
      }
      out.push({ type: 'block', value: input.slice(i + 2, end) });
      i = end + 2;
    } else if (input[i] === '$') {
      const end = input.indexOf('$', i + 1);
      if (end === -1) {
        out.push({ type: 'text', value: input.slice(i) });
        break;
      }
      out.push({ type: 'inline', value: input.slice(i + 1, end) });
      i = end + 1;
    } else {
      let j = i;
      while (j < input.length && input[j] !== '$') j++;
      out.push({ type: 'text', value: input.slice(i, j) });
      i = j;
    }
  }
  return out;
}
