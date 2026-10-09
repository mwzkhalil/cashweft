import { textToMinor } from '../../lib/money';

export interface AmountHit {
  minor: number;
  index: number;
  raw: string;
  role: 'transaction' | 'balance' | 'limit' | 'unknown';
}

const RUPEE = 'روپ[\\u06CC\\u06D2\\u064A]';
const AMOUNT = new RegExp(`(?:PKR|Rs\\.?|INR|₹|${RUPEE}|رقم)\\s*([\\d,]+(?:\\.\\d{1,2})?)|([\\d,]+(?:\\.\\d{1,2})?)\\s*(?:PKR|Rs\\.?|INR|₹|${RUPEE})`, 'gi');

const BALANCE = /(?:avl\.?\s*bal|available\s+balance|remaining\s+balance|balance\s+(?:is|rs|pkr|inr)|باقی|بقایا|بیلنس)/i;
const LIMIT = /(?:credit\s+limit|limit\s+is|daily\s+limit)/i;
const TRANSACTION = /(?:debit(?:ed)?|credit(?:ed)?|deduct(?:ed)?|spent|paid|payment|withdrawn|sent|transfer(?:red)?|received|deposited|refund|reversal|reversed|kata|kat\s+gaya|kat\s+gyi|bhej|nikal|wasool|hasil|jama|خرچ|کٹوتی|بھیج|موصول|جمع|واپس)/i;

function nearestBefore(before: string): AmountHit['role'] | null {
  const cues: { index: number; role: AmountHit['role'] }[] = [];
  for (const [pattern, role] of [[BALANCE, 'balance'], [LIMIT, 'limit'], [TRANSACTION, 'transaction']] as const) {
    for (const match of before.matchAll(new RegExp(pattern.source, 'gi'))) cues.push({ index: match.index ?? 0, role });
  }
  cues.sort((left, right) => right.index - left.index);
  return cues[0]?.role ?? null;
}

function roleAt(body: string, index: number, rawLength: number): AmountHit['role'] {
  const before = body.slice(Math.max(0, index - 40), index);
  const after = body.slice(index + rawLength, index + rawLength + 24);
  return nearestBefore(before) ?? (TRANSACTION.test(after) ? 'transaction' : 'unknown');
}

export function extractAmounts(body: string): AmountHit[] {
  const hits: AmountHit[] = [];
  for (const match of body.matchAll(AMOUNT)) {
    const numeric = match[1] ?? match[2] ?? '';
    const minor = textToMinor(numeric);
    if (minor === null) continue;
    hits.push({ minor, index: match.index ?? 0, raw: match[0], role: roleAt(body, match.index ?? 0, match[0].length) });
  }
  return hits;
}

export function chooseTransactionAmount(hits: AmountHit[]): { minor: number; contextual: boolean } | null {
  const contextual = hits.filter(hit => hit.role === 'transaction');
  const distinct = [...new Set(contextual.map(hit => hit.minor))];
  if (distinct.length > 1) return null;
  if (distinct.length === 1) return { minor: distinct[0], contextual: true };
  const unknown = hits.filter(hit => hit.role === 'unknown');
  const unknownDistinct = [...new Set(unknown.map(hit => hit.minor))];
  if (unknownDistinct.length === 1) return { minor: unknownDistinct[0], contextual: false };
  return null;
}
