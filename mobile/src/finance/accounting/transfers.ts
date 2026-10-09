import type { Account, Transaction, TransferLink } from '../../lib/model';

export interface TransferSuggestion {
  debitId: string;
  creditId: string;
  confidence: number;
  reason: string;
}

const WINDOW = 48 * 60 * 60 * 1000;

function linked(id: string, links: TransferLink[]): boolean {
  return links.some(link => link.debitId === id || link.creditId === id);
}

export function suggestTransfers(transactions: Transaction[], accounts: Account[], links: TransferLink[]): TransferSuggestion[] {
  const own = new Set(accounts.filter(account => account.isOwn).map(account => account.id));
  const suggestions: TransferSuggestion[] = [];
  const debits = transactions.filter(item => item.direction === 'debit' && item.status !== 'ignored' && item.transactionType !== 'refund' && !linked(item.id, links));
  const credits = transactions.filter(item => item.direction === 'credit' && item.status !== 'ignored' && item.transactionType !== 'refund' && !linked(item.id, links));
  for (const debit of debits) {
    const matches = credits.filter(credit => credit.currency === debit.currency
      && credit.amountMinor === debit.amountMinor
      && Math.abs(credit.occurredAt - debit.occurredAt) <= WINDOW
      && credit.id !== debit.id);
    if (matches.length !== 1) continue;
    const credit = matches[0];
    const sameReference = Boolean(debit.reference && debit.reference === credit.reference);
    const ownPair = Boolean(debit.accountId && credit.accountId && own.has(debit.accountId) && own.has(credit.accountId));
    const reasons = ['Same amount and currency within 48 hours'];
    if (sameReference) reasons.push('shared reference');
    if (ownPair) reasons.push('both accounts are marked as yours');
    else reasons.push('confirm both accounts belong to you before linking');
    suggestions.push({
      debitId: debit.id,
      creditId: credit.id,
      confidence: sameReference || ownPair ? 0.86 : 0.62,
      reason: reasons.join('; '),
    });
  }
  return suggestions;
}
