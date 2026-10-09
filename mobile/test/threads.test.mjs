import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { semanticMarkers } from '../src/finance/threads/markers.ts';
import {
  applyThread, canActivateModel, decisionScore, deviceTier, hypothesesFor, moneySuggestions, passesGate, trueSpend, undoThread,
} from '../src/finance/threads/decide.ts';
import { activatePack, OPENJEV } from '../src/finance/threads/pack.ts';
import { migrateSnapshot } from '../src/lib/snapshot.ts';

const day = 86400000;
const base = Date.parse('2026-09-12T10:02:00');

function tx(partial) {
  return {
    id: 't', sourceHash: null, sender: null, rawBody: null, occurredAt: base, merchant: 'Shop',
    amountMinor: 1000000, currency: 'PKR', direction: 'debit', transactionType: 'expense', category: 'Shopping', status: 'manual',
    accountLast4: null, reference: null, confidence: 1, providerId: null, accountId: null, counterpartyAccountId: null, rail: null,
    createdAt: base, updatedAt: base, ...partial,
  };
}

function own(id, name) {
  return { id, name, kind: 'bank', providerId: null, maskedId: null, isOwn: true, createdAt: base };
}

test('recognises roman urdu and urdu lending words without deciding the ledger', () => {
  assert.equal(semanticMarkers('Ali ko udhar diye').lending, true);
  assert.equal(semanticMarkers('qarz wapas').returned, true);
  assert.equal(semanticMarkers('committee ki bachat').committee, true);
  assert.equal(semanticMarkers('زکوٰۃ اور صدقہ').zakat, true);
  assert.equal(semanticMarkers('grocery').lending, false);
});

test('suggests a self transfer only when the structure matches', () => {
  const accounts = [own('hbl', 'HBL'), own('jazz', 'JazzCash')];
  const rows = [
    tx({ id: 'out', merchant: 'HBL', accountId: 'hbl', occurredAt: base }),
    tx({ id: 'in', merchant: 'JazzCash', accountId: 'jazz', direction: 'credit', transactionType: 'income', category: 'Income', occurredAt: base + 2 * 60000 }),
  ];
  const cards = moneySuggestions(rows, accounts, [], []);
  assert.equal(cards.some(card => card.kind === 'SELF_TRANSFER'), true);
  assert.equal(passesGate('SELF_TRANSFER', [rows[0], tx({ id: 'other', amountMinor: 500 })], accounts), false);
  const blocked = moneySuggestions(rows, accounts, [], [], { [`SELF_TRANSFER:${['in', 'out'].sort().join(':')}`]: 0.99 });
  assert.equal(blocked.every(card => card.transactionIds.includes('out')), true);
  assert.equal(moneySuggestions([rows[0], tx({ id: 'odd', amountMinor: 400, direction: 'credit', transactionType: 'income' })], accounts, [], []).some(card => card.kind === 'SELF_TRANSFER'), false);
});

test('keeps a model opinion from creating a transfer when the amounts differ', () => {
  const accounts = [own('hbl', 'HBL'), own('jazz', 'JazzCash')];
  const rows = [tx({ id: 'out', accountId: 'hbl' }), tx({ id: 'in', accountId: 'jazz', amountMinor: 900000, direction: 'credit', transactionType: 'income' })];
  assert.equal(passesGate('SELF_TRANSFER', rows, accounts), false);
  assert.equal(moneySuggestions(rows, accounts, [], [], { 'SELF_TRANSFER:in:out': 0.99 }).some(card => card.kind === 'SELF_TRANSFER'), false);
});

test('suggests a refund and a loan repayment from the records', () => {
  const purchase = tx({ id: 'buy', merchant: 'Daraz', amountMinor: 450000, occurredAt: base });
  const refund = tx({ id: 'back', merchant: 'Daraz', amountMinor: 450000, direction: 'credit', transactionType: 'income', category: 'Income', occurredAt: base + 5 * day });
  assert.equal(moneySuggestions([purchase, refund], [], [], []).some(card => card.kind === 'REFUND'), true);
  const lent = tx({ id: 'lent', merchant: 'Ali', rawBody: 'udhar', amountMinor: 800000, occurredAt: base });
  const repaid = tx({ id: 'back2', merchant: 'Ali', amountMinor: 800000, direction: 'credit', transactionType: 'income', category: 'Income', occurredAt: base + 21 * day });
  const loan = moneySuggestions([lent, repaid], [], [], []).find(card => card.kind === 'LOAN_REPAYMENT');
  assert.ok(loan);
  assert.deepEqual(loan.actions, ['connect', 'partial', 'reject']);
  assert.equal(moneySuggestions([lent, repaid], [], [], []).some(card => card.kind === 'REFUND'), false);
});

test('connects a transfer without letting the score rewrite the stored rows by itself', () => {
  const rows = [
    tx({ id: 'out', merchant: 'HBL', amountMinor: 3100000 }),
    tx({ id: 'shop', merchant: 'Store', amountMinor: 5100000, category: 'Groceries' }),
  ];
  const thread = {
    id: 'SELF_TRANSFER:out', kind: 'SELF_TRANSFER', transactionIds: ['out'], status: 'confirmed', partial: false,
    priorTypes: { out: 'expense' }, priorStatus: { out: 'manual' }, createdAt: base,
  };
  assert.equal(trueSpend(rows, []).trueSpendMinor, 8200000);
  const after = trueSpend(rows, [thread]);
  assert.equal(after.trueSpendMinor, 5100000);
  assert.equal(after.movedMinor, 3100000);
  assert.equal(rows[0].transactionType, 'expense');
  assert.equal(applyThread(rows, thread)[0].transactionType, 'internal_transfer');
});

test('treats an ATM withdrawal as cash and a repeated committee as set aside', () => {
  const atm = tx({ id: 'atm', merchant: 'HBL ATM', transactionType: 'cash_withdrawal', amountMinor: 2000000 });
  assert.equal(moneySuggestions([atm], [], [], []).some(card => card.kind === 'CASH_CONVERSION'), true);
  const contributions = [0, 1, 2].map(index => tx({
    id: `c${index}`, merchant: 'Office committee', rawBody: 'committee', amountMinor: 1000000, occurredAt: base + index * 30 * day,
  }));
  const payout = tx({ id: 'pay', merchant: 'Office committee', amountMinor: 12000000, direction: 'credit', transactionType: 'income', category: 'Income', occurredAt: base + 100 * day });
  const cards = moneySuggestions([...contributions, payout], [], [], []);
  assert.equal(cards.some(card => card.kind === 'COMMITTEE_CONTRIBUTION'), true);
  assert.equal(cards.some(card => card.kind === 'COMMITTEE_PAYOUT'), true);
});

test('flags a near duplicate and refuses a bad model file', () => {
  const left = tx({ id: 'a', merchant: 'Imtiaz', amountMinor: 295000, occurredAt: base, sourceHash: 'one' });
  const right = tx({ id: 'b', merchant: 'Imtiaz', amountMinor: 295000, occurredAt: base + 120000, sourceHash: 'two' });
  const card = moneySuggestions([left, right], [], [], []).find(item => item.kind === 'DUPLICATE');
  assert.ok(card);
  assert.equal(card.actions.includes('keep-one'), true);
  assert.equal(canActivateModel(false, 10, 'a'.repeat(64), 10, 'a'.repeat(64)), false);
  assert.equal(canActivateModel(true, 10, 'b'.repeat(64), 10, 'a'.repeat(64)), false);
  assert.equal(canActivateModel(true, 10, 'a'.repeat(64), 10, 'A'.repeat(64)), true);
  assert.equal(deviceTier(3000), 'rules');
  assert.equal(deviceTier(4000), 'lite');
  assert.equal(deviceTier(8000), 'roomy');
});

test('undo restores the earlier type and a rejected pair is not suggested again', () => {
  const rows = [tx({ id: 'out', merchant: 'HBL' }), tx({ id: 'in', merchant: 'JazzCash', direction: 'credit', transactionType: 'income', occurredAt: base + 60000 })];
  const thread = {
    id: 'SELF_TRANSFER:in:out', kind: 'SELF_TRANSFER', transactionIds: ['out', 'in'], status: 'confirmed', partial: false,
    priorTypes: { out: 'expense', in: 'income' }, priorStatus: { out: 'manual', in: 'manual' }, createdAt: base,
  };
  const changed = applyThread(rows, thread);
  assert.equal(changed[0].transactionType, 'internal_transfer');
  assert.equal(undoThread(changed, thread)[0].transactionType, 'expense');
  assert.equal(moneySuggestions(rows, [], [{ ...thread, status: 'rejected' }], []).some(card => card.kind === 'SELF_TRANSFER'), false);
});

test('refuses an unfinished or oversized model file', () => {
  const digest = 'a'.repeat(64);
  assert.equal(activatePack(false, 500_000_000, digest, 500_000_000, digest), false);
  assert.equal(activatePack(true, OPENJEV.sourceBytes, OPENJEV.sourceSha256, OPENJEV.sourceBytes, OPENJEV.sourceSha256), false);
  assert.equal(activatePack(true, 500_000_000, 'b'.repeat(64), 500_000_000, digest), false);
  assert.equal(activatePack(true, 500_000_000, digest, 500_000_000, digest), true);
});

test('old backups load with an empty thread list', () => {
  const snapshot = migrateSnapshot({ schema: 1, transactions: [], budgets: [], senders: [], exportedAt: 1 });
  assert.deepEqual(snapshot.threads, []);
  assert.deepEqual(snapshot.threadPriors, []);
});

test('synthetic money-thread cases stay precise without a model', () => {
  const cases = JSON.parse(readFileSync(new URL('../../eval/money_threads/cases.json', import.meta.url), 'utf8'));
  const counts = {};
  for (const item of cases) {
    const accounts = (item.accounts ?? []).map(account => ({
      id: account.id, name: account.id, kind: 'bank', providerId: null, maskedId: null, isOwn: account.own, createdAt: base,
    }));
    const rows = item.rows.map(row => tx({
      id: row.id, merchant: row.merchant, accountId: row.accountId ?? null, amountMinor: row.amount * 100,
      direction: row.dir, transactionType: row.type ?? (row.dir === 'credit' ? 'income' : 'expense'),
      category: row.category ?? (row.dir === 'credit' ? 'Income' : 'Shopping'), occurredAt: base + row.at,
      rawBody: row.body ?? null, reference: row.reference ?? null, sourceHash: row.hash ?? null, rail: row.rail ?? null,
    }));
    const found = [...new Set(moneySuggestions(rows, accounts, [], []).map(card => card.kind))];
    for (const kind of item.expect) {
      counts[kind] = counts[kind] ?? { hit: 0, miss: 0, false: 0 };
      if (found.includes(kind)) counts[kind].hit += 1;
      else counts[kind].miss += 1;
    }
    for (const kind of found) {
      if (!item.expect.includes(kind)) {
        counts[kind] = counts[kind] ?? { hit: 0, miss: 0, false: 0 };
        counts[kind].false += 1;
      }
    }
    assert.deepEqual(found.sort(), [...item.expect].sort(), item.id);
  }
  for (const [kind, row] of Object.entries(counts)) {
    assert.equal(row.false, 0, kind);
    assert.equal(row.miss, 0, kind);
  }
});

test('asks for a closed hypothesis rather than an explanation', () => {
  const options = hypothesesFor('SELF_TRANSFER');
  assert.equal(options.length, 2);
  assert.match(options[0].text, /accounts they own/);
  assert.equal(options.some(item => /explain/i.test(item.text)), false);
  assert.ok(decisionScore(0.9, null, 0.5) > 0);
  assert.ok(decisionScore(0.9, 0.2, 0.5) < decisionScore(0.9, 0.95, 0.5));
});
