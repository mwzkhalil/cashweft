import type { CurrencyCode, Direction, GroupingStyle } from './model';
import { formatMoney } from './money';

const dated = new Intl.DateTimeFormat('en-PK', { weekday: 'short', day: 'numeric', month: 'short' });
const timed = new Intl.DateTimeFormat('en-PK', { hour: 'numeric', minute: '2-digit', hour12: true });

export function money(minor: number, currency: CurrencyCode = 'PKR', grouping: GroupingStyle = 'international', forceDecimals = false): string {
  return `\u200E${formatMoney(minor, currency, grouping, forceDecimals)}`;
}

export function signedMoney(minor: number, direction: Direction, currency: CurrencyCode = 'PKR', forceDecimals = false, grouping: GroupingStyle = 'international'): string {
  return `\u200E${direction === 'debit' ? '−' : '+'}${formatMoney(minor, currency, grouping, forceDecimals)}`;
}

export function dateLabel(timestamp: number): string { return dated.format(new Date(timestamp)); }
export function timeLabel(timestamp: number): string { return timed.format(new Date(timestamp)).toLowerCase(); }
export function monthLabel(timestamp: number): string {
  return new Intl.DateTimeFormat('en-PK', { month: 'long' }).format(new Date(timestamp));
}
export function startOfMonth(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
}
export function endOfMonth(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
}
