export interface FuzzyMatch {
  matched: boolean;
  score: number;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function fuzzySequenceScore(needle: string, haystack: string): number {
  let pos = -1;
  let gaps = 0;
  for (const ch of needle) {
    const next = haystack.indexOf(ch, pos + 1);
    if (next === -1) return 0;
    if (pos >= 0) gaps += next - pos - 1;
    pos = next;
  }
  return Math.max(8, 55 - gaps);
}

export function fuzzyMatch(query: string, fields: string[]): FuzzyMatch {
  const q = normalize(query);
  if (!q) return { matched: true, score: 1 };

  let best = 0;
  for (const rawField of fields) {
    const field = normalize(rawField);
    if (!field) continue;
    if (field === q) best = Math.max(best, 120);
    else if (field.startsWith(q)) best = Math.max(best, 100);
    else {
      const idx = field.indexOf(q);
      if (idx >= 0) best = Math.max(best, 80 - Math.min(idx, 30));
      else best = Math.max(best, fuzzySequenceScore(q, field));
    }
  }

  return { matched: best > 0, score: best };
}
