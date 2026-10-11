import type { MoneyThread, Transaction } from '../../lib/model';
import { applyThread } from '../threads/decide';
import { incomeTotal, isIgnored, netSpend } from './ledger';

export interface PeriodSummary {
  spentMinor: number;
  receivedMinor: number;
  movedMinor: number;
}

export type ActivityView = 'all' | 'spent' | 'received' | 'moved' | 'review';

export function isMove(transaction: Transaction): boolean {
  return transaction.transactionType === 'internal_transfer' || transaction.transactionType === 'cash_withdrawal';
}

export function matchesView(item: Transaction, view: ActivityView): boolean {
  if (view === 'review') return item.status === 'review';
  if (view === 'moved') return isMove(item);
  if (view === 'spent') return item.direction === 'debit' && !isMove(item) && !isIgnored(item);
  if (view === 'received') return item.direction === 'credit' && !isMove(item) && !isIgnored(item);
  return true;
}

function confirmedFor(transactions: Transaction[], threads: MoneyThread[]): MoneyThread[] {
  const ids = new Set(transactions.map(item => item.id));
  return threads.filter(thread => thread.status === 'confirmed' && !thread.partial && thread.transactionIds.some(id => ids.has(id)));
}

export function withPaths(transactions: Transaction[], threads: MoneyThread[]): Transaction[] {
  return confirmedFor(transactions, threads).reduce(applyThread, transactions);
}

export function periodSummary(transactions: Transaction[], threads: MoneyThread[]): PeriodSummary {
  const relevant = confirmedFor(transactions, threads);
  const adjusted = relevant.reduce(applyThread, transactions);
  const selfCredits = new Set(relevant.filter(thread => thread.kind === 'SELF_TRANSFER').flatMap(thread => thread.transactionIds));
  const received = incomeTotal(adjusted.filter(item => !(item.direction === 'credit' && selfCredits.has(item.id))));
  const moved = adjusted.reduce((sum, item) => !isIgnored(item) && item.direction === 'debit' && (item.transactionType === 'internal_transfer' || item.transactionType === 'cash_withdrawal') ? sum + item.amountMinor : sum, 0);
  return { spentMinor: Math.max(0, netSpend(adjusted)), receivedMinor: received, movedMinor: moved };
}
