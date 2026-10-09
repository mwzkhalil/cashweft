import { CASH_ACCOUNT_ID } from '../../lib/model';
import type { CashAdjustment, Transaction, TransactionType } from '../../lib/model';

export function isIgnored(transaction: Transaction): boolean {
  return transaction.status === 'ignored';
}

export function countsAsExpense(transaction: Transaction): boolean {
  if (isIgnored(transaction)) return false;
  return transaction.transactionType === 'expense' || transaction.transactionType === 'fee';
}

export function countsAsIncome(transaction: Transaction): boolean {
  if (isIgnored(transaction)) return false;
  return transaction.transactionType === 'income';
}

export function countsAsRefund(transaction: Transaction): boolean {
  if (isIgnored(transaction)) return false;
  return transaction.transactionType === 'refund';
}

export function netSpend(transactions: Transaction[]): number {
  return transactions.reduce((sum, transaction) => {
    if (countsAsExpense(transaction)) return sum + transaction.amountMinor;
    if (countsAsRefund(transaction)) return sum - transaction.amountMinor;
    return sum;
  }, 0);
}

export function incomeTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, transaction) => countsAsIncome(transaction) ? sum + transaction.amountMinor : sum, 0);
}

export function categoryNet(transactions: Transaction[], category: string): number {
  return netSpend(transactions.filter(transaction => transaction.category === category));
}

export function cashEstimate(transactions: Transaction[], adjustments: CashAdjustment[]): number {
  const movement = transactions.reduce((sum, transaction) => {
    if (isIgnored(transaction)) return sum;
    if (transaction.transactionType === 'cash_withdrawal') return sum + transaction.amountMinor;
    if (transaction.accountId === CASH_ACCOUNT_ID && countsAsExpense(transaction)) return sum - transaction.amountMinor;
    if (transaction.accountId === CASH_ACCOUNT_ID && countsAsIncome(transaction)) return sum + transaction.amountMinor;
    return sum;
  }, 0);
  return movement + adjustments.reduce((sum, item) => sum + item.amountMinor, 0);
}

export function priorType(type: TransactionType): TransactionType {
  return type === 'internal_transfer' ? 'expense' : type;
}
