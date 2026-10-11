import type { Direction, ThreadKind, TransactionType } from './model';

const typeNames: Record<TransactionType, string> = {
  expense: 'Purchase',
  income: 'Income',
  refund: 'Refund',
  internal_transfer: 'Move between my accounts',
  cash_withdrawal: 'ATM cash',
  fee: 'Fee',
  adjustment: 'Correction',
};

export function typeLabel(type: TransactionType): string {
  return typeNames[type];
}

export function typesFor(direction: Direction): TransactionType[] {
  return direction === 'debit' ? ['expense', 'cash_withdrawal', 'fee', 'adjustment'] : ['income', 'refund', 'adjustment'];
}

const pathNames: Record<ThreadKind, string> = {
  SELF_TRANSFER: 'Move between your accounts',
  CASH_CONVERSION: 'ATM cash to your wallet',
  LOAN_OUT: 'Money lent',
  LOAN_REPAYMENT: 'Loan returned',
  COMMITTEE_CONTRIBUTION: 'Committee payment',
  COMMITTEE_PAYOUT: 'Committee payout',
  REFUND: 'Refund of an earlier spend',
  DUPLICATE: 'Same entry twice',
  RECURRING_COMMITMENT: 'Repeats every month',
};

export function pathLabel(kind: ThreadKind): string {
  return pathNames[kind] ?? 'Connected entries';
}

export function recentCategories(rows: { category: string; occurredAt: number; direction: Direction }[], direction: Direction, limit = 6): string[] {
  const seen: string[] = [];
  for (const row of [...rows].sort((a, b) => b.occurredAt - a.occurredAt)) {
    if (row.direction !== direction || seen.includes(row.category)) continue;
    seen.push(row.category);
    if (seen.length >= limit) break;
  }
  return seen;
}
