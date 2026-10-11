import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { catalogs, fill } from '../src/i18n/copy.ts';
import { CONTENT_MAX, isWide, resolveTheme, screenBottomPadding, tabBarHeight, TOUCH_MIN } from '../src/ui/layout.ts';
import { groupByDay } from '../src/lib/format.ts';
import { pathLabel, recentCategories, typeLabel, typesFor } from '../src/lib/labels.ts';
import { THREAD_KINDS, TRANSACTION_TYPES } from '../src/lib/model.ts';
import { migrateSnapshot } from '../src/lib/snapshot.ts';
import { matchesView, periodSummary } from '../src/finance/accounting/summary.ts';
import { classifyFinancialText, getModelInfo, isModelAvailable, suggestCategory } from '../src/finance/smartsort/index.ts';
import { parseBankSms } from '../src/lib/parser.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const tabs = path.join('src', 'app', '(tabs)');

function row(id, overrides = {}) {
  return {
    id, sourceHash: null, sender: null, rawBody: null, occurredAt: new Date(2026, 9, 10, 12).getTime(), merchant: id, amountMinor: 100000,
    currency: 'PKR', direction: 'debit', transactionType: 'expense', category: 'Other', status: 'auto', accountLast4: null, reference: null,
    confidence: 0.9, providerId: null, accountId: null, counterpartyAccountId: null, rail: null, createdAt: 1, updatedAt: 1, ...overrides,
  };
}

test('the tab bar has four tabs, and Budgets lives inside Insights', () => {
  const layout = read(path.join(tabs, '_layout.tsx'));
  const names = [...layout.matchAll(/name: '(\w+)', key:/g)].map(match => match[1]);
  assert.deepEqual(names, ['home', 'inbox', 'insights', 'you']);
  assert.equal(fs.existsSync(path.join(root, tabs, 'budgets.tsx')), false);
  assert.match(read(path.join(tabs, 'insights.tsx')), /<BudgetsPanel \/>/);
});

test('the tab bar sits above the system navigation inset', () => {
  assert.equal(tabBarHeight(0), 72);
  assert.equal(tabBarHeight(48), 112);
  assert.ok(tabBarHeight(24) - 24 >= TOUCH_MIN);
  const layout = read(path.join(tabs, '_layout.tsx'));
  assert.match(layout, /useSafeAreaInsets\(\)/);
  assert.match(layout, /tabBarHeight\(insets\.bottom\)/);
  assert.match(layout, /tabBarBadge/);
});

test('every tab screen leaves room for the tab bar and pushed screens clear the gesture bar', () => {
  for (const file of ['home.tsx', 'inbox.tsx', 'insights.tsx', 'you.tsx']) assert.match(read(path.join(tabs, file)), /<Screen tab>/, file);
  assert.equal(screenBottomPadding(true, 48), 16);
  assert.equal(screenBottomPadding(false, 48), 72);
  const kit = read('src/ui/Kit.tsx');
  assert.match(kit, /useSafeAreaInsets\(\)/);
  assert.match(kit, /maxWidth: CONTENT_MAX/);
});

test('wide screens switch to a side rail and cap the content width', () => {
  assert.equal(isWide(430), false);
  assert.equal(isWide(600), true);
  assert.equal(CONTENT_MAX, 720);
  assert.match(read(path.join(tabs, '_layout.tsx')), /tabBarPosition: wide \? 'left' : 'bottom'/);
});

test('the profile tab uses a person icon, not the old K letterform', () => {
  const icon = read('src/ui/Icon.tsx');
  assert.equal(icon.includes('M5 3h4v9l5-6h5l-6 7 6 8h-5l-5-7v7H5V3Z'), false);
  assert.match(icon, /you: \(\{ color \}\) => <><Circle/);
  for (const file of ['src/ui/Icon.tsx', 'src/ui/CategoryIcon.tsx', path.join(tabs, '_layout.tsx')]) {
    assert.equal(/\p{Extended_Pictographic}/u.test(read(file)), false, file);
  }
});

test('English and Urdu catalogs have the same keys, placeholders, and no old brand', () => {
  const en = catalogs.en;
  const ur = catalogs.ur;
  assert.deepEqual(Object.keys(ur).sort(), Object.keys(en).sort());
  for (const key of Object.keys(en)) {
    assert.ok(en[key].trim() && ur[key].trim(), key);
    const holes = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
    assert.deepEqual(holes(ur[key]), holes(en[key]), key);
    assert.equal(/kharcha|کھرچہ/i.test(en[key] + ur[key]), false, key);
  }
  assert.equal(en.moneyPaths, 'Money Paths');
  assert.equal(fill(en.budgetOf, { percent: '62%', amount: 'Rs 78,000' }), '\u206862%\u2069 of \u2068Rs 78,000\u2069');
  assert.equal(fill(ur.budgetOf, { percent: '62%', amount: 'Rs 78,000' }).replace(/[\u2068\u2069]/g, ''), 'Rs 78,000 کا 62%');
});

test('Urdu switches the layout direction and mirrors directional icons', () => {
  assert.match(read('src/app/_layout.tsx'), /direction: rtl \? 'rtl' : 'ltr'/);
  assert.match(read('src/ui/Icon.tsx'), /directional = new Set<IconName>\(\['back', 'chevron'\]\)/);
  for (const file of ['home.tsx', 'inbox.tsx', 'insights.tsx', 'you.tsx']) {
    assert.equal(/margin(Left|Right)|padding(Left|Right)/.test(read(path.join(tabs, file))), false, file);
  }
});

test('theme choice falls back to the phone setting and survives a restore', () => {
  assert.equal(resolveTheme('system', 'light'), 'light');
  assert.equal(resolveTheme('system', null), 'dark');
  assert.equal(resolveTheme('light', 'dark'), 'light');
  const base = { schema: 2, transactions: [], budgets: [], senders: [], exportedAt: 1 };
  assert.equal(migrateSnapshot({ ...base, preferences: { theme: 'neon' } }).preferences.theme, 'system');
  assert.equal(migrateSnapshot({ ...base, preferences: { theme: 'light' } }).preferences.theme, 'light');
});

test('type and path names are written for people, not enums', () => {
  for (const type of TRANSACTION_TYPES) assert.equal(/_/.test(typeLabel(type)), false, type);
  for (const kind of THREAD_KINDS) assert.equal(/_/.test(pathLabel(kind)), false, kind);
  assert.deepEqual(typesFor('credit'), ['income', 'refund', 'adjustment']);
  assert.equal(typeLabel('cash_withdrawal'), 'ATM cash');
  assert.deepEqual(recentCategories([row('a', { category: 'Fuel', occurredAt: 3 }), row('b', { category: 'Groceries', occurredAt: 5 }), row('c', { category: 'Fuel', occurredAt: 4 })], 'debit'), ['Groceries', 'Fuel']);
});

test('Home spent is true spend, and a confirmed move counts as moved, not received', () => {
  const debit = row('out', { amountMinor: 1500000 });
  const credit = row('in', { direction: 'credit', transactionType: 'income', amountMinor: 1500000 });
  const groceries = row('food', { amountMinor: 400000, category: 'Groceries' });
  const salary = row('salary', { direction: 'credit', transactionType: 'income', amountMinor: 9000000 });
  const before = periodSummary([debit, credit, groceries, salary], []);
  assert.deepEqual(before, { spentMinor: 1900000, receivedMinor: 10500000, movedMinor: 0 });
  const thread = { id: 't', kind: 'SELF_TRANSFER', transactionIds: ['out', 'in'], status: 'confirmed', partial: false, priorTypes: {}, priorStatus: {}, createdAt: 1 };
  assert.deepEqual(periodSummary([debit, credit, groceries, salary], [thread]), { spentMinor: 400000, receivedMinor: 9000000, movedMinor: 1500000 });
  assert.deepEqual(periodSummary([debit, credit], [{ ...thread, status: 'rejected' }]).movedMinor, 0);
});

test('Activity filters keep moves and ignored rows out of spent and received', () => {
  const atm = row('atm', { transactionType: 'cash_withdrawal' });
  const ignored = row('ignored', { status: 'ignored' });
  const review = row('review', { status: 'review' });
  assert.equal(matchesView(atm, 'spent'), false);
  assert.equal(matchesView(atm, 'moved'), true);
  assert.equal(matchesView(ignored, 'spent'), false);
  assert.equal(matchesView(ignored, 'all'), true);
  assert.equal(matchesView(review, 'review'), true);
});

test('Activity groups rows under Today, Yesterday, and dates', () => {
  const now = new Date(2026, 9, 11, 15).getTime();
  const groups = groupByDay([row('a', { occurredAt: new Date(2026, 9, 11, 9).getTime() }), row('b', { occurredAt: new Date(2026, 9, 11, 8).getTime() }), row('c', { occurredAt: new Date(2026, 9, 10, 20).getTime() }), row('d', { occurredAt: new Date(2026, 9, 2, 20).getTime() })], now);
  assert.deepEqual(groups.map(group => group.label.kind), ['today', 'yesterday', 'date']);
  assert.equal(groups[0].items.length, 2);
});

test('SmartSort ships no model and always answers from the rules', () => {
  assert.equal(isModelAvailable(), false);
  assert.equal(getModelInfo().available, false);
  assert.equal(getModelInfo().bytes, 0);
  assert.equal(suggestCategory('Imtiaz Super Market').category, 'Groceries');
  assert.equal(suggestCategory('Bilal Traders').suggested, false);
  assert.equal(suggestCategory('Bilal Traders').source, 'rules');
});

test('OTP and verification messages are never treated as transactions', () => {
  for (const text of ['Your OTP is 482991 for a Rs 900 transaction. Do not share.', 'Use verification code 7781 to approve PKR 2,500 at Daraz', 'Never share this code: 5512. Rs 1,000 transfer']) {
    assert.deepEqual(classifyFinancialText(text), { label: 'not_transaction', reason: 'otp', source: 'rules' });
    assert.equal(parseBankSms(text), null);
  }
});

test('upcoming and in-progress payments are not recorded as settled', () => {
  assert.equal(parseBankSms('Reminder: PKR 3,000 will be debited for K-Electric on 15-10-2026.'), null);
  assert.equal(parseBankSms('Auto-debit of Rs 1,200 for Netflix scheduled on 20-10-2026. Keep sufficient balance.'), null);
  assert.equal(parseBankSms('Raast transfer Rs 5,000 to Ali Khan under process. Ref 123456'), null);
  assert.equal(parseBankSms('Your SSGC bill of Rs 2,100 is due on 18-10-2026.'), null);
  const paid = parseBankSms('Rs 2,100 has been paid to SSGC from A/c **1234. Next bill is due on 18-11-2026.');
  assert.equal(paid?.amountMinor, 210000);
  assert.equal(paid?.direction, 'debit');
});

test('card POS alerts are read as spending and keep the processing fee pattern', () => {
  const pos = parseBankSms('POS txn PKR 1,850.00 at Imtiaz Super Market card **4421 on 10-10-2026');
  assert.equal(pos?.direction, 'debit');
  assert.equal(pos?.category, 'Groceries');
  const fee = parseBankSms('Rs 150 processing fee deducted from A/c **1234');
  assert.equal(fee?.transactionType, 'fee');
});

test('a trailing balance is not mistaken for a second payment amount', () => {
  const wallet = parseBankSms('SadaPay: Rs.38,700 paid at KFC. Txn ID T65329961. Balance Rs 782,408');
  assert.equal(wallet?.amountMinor, 3870000);
  assert.equal(wallet?.category, 'Food and Restaurants');
  assert.equal(parseBankSms('Rs 500 paid to Ali. Rs 700 paid to Sara.'), null);
});

test('rail words name a transfer only when no merchant was found', () => {
  assert.equal(suggestCategory('', 'Raast transfer of Rs 500 sent').category, 'Transfers');
  assert.equal(suggestCategory('Bilal Traders', 'Raast QR payment Rs 500 to Bilal Traders').category, 'Other');
  assert.equal(suggestCategory('Book Mart').category, 'Shopping');
});
