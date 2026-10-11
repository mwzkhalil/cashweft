export type HistoryChoice = '30d' | '90d' | '1y' | 'all' | 'custom';

const day = 86_400_000;

export function historyBounds(choice: HistoryChoice, now: number, custom?: { from: number; to: number }): { since: number; until: number } {
  if (choice === 'all') return { since: 0, until: now };
  if (choice === '30d') return { since: now - 30 * day, until: now };
  if (choice === '90d') return { since: now - 90 * day, until: now };
  if (choice === '1y') return { since: now - 365 * day, until: now };
  const from = custom?.from ?? now;
  const to = custom?.to ?? now;
  return { since: Math.min(from, to), until: Math.max(from, to) };
}

export function parseDay(value: string, end: boolean): number | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const dayOfMonth = Number(match[3]);
  const date = new Date(year, month - 1, dayOfMonth, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== dayOfMonth) return null;
  return date.getTime();
}
