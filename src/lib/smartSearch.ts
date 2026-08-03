/**
 * Smart bilingual (AR/EN) search helpers.
 *
 * Handles the very common case where a user types a word while the wrong
 * keyboard layout is active — e.g. typing "apple" on an Arabic layout
 * produces "شححمث". We detect that, convert it back, and offer a
 * "Did you mean ...?" suggestion, plus fuzzy (typo tolerant) matching.
 */

/** English (QWERTY) key -> Arabic character on the standard Arabic layout. */
const EN_TO_AR: Record<string, string> = {
  q: 'ض', w: 'ص', e: 'ث', r: 'ق', t: 'ف', y: 'غ', u: 'ع', i: 'ه', o: 'خ', p: 'ح',
  '[': 'ج', ']': 'د',
  a: 'ش', s: 'س', d: 'ي', f: 'ب', g: 'ل', h: 'ا', j: 'ت', k: 'ن', l: 'م',
  ';': 'ك', "'": 'ط',
  z: 'ئ', x: 'ء', c: 'ؤ', v: 'ر', b: 'لا', n: 'ى', m: 'ة',
  ',': 'و', '.': 'ز', '/': 'ظ',
};

/** Arabic character -> English (QWERTY) key. */
const AR_TO_EN: Record<string, string> = Object.entries(EN_TO_AR).reduce(
  (acc, [en, ar]) => {
    if (!(ar in acc)) acc[ar] = en;
    return acc;
  },
  {} as Record<string, string>
);

const ARABIC_DIACRITICS = /[\u064B-\u0652\u0670\u0640]/g;

/** Normalize a string for comparison: lowercase, strip diacritics, unify alef/ya/ta-marbuta. */
export function normalizeText(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(ARABIC_DIACRITICS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Convert text typed on an Arabic layout into what the English keys would produce. */
export function arabicLayoutToEnglish(input: string): string {
  let out = '';
  for (const ch of input || '') {
    out += AR_TO_EN[ch] ?? ch;
  }
  return out;
}

/** Convert text typed on an English layout into what the Arabic keys would produce. */
export function englishLayoutToArabic(input: string): string {
  let out = '';
  for (const ch of (input || '').toLowerCase()) {
    out += EN_TO_AR[ch] ?? ch;
  }
  return out;
}

/** Levenshtein edit distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = curr;
  }
  return prev[b.length];
}

/** 0..1 similarity based on edit distance. */
export function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (!max) return 1;
  return 1 - levenshtein(a, b) / max;
}

/** All candidate readings of a query: raw + both keyboard-layout conversions. */
export function queryVariants(query: string): string[] {
  const base = normalizeText(query);
  if (!base) return [];
  const variants = new Set<string>([base]);
  const asEnglish = normalizeText(arabicLayoutToEnglish(query));
  const asArabic = normalizeText(englishLayoutToArabic(query));
  if (asEnglish) variants.add(asEnglish);
  if (asArabic) variants.add(asArabic);
  return [...variants];
}

/** True when any layout variant of `query` appears inside `haystack`. */
export function smartIncludes(haystack: string, query: string): boolean {
  const target = normalizeText(haystack);
  if (!target) return false;
  return queryVariants(query).some((v) => v.length > 0 && target.includes(v));
}

export interface SearchSuggestion {
  /** The corrected query to search with. */
  suggestion: string;
  /** How the correction was derived. */
  reason: 'layout' | 'typo';
  /** 0..1 confidence. */
  score: number;
}

/**
 * Suggest a correction for a mistyped query against a dictionary of known
 * terms (product names, keywords, blog titles...).
 *
 * Example: suggestCorrection('شححمث', ['apple', 'orange']) -> { suggestion: 'apple', reason: 'layout' }
 */
export function suggestCorrection(
  query: string,
  dictionary: string[],
  options: { minScore?: number; maxResults?: number } = {}
): SearchSuggestion | null {
  const list = suggestCorrections(query, dictionary, options);
  return list[0] ?? null;
}

/** Ranked list of correction suggestions. */
export function suggestCorrections(
  query: string,
  dictionary: string[],
  options: { minScore?: number; maxResults?: number } = {}
): SearchSuggestion[] {
  const { minScore = 0.6, maxResults = 3 } = options;
  const raw = normalizeText(query);
  if (raw.length < 2) return [];

  const terms = [...new Set(dictionary.map((d) => (d || '').trim()).filter(Boolean))];
  // Already an exact hit → nothing to suggest.
  if (terms.some((term) => normalizeText(term).includes(raw))) return [];

  const variants = queryVariants(query);
  const results: SearchSuggestion[] = [];

  for (const term of terms) {
    const normTerm = normalizeText(term);
    if (!normTerm) continue;
    let best: SearchSuggestion | null = null;

    for (const variant of variants) {
      const isLayout = variant !== raw;
      // Direct containment of a layout-converted variant is a strong signal.
      const score = normTerm.includes(variant)
        ? 1
        : similarity(variant, normTerm);
      const reason: SearchSuggestion['reason'] = isLayout ? 'layout' : 'typo';
      // Layout conversions get a small boost — they are usually intentional mistakes.
      const weighted = isLayout ? Math.min(1, score + 0.1) : score;
      if (!best || weighted > best.score) {
        best = { suggestion: term, reason, score: weighted };
      }
    }

    if (best && best.score >= minScore) results.push(best);
  }

  return results
    .sort((a, b) => b.score - a.score || a.suggestion.length - b.suggestion.length)
    .slice(0, maxResults);
}

/** Split a comma / newline separated keyword string into clean unique keywords. */
export function parseKeywords(value: string): string[] {
  return [
    ...new Set(
      (value || '')
        .split(/[,\n،]/)
        .map((k) => k.trim())
        .filter(Boolean)
    ),
  ];
}

/** Serialize keywords back into the stored comma separated format. */
export function serializeKeywords(keywords: string[]): string {
  return [...new Set(keywords.map((k) => k.trim()).filter(Boolean))].join(', ');
}

/** Find duplicate keywords (after normalization) inside a list. */
export function findDuplicateKeywords(keywords: string[]): string[] {
  const seen = new Map<string, string>();
  const dupes: string[] = [];
  for (const kw of keywords) {
    const norm = normalizeText(kw);
    if (!norm) continue;
    if (seen.has(norm)) dupes.push(kw);
    else seen.set(norm, kw);
  }
  return dupes;
}
