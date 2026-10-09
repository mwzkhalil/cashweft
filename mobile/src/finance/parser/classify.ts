import type { Direction, TransactionType } from '../../lib/model';

const OTP = /\b(otp|one[\s-]?time(?:\s+password)?|verification code|login code|do not share|is code ko|raaz|valid for \d+\s*min|کوڈ شیئر|او ٹی پی)\b/i;
const PROMO = /\b(cashback offer|discount|coupon|apply now|limited time|shop now|sale ends|pre[\s-]?approved|loan offer|ابھی اپلائی|رعایت)\b/i;
const FAILED = /\b(failed|declined|unsuccessful|could not be processed|not processed|pending|in process|زیر التوا|ناکام|مسترد)\b/i;
const REFUND = /\b(refund|reversal|reversed|reversed back|واپس|واپسی)\b/i;
const WITHDRAWAL = /\b(atm|cash withdrawal|withdrawn|cash withdrawn|نقد)\b/i;
const FEE = /\b(service charge|processing fee|sms charges?|annual fee|چارجز)\b/i;
const DEBIT = /\b(debit(?:ed)?|deduct(?:ed)?|spent|paid|payment of|purchase|sent|transfer(?:red)?|kata|kat gaya|kat gayi|kat gya|bhej dia|bhej diya|nikal gaya)\b|خرچ|کٹوت[\u06CC\u06D2\u064A]|بھیج|منتقل/i;
const CREDIT = /\b(credit(?:ed)?|received|deposited|salary|wasool|hasil|jama|aa gaya|a gaya|موصول|جمع|تنخواہ)\b/i;

export interface Movement {
  direction: Direction;
  transactionType: TransactionType;
}

export function rejectReason(body: string): string | null {
  if (!body || body.length > 4000) return 'empty_or_too_long';
  if (OTP.test(body)) return 'otp';
  if (PROMO.test(body)) return 'promo';
  if (FAILED.test(body) && !REFUND.test(body)) return 'not_settled';
  return null;
}

export function classifyMovement(body: string): Movement | null {
  const refund = REFUND.test(body);
  const withdrawal = WITHDRAWAL.test(body);
  const fee = FEE.test(body);
  const debit = DEBIT.test(body) || withdrawal || fee;
  const credit = CREDIT.test(body) || refund;
  if (debit && credit && !refund) return null;
  if (!debit && !credit) return null;
  if (refund) return { direction: 'credit', transactionType: 'refund' };
  if (withdrawal && debit) return { direction: 'debit', transactionType: 'cash_withdrawal' };
  if (fee && debit) return { direction: 'debit', transactionType: 'fee' };
  if (debit) return { direction: 'debit', transactionType: 'expense' };
  return { direction: 'credit', transactionType: 'income' };
}
