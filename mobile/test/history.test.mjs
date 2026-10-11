import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBankSms } from '../src/lib/parser.ts';
import { textToMinor } from '../src/lib/money.ts';
import { historyBounds, parseDay } from '../src/finance/sms/ranges.ts';
import { pageMessages } from '../src/finance/sms/page.ts';
import { discoverFinancialSenders } from '../src/finance/sms/discover.ts';
import { redactPreview } from '../src/finance/sms/preview.ts';
import { importHistory } from '../src/finance/sms/importHistory.ts';
import { smsIdentity } from '../src/finance/sms/identity.ts';
import { incrementalSince } from '../src/lib/smsWindow.ts';

const day = 86_400_000;
const now = Date.parse('2026-10-11T12:00:00Z');

function row(id, sender, body, receivedAt) {
  return { id, sender, body, receivedAt };
}

test('history ranges stay inside the chosen window', () => {
  assert.equal(historyBounds('30d', now).since, now - 30 * day);
  assert.equal(historyBounds('90d', now).since, now - 90 * day);
  assert.equal(historyBounds('1y', now).since, now - 365 * day);
  assert.equal(historyBounds('all', now).since, 0);
  assert.equal(historyBounds('all', now).until, now);
  const from = parseDay('2022-01-01', false);
  const to = parseDay('2023-12-31', true);
  assert.equal(historyBounds('custom', now, { from, to }).since, from);
  assert.equal(historyBounds('custom', now, { from, to }).until, to);
  assert.equal(parseDay('2022-02-31', false), null);
});

test('pagination keeps identical timestamps and does not repeat a boundary', () => {
  const rows = [
    row(1, 'HBL', 'PKR 100 debited from account', now - 10),
    row(2, 'HBL', 'PKR 200 debited from account', now - 10),
    row(3, 'JazzCash', 'PKR 300 received via Raast', now - 5),
    row(4, 'HBL', 'PKR 400 debited from account', now - 20),
  ];
  const first = pageMessages(rows, { since: 0, until: now, limit: 2 });
  assert.deepEqual(first.messages.map(item => item.id), [3, 2]);
  const second = pageMessages(rows, { since: 0, until: now, beforeDate: first.next.date, beforeId: first.next.id, limit: 2 });
  assert.deepEqual(second.messages.map(item => item.id), [1, 4]);
  const third = pageMessages(rows, { since: 0, until: now, beforeDate: second.next.date, beforeId: second.next.id, limit: 2 });
  assert.equal(third.messages.length, 0);
  assert.equal(third.next, null);
  const onlyHbl = pageMessages(rows, { since: now - 15, until: now, limit: 10, senders: ['PK-HBL'] });
  assert.deepEqual(onlyHbl.messages.map(item => item.id), [2, 1]);
});

test('a new sender does not inherit another sender scan time', () => {
  assert.equal(incrementalSince(0), null);
  assert.equal(incrementalSince(now), now - 120_000);
});

test('discovery ignores otp, promo, failed, and personal messages', () => {
  const rows = [
    row(1, 'HBL Alerts', 'PKR 5,000 has been debited from your account', now - day),
    row(2, 'HBL Alerts', 'Your OTP is 482991. Do not share this security code.', now - day),
    row(3, 'SHOP', 'Rs 500 cashback offer. Shop now and win a prize.', now - day),
    row(4, 'HBL Alerts', 'Transaction declined. PKR 700 could not be processed.', now - day),
    row(5, 'Ali', 'See you at 5. Bring 1000 please.', now - day),
    row(6, 'JazzCash', 'You have received Rs 10,000 via Raast', now - 2 * day),
  ];
  const found = discoverFinancialSenders(rows, now - 90 * day, now);
  assert.deepEqual(found.map(item => item.sender), ['HBL Alerts', 'JazzCash']);
  assert.equal(found[0].count, 1);
  assert.equal(found[0].recognised, true);
  assert.equal(found[0].preview.includes('482991'), false);
  assert.equal(redactPreview('OTP 482991 for PKR 900').includes('482991'), false);
});

test('pakistani alert wording parses the transaction amount', () => {
  assert.equal(parseBankSms('PKR 5,000 has been debited from your account')?.amountMinor, 500000);
  assert.equal(parseBankSms('Rs. 2,500 withdrawn from ATM')?.transactionType, 'cash_withdrawal');
  assert.equal(parseBankSms('Rs. 2,500 withdrawn from ATM')?.rail, 'atm');
  assert.equal(parseBankSms('Your account has been credited with PKR 25,000')?.direction, 'credit');
  assert.equal(parseBankSms('PKR 3,200 paid at ABC STORE')?.amountMinor, 320000);
  assert.equal(parseBankSms('You have received Rs 10,000 via Raast')?.rail, 'raast');
  assert.equal(parseBankSms('PKR 8,000 transferred through IBFT')?.rail, 'ibft');
  assert.equal(parseBankSms('Transaction reversed. PKR 4,500 credited')?.transactionType, 'refund');
  assert.equal(parseBankSms('Your card ending 1234 was used for PKR 1,250')?.accountLast4, '1234');
  assert.equal(parseBankSms('POS purchase of PKR 900 at Store')?.rail, 'pos');
  assert.equal(parseBankSms('PKR 150 paid for mobile top-up')?.direction, 'debit');
  assert.equal(parseBankSms('Rupees 1,00,000 debited from your account')?.amountMinor, 10000000);
  assert.equal(textToMinor('1,00,000'), 10000000);
  assert.equal(parseBankSms('Rs.1,250/- debited from your account')?.amountMinor, 125000);
  assert.equal(parseBankSms('PKR 1,250.00 debited from your account')?.amountMinor, 125000);
  assert.equal(parseBankSms('Available balance PKR 80,000. PKR 2,000 debited from account')?.amountMinor, 200000);
  assert.equal(parseBankSms('PKR 2,000 debited from account. Available balance PKR 80,000')?.amountMinor, 200000);
  assert.equal(parseBankSms('PKR 2,000 and PKR 80,000 debited from your accounts'), null);
  assert.equal(parseBankSms('PKR 500 debited at the shop. Cashback offer applied.')?.amountMinor, 50000);
  assert.equal(parseBankSms('Transaction failed'), null);
  assert.equal(parseBankSms('Payment pending'), null);
  assert.equal(parseBankSms('Your security code is 123456. Never share it.'), null);
  assert.equal(parseBankSms('Rs 500 mila via Raast')?.direction, 'credit');
});

async function runImport(rows, options = {}) {
  const inserted = [];
  const calls = [];
  const hashes = new Set(options.hashes ?? []);
  let cancelled = false;
  const result = await importHistory({
    addresses: options.addresses ?? ['HBL'],
    since: options.since ?? 0,
    until: options.until ?? now,
    pageSize: options.pageSize ?? 2,
    senderIndex: options.senderIndex ?? 0,
    cursor: options.cursor ?? null,
    knownHashes: hashes,
    autoAdd: options.autoAdd ?? true,
    cancelled: () => cancelled || options.cancelAfter === 0,
    parse: parseBankSms,
    digest: async value => value,
    readPage: async request => pageMessages(rows, request),
    insertBatch: async batch => {
      calls.push(batch.length);
      inserted.push(...batch);
      return batch.length;
    },
    onPage: async state => {
      if (options.cancelAfter != null && state.scanned >= options.cancelAfter) cancelled = true;
      options.onPage?.(state);
    },
  });
  return { result, inserted, calls, hashes };
}

test('history import batches, dedupes, and can be resumed', async () => {
  const rows = [1, 2, 3, 4, 5].map(id => row(id, 'HBL', `PKR ${id},000 debited from your account`, now - id * day));
  rows.push(row(9, 'HBL', 'Your OTP is 111222. Do not share.', now - day));
  const first = await runImport(rows, { pageSize: 2, cancelAfter: 2 });
  assert.equal(first.result.cancelled, true);
  assert.equal(first.inserted.length > 0, true);
  assert.equal(first.calls.length >= 1, true);
  assert.equal(first.inserted.some(item => item.body.includes('111222')), false);
  const second = await runImport(rows, {
    pageSize: 2,
    senderIndex: first.result.senderIndex,
    cursor: first.result.cursor,
    hashes: first.hashes,
  });
  assert.equal(second.result.done, true);
  const identities = new Set([...first.inserted, ...second.inserted].map(item => item.sourceHash));
  assert.equal(identities.size, first.inserted.length + second.inserted.length);
  const full = await runImport(rows, { pageSize: 2 });
  const again = await runImport(rows, { pageSize: 2, hashes: full.hashes });
  assert.equal(again.inserted.length, 0);
  assert.equal(again.result.duplicates >= 5, true);
  assert.equal(smsIdentity('HBL', 5, 'body'), 'HBL\n5\nbody');
});

test('separate senders import on their own range', async () => {
  const rows = [
    row(1, 'HBL', 'PKR 100 debited from your account', now - 10 * day),
    row(2, 'JazzCash', 'Rs 200 received via Raast', now - 400 * day),
  ];
  const recent = await runImport(rows, { addresses: ['HBL', 'JazzCash'], since: now - 90 * day, pageSize: 10 });
  assert.deepEqual(recent.inserted.map(item => item.sender), ['HBL']);
  const older = await runImport(rows, { addresses: ['JazzCash'], since: 0, pageSize: 10 });
  assert.equal(older.inserted[0].sender, 'JazzCash');
});

test('synthetic history loads stay in batch inserts', async () => {
  const timings = [];
  for (const size of [1000, 5000, 10000]) {
    const rows = Array.from({ length: size }, (_, index) => row(index + 1, 'HBL', `PKR ${index + 1} debited from account ending 1234`, now - index * 1000));
    const started = Date.now();
    const heapBefore = process.memoryUsage().heapUsed;
    const run = await runImport(rows, { pageSize: 400, autoAdd: false });
    const heapAfter = process.memoryUsage().heapUsed;
    timings.push({ size, ms: Date.now() - started, heapDelta: heapAfter - heapBefore, batches: run.calls.length, added: run.inserted.length });
    assert.equal(run.result.done, true);
    assert.equal(run.inserted.length, size);
    assert.equal(run.calls.length, Math.ceil(size / 400));
    assert.equal(run.inserted.every(item => item.status === 'review' || item.parsed.confidence >= 0.9), true);
  }
  console.log(JSON.stringify({ nodeHistoryImport: timings }));
  assert.ok(timings.every(item => item.ms < 20000), JSON.stringify(timings));
});
