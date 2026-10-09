import assert from 'node:assert/strict';
import test from 'node:test';
import { migrateSnapshot } from '../src/lib/snapshot.ts';
import { decodeRecoveryCode, displayRecoveryPrefix, formatRecoveryCode } from '../src/lib/recoveryCode.ts';
import { chooseStoredValue, shouldCopyLegacyDatabase, BROWSER_LEDGER_KEY, LEGACY_BROWSER_LEDGER_KEY, BACKUP_CREDENTIALS_KEY, DATABASE_FILE } from '../src/lib/identity.ts';
import { formatMoney, textToMinor } from '../src/lib/money.ts';

test('keeps a version 1 Kharcha ledger as INR', () => {
  const snapshot = migrateSnapshot({
    schema: 1,
    transactions: [{
      id: '1', sourceHash: null, sender: 'HDFCBK', rawBody: 'old', occurredAt: 10, merchant: 'Cafe', amountPaise: 248000,
      direction: 'debit', category: 'Food & dining', status: 'auto', accountLast4: '3381', reference: null, confidence: 0.9,
      createdAt: 10, updatedAt: 10,
    }],
    budgets: [{ category: 'Travel', amountPaise: 50000 }],
    senders: [{ address: 'HDFCBK', label: 'HDFC Bank', enabled: true }],
    preferences: { onboardingDone: true, readSms: true, autoAdd: true, lastScanAt: 3 },
    exportedAt: 10,
  });
  assert.equal(snapshot.schema, 2);
  assert.equal(snapshot.transactions[0].currency, 'INR');
  assert.equal(snapshot.transactions[0].amountMinor, 248000);
  assert.equal(snapshot.transactions[0].category, 'Food and Restaurants');
  assert.equal(snapshot.transactions[0].transactionType, 'expense');
  assert.equal(snapshot.budgets[0].category, 'Transport');
  assert.equal(snapshot.preferences.legacyCurrency, 'pending');
});

test('rejects a tampered snapshot before any restore write', () => {
  assert.throws(() => migrateSnapshot({ schema: 9, transactions: [], budgets: [], senders: [] }));
  assert.throws(() => migrateSnapshot({ schema: 2, transactions: [{ id: '1', merchant: 'A', amountMinor: -5, currency: 'PKR', direction: 'debit', status: 'manual', transactionType: 'expense', category: 'Other', occurredAt: 1 }], budgets: [], senders: [] }));
  assert.throws(() => migrateSnapshot({ schema: 2, transactions: [{ id: '1', merchant: 'A', amountMinor: 5, direction: 'debit', status: 'manual', transactionType: 'expense', category: 'Other', occurredAt: 1 }], budgets: [], senders: [] }));
});

test('accepts kharcha1 and cashweft1 recovery codes', () => {
  const token = 'a'.repeat(43);
  const key = 'b'.repeat(43);
  const id = '12345678-1234-4123-8123-123456789abc';
  const legacy = formatRecoveryCode('kharcha1', id, token, key);
  const next = formatRecoveryCode('cashweft1', id, token, key);
  assert.equal(decodeRecoveryCode(legacy).prefix, 'kharcha1');
  assert.equal(decodeRecoveryCode(next).prefix, 'cashweft1');
  assert.equal(decodeRecoveryCode(next).id, id);
  assert.equal(displayRecoveryPrefix(undefined), 'kharcha1');
  assert.equal(displayRecoveryPrefix('cashweft1'), 'cashweft1');
  assert.equal(next.startsWith('cashweft1.'), true);
  assert.throws(() => decodeRecoveryCode('nope'));
});

test('prefers the Cashweft storage key and falls back to the legacy key', () => {
  assert.deepEqual(chooseStoredValue('{"schema":2}', '{"schema":1}'), { value: '{"schema":2}', copiedFromLegacy: false });
  assert.deepEqual(chooseStoredValue(null, '{"schema":1}'), { value: '{"schema":1}', copiedFromLegacy: true });
  assert.deepEqual(chooseStoredValue('', '{"schema":1}'), { value: '{"schema":1}', copiedFromLegacy: true });
  assert.deepEqual(chooseStoredValue(null, null), { value: null, copiedFromLegacy: false });
  assert.equal(shouldCopyLegacyDatabase(false, true), true);
  assert.equal(shouldCopyLegacyDatabase(true, true), false);
  assert.equal(shouldCopyLegacyDatabase(false, false), false);
  assert.equal(DATABASE_FILE, 'cashweft.db');
  assert.equal(BROWSER_LEDGER_KEY, 'cashweft.browser-ledger.v1');
  assert.equal(LEGACY_BROWSER_LEDGER_KEY, 'kharcha.browser-ledger.v1');
  assert.equal(BACKUP_CREDENTIALS_KEY, 'cashweft.backup.credentials.v1');
});

test('formats PKR without floating point grouping surprises', () => {
  assert.equal(textToMinor('2480.50'), 248050);
  assert.equal(textToMinor('0'), null);
  assert.equal(formatMoney(125000, 'PKR'), 'Rs. 1,250');
  assert.equal(formatMoney(1245050, 'PKR'), 'Rs. 12,450.50');
  assert.equal(formatMoney(12500000, 'PKR', 'southAsian'), 'Rs. 1,25,000');
  assert.equal(formatMoney(125000, 'INR'), '₹1,250');
});
