import assert from 'node:assert/strict';
import test from 'node:test';
import { answerQuestion, buildSpendQuery } from '../src/finance/assistant/ask.ts';

function entry(partial) {
  return {
    id: 't', sourceHash: null, sender: null, rawBody: null, occurredAt: Date.parse('2026-10-02T00:00:00'), merchant: 'Shop',
    amountMinor: 10000, currency: 'PKR', direction: 'debit', transactionType: 'expense', category: 'Groceries', status: 'manual',
    accountLast4: null, reference: null, confidence: 1, providerId: null, accountId: null, counterpartyAccountId: null, rail: null,
    createdAt: 0, updatedAt: 0, ...partial,
  };
}

const now = Date.parse('2026-10-07T12:00:00');

test('answers English, Urdu, and Roman Urdu spend questions from the ledger', () => {
  const rows = [entry({ amountMinor: 250000, category: 'Groceries' }), entry({ id: '2', amountMinor: 900000, merchant: 'JazzCash Shop', providerId: 'jazzcash', category: 'Shopping' })];
  assert.match(answerQuestion('How much did I spend this month?', rows, now).text, /Rs\. 11,500/);
  assert.match(answerQuestion('اس مہینے میرا کتنا خرچ ہوا؟', rows, now).text, /Rs\. 11,500/);
  assert.match(answerQuestion('is mahine mera kitna kharcha hua?', rows, now).text, /Rs\. 11,500/);
  assert.match(answerQuestion('How much did I spend on groceries this month?', rows, now).text, /Rs\. 2,500/);
});

test('refuses unsafe text and unsupported questions', () => {
  assert.equal(answerQuestion("'; DROP TABLE transactions; --", [], now).intent, 'rejected');
  assert.equal(answerQuestion('What stocks should I buy?', [entry({})], now).intent, 'unsupported');
  assert.equal(answerQuestion('spend in month 99', [entry({})], now).intent, 'invalid_date');
  assert.match(answerQuestion('How much did I spend?', [], now).text, /no ledger history/);
});

test('keeps user text in SQL parameters', () => {
  const hostile = "Groceries'; DROP TABLE transactions; --";
  const query = buildSpendQuery({ from: 1, to: 2, category: hostile });
  assert.equal(query.sql.includes(hostile), false);
  assert.equal(query.params.includes(hostile), true);
  assert.match(query.sql, /category = \?/);
});
