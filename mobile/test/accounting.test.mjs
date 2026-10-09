import assert from 'node:assert/strict';
import test from 'node:test';
import { cashEstimate, incomeTotal, netSpend } from '../src/finance/accounting/ledger.ts';
import { suggestTransfers } from '../src/finance/accounting/transfers.ts';
import { categoryFromMemory, rememberCorrection } from '../src/finance/accounting/corrections.ts';
import { findRecurring } from '../src/finance/intelligence/recurring.ts';
import { budgetPace, periodChange } from '../src/finance/intelligence/forecast.ts';
import { duplicateHints } from '../src/finance/intelligence/duplicates.ts';

function entry(partial) {
  return {
    id: 't', sourceHash: null, sender: null, rawBody: null, occurredAt: 0, merchant: 'Shop', amountMinor: 100,
    currency: 'PKR', direction: 'debit', transactionType: 'expense', category: 'Groceries', status: 'manual',
    accountLast4: null, reference: null, confidence: 1, providerId: null, accountId: null, counterpartyAccountId: null,
    rail: null, createdAt: 0, updatedAt: 0, ...partial,
  };
}

test('withdrawals and linked transfers are not spending, refunds reduce it', () => {
  const rows = [
    entry({ id: 'a', amountMinor: 10000, transactionType: 'expense' }),
    entry({ id: 'b', amountMinor: 5000, transactionType: 'cash_withdrawal' }),
    entry({ id: 'c', amountMinor: 2000, transactionType: 'internal_transfer' }),
    entry({ id: 'd', amountMinor: 1500, direction: 'credit', transactionType: 'refund' }),
    entry({ id: 'e', amountMinor: 8000, direction: 'credit', transactionType: 'income' }),
  ];
  assert.equal(netSpend(rows), 8500);
  assert.equal(incomeTotal(rows), 8000);
});

test('suggests one matching pair and stays quiet when two credits could match', () => {
  const debit = entry({ id: 'd', amountMinor: 500000, accountId: 'hbl', reference: 'ABC12345', occurredAt: 1_000 });
  const credit = entry({ id: 'c', direction: 'credit', transactionType: 'income', amountMinor: 500000, accountId: 'jazz', reference: 'ABC12345', occurredAt: 2_000 });
  const accounts = [
    { id: 'hbl', name: 'HBL', kind: 'bank', providerId: 'hbl', maskedId: null, isOwn: true, createdAt: 0 },
    { id: 'jazz', name: 'JazzCash', kind: 'wallet', providerId: 'jazzcash', maskedId: null, isOwn: true, createdAt: 0 },
  ];
  const suggested = suggestTransfers([debit, credit], accounts, []);
  assert.equal(suggested.length, 1);
  assert.match(suggested[0].reason, /both accounts are marked as yours/);
  const extra = entry({ id: 'c2', direction: 'credit', transactionType: 'income', amountMinor: 500000, occurredAt: 3_000 });
  assert.equal(suggestTransfers([debit, credit, extra], accounts, []).length, 0);
});

test('cash estimate adds withdrawals and subtracts cash expenses', () => {
  const rows = [
    entry({ id: 'w', amountMinor: 1000000, transactionType: 'cash_withdrawal' }),
    entry({ id: 'g', amountMinor: 250000, transactionType: 'expense', accountId: 'cash-wallet', category: 'Groceries' }),
  ];
  assert.equal(cashEstimate(rows, [{ id: 'a', amountMinor: -80000, note: 'count', occurredAt: 1 }]), 670000);
});

test('remembers a merchant only after a repeated correction', () => {
  const once = rememberCorrection([], 'ABC Fuel Station', 'Fuel', 1);
  assert.equal(categoryFromMemory('ABC Fuel Station', 'Shopping', once), 'Shopping');
  const twice = rememberCorrection(once, 'ABC Fuel Station', 'Fuel', 2);
  assert.equal(categoryFromMemory('ABC Fuel Station', 'Shopping', twice), 'Fuel');
  assert.equal(categoryFromMemory('Other Shop', 'Shopping', twice), 'Shopping');
});

test('recurring payments need three similar intervals', () => {
  const month = 30 * 86400000;
  const rows = [0, 1, 2].map(index => entry({ id: String(index), merchant: 'PTCL Bill', category: 'Utilities', amountMinor: 250000, occurredAt: index * month }));
  assert.equal(findRecurring(rows).length, 1);
  assert.equal(findRecurring(rows.slice(0, 2)).length, 0);
});

test('budget pace explains its assumption and refuses a thin history', () => {
  assert.equal(budgetPace(1150000, 1500000, 3, 30).status, 'insufficient');
  const pace = budgetPace(1150000, 1500000, 20, 30);
  assert.equal(pace.status, 'at-risk');
  assert.match(pace.assumption, /average daily spend/);
  assert.equal(periodChange(10, 0).comparable, false);
});

test('same amount at the same merchant can still be two payments outside the window', () => {
  const left = entry({ id: '1', occurredAt: 0, reference: 'ONE' });
  const right = entry({ id: '2', occurredAt: 11 * 60 * 1000, reference: 'TWO' });
  assert.equal(duplicateHints([left, right]).length, 0);
  assert.equal(duplicateHints([left, { ...right, occurredAt: 60 * 1000, reference: 'TWO' }]).length, 0);
  assert.equal(duplicateHints([left, { ...right, occurredAt: 60 * 1000, reference: null }]).length, 1);
});
