import type { Transaction } from '../../lib/model';

export interface DuplicateHint {
  leftId: string;
  rightId: string;
  reason: string;
}

const WINDOW = 10 * 60 * 1000;

export function duplicateHints(transactions: Transaction[]): DuplicateHint[] {
  const hints: DuplicateHint[] = [];
  const sorted = [...transactions].filter(item => item.status !== 'ignored').sort((a, b) => a.occurredAt - b.occurredAt);
  for (let index = 0; index < sorted.length; index += 1) {
    const left = sorted[index];
    for (let next = index + 1; next < sorted.length; next += 1) {
      const right = sorted[next];
      if (right.occurredAt - left.occurredAt > WINDOW) break;
      if (left.id === right.id || left.amountMinor !== right.amountMinor || left.currency !== right.currency) continue;
      if (left.merchant.trim().toLowerCase() !== right.merchant.trim().toLowerCase()) continue;
      if (left.reference && right.reference && left.reference !== right.reference) continue;
      const sameSource = Boolean(left.sourceHash && left.sourceHash === right.sourceHash);
      hints.push({
        leftId: left.id,
        rightId: right.id,
        reason: sameSource
          ? 'Same source message was stored twice.'
          : 'Same merchant and amount within 10 minutes. Confirm before treating them as one payment.',
      });
    }
  }
  return hints;
}
