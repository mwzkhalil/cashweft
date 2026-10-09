import type { Transaction } from '../../lib/model';
import { countsAsExpense } from '../accounting/ledger';
import { merchantKey } from '../accounting/corrections';

export interface RecurringPayment {
  merchantKey: string;
  merchant: string;
  count: number;
  medianMinor: number;
  intervalDays: number;
  reason: string;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function findRecurring(transactions: Transaction[]): RecurringPayment[] {
  const groups = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    if (!countsAsExpense(transaction)) continue;
    const key = merchantKey(transaction.merchant);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), transaction]);
  }
  const found: RecurringPayment[] = [];
  for (const [key, items] of groups) {
    if (items.length < 3) continue;
    const ordered = [...items].sort((a, b) => a.occurredAt - b.occurredAt);
    const gaps = ordered.slice(1).map((item, index) => (item.occurredAt - ordered[index].occurredAt) / 86400000);
    const typical = median(gaps);
    const monthly = typical >= 25 && typical <= 35;
    const weekly = typical >= 6 && typical <= 8;
    if (!monthly && !weekly) continue;
    const amounts = ordered.map(item => item.amountMinor);
    const mid = median(amounts);
    if (amounts.some(amount => Math.abs(amount - mid) > mid * 0.15)) continue;
    found.push({
      merchantKey: key,
      merchant: ordered[ordered.length - 1].merchant,
      count: ordered.length,
      medianMinor: mid,
      intervalDays: typical,
      reason: monthly ? 'Three or more payments about a month apart, amounts within 15%.' : 'Three or more payments about a week apart, amounts within 15%.',
    });
  }
  return found;
}
