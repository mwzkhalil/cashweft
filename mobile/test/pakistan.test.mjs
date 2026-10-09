import assert from 'node:assert/strict';
import test from 'node:test';
import { parseBankSms } from '../src/lib/parser.ts';
import { PROVIDERS } from '../src/finance/parser/providers.ts';

test('reads PKR, Raast, and a wallet credit from synthetic text', () => {
  const debit = parseBankSms('Rs. 2,500 debited from your account.');
  assert.equal(debit?.amountMinor, 250000);
  assert.equal(debit?.currency, 'PKR');
  assert.equal(debit?.transactionType, 'expense');
  const raast = parseBankSms('PKR 4,850 transferred through Raast.');
  assert.equal(raast?.amountMinor, 485000);
  assert.equal(raast?.rail, 'raast');
  assert.equal(raast?.providerId, 'raast');
  const wallet = parseBankSms('You received Rs 12,000 in your JazzCash wallet.');
  assert.equal(wallet?.direction, 'credit');
  assert.equal(wallet?.providerId, 'jazzcash');
  assert.equal(wallet?.amountMinor, 1200000);
});

test('keeps the deduction and ignores the remaining balance', () => {
  const result = parseBankSms('Rs 850 deducted. Remaining balance Rs 5,400.');
  assert.equal(result?.amountMinor, 85000);
});

test('reads Urdu digits and a Roman Urdu debit', () => {
  const urdu = parseBankSms('آپ کے اکاؤنٹ سے ۲۵۰۰ روپے کٹوتی ہوئی');
  assert.equal(urdu?.amountMinor, 250000);
  assert.equal(urdu?.direction, 'debit');
  const roman = parseBankSms('Rs 1500 kata gaya for groceries');
  assert.equal(roman?.direction, 'debit');
  assert.equal(roman?.category, 'Groceries');
});

test('does not keep failed, pending, promo, or otp messages', () => {
  assert.equal(parseBankSms('PKR 3,000 transaction failed'), null);
  assert.equal(parseBankSms('Rs 900 is pending'), null);
  assert.equal(parseBankSms('OTP 123456 for your wallet. Do not share.'), null);
  assert.equal(parseBankSms('Cashback offer Rs 200. Shop now.'), null);
});

test('classifies a reversal as a refund and an ATM note as cash', () => {
  const refund = parseBankSms('Rs 500 has been reversed to your account.');
  assert.equal(refund?.transactionType, 'refund');
  assert.equal(refund?.direction, 'credit');
  const cash = parseBankSms('Cash withdrawal of Rs 10,000 at ATM.');
  assert.equal(cash?.transactionType, 'cash_withdrawal');
  assert.equal(cash?.category, 'Cash Withdrawals');
});

test('does not claim verified institution templates', () => {
  assert.equal(PROVIDERS.some(item => item.support === 'verified'), false);
  assert.equal(PROVIDERS.find(item => item.id === 'hbl')?.support, 'implemented');
  assert.equal(PROVIDERS.find(item => item.id === 'raast')?.support, 'tested');
});

test('parses a batch of synthetic messages quickly enough for a phone-sized inbox', () => {
  const sample = 'Rs. 2,500 debited from A/c XX1234 at Book Mart via Raast. Ref ABC12345.';
  const started = Date.now();
  for (let index = 0; index < 2000; index += 1) parseBankSms(`${sample} ${index}`);
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 3000, `parser batch took ${elapsed}ms`);
});
