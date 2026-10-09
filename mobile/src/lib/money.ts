import type { CurrencyCode, GroupingStyle } from './model';

const MAX_MINOR = 1_000_000_000;

export function textToMinor(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim();
  const match = cleaned.match(/^(\d+)(?:\.(\d{1,2}))?$/);
  if (!match) return null;
  const whole = Number(match[1]);
  if (!Number.isSafeInteger(whole)) return null;
  const fraction = (match[2] ?? '').padEnd(2, '0');
  const minor = whole * 100 + Number(fraction || '0');
  if (!Number.isSafeInteger(minor) || minor <= 0 || minor > MAX_MINOR) return null;
  return minor;
}

export function groupDigits(whole: string, grouping: GroupingStyle): string {
  if (grouping === 'international') return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (whole.length <= 3) return whole;
  const head = whole.slice(0, -3);
  const tail = whole.slice(-3);
  return `${head.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${tail}`;
}

export function formatMinor(minor: number, grouping: GroupingStyle = 'international', forceDecimals = false): string {
  const sign = minor < 0 ? '−' : '';
  const abs = Math.abs(minor);
  const whole = String(Math.trunc(abs / 100));
  const fraction = String(abs % 100).padStart(2, '0');
  const grouped = groupDigits(whole, grouping);
  if (!forceDecimals && fraction === '00') return `${sign}${grouped}`;
  return `${sign}${grouped}.${fraction}`;
}

export function formatMoney(minor: number, currency: CurrencyCode = 'PKR', grouping: GroupingStyle = 'international', forceDecimals = false): string {
  const amount = formatMinor(minor, grouping, forceDecimals);
  return currency === 'INR' ? `₹${amount}` : `Rs. ${amount}`;
}
