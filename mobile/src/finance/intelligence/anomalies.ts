import type { Transaction } from '../../lib/model';
import { countsAsExpense } from '../accounting/ledger';
import { merchantKey } from '../accounting/corrections';

export interface UnusualSpend {
  merchant: string;
  latestMinor: number;
  medianMinor: number;
  samples: number;
  reason: string;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export function unusualSpend(transactions: Transaction[]): UnusualSpend[] {
  const groups = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    if (!countsAsExpense(transaction)) continue;
    const key = merchantKey(transaction.merchant);
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), transaction]);
  }
  const alerts: UnusualSpend[] = [];
  for (const items of groups.values()) {
    if (items.length < 5) continue;
    const ordered = [...items].sort((a, b) => a.occurredAt - b.occurredAt);
    const latest = ordered[ordered.length - 1];
    const prior = ordered.slice(0, -1).map(item => item.amountMinor);
    const mid = median(prior);
    if (mid <= 0 || latest.amountMinor < mid * 2) continue;
    alerts.push({
      merchant: latest.merchant,
      latestMinor: latest.amountMinor,
      medianMinor: mid,
      samples: prior.length,
      reason: `Latest payment is at least twice the median of ${prior.length} earlier payments at this merchant.`,
    });
  }
  return alerts;
}
