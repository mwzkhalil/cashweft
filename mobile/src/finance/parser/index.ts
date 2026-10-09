import type { CurrencyCode } from '../../lib/model';
import { chooseTransactionAmount, extractAmounts } from './amounts';
import { categoryFor } from './categories';
import { classifyMovement, rejectReason } from './classify';
import { scoreConfidence } from './confidence';
import { extractMerchant, titleCase } from './merchants';
import { normalizeMessage } from './normalize';
import { detectProvider } from './providers';
import { extractAccountLast4, extractRail, extractReference, extractTimestamp } from './references';

export interface ParsedSms {
  merchant: string;
  amountMinor: number;
  currency: CurrencyCode;
  direction: 'debit' | 'credit';
  transactionType: 'expense' | 'income' | 'refund' | 'internal_transfer' | 'cash_withdrawal' | 'fee' | 'adjustment';
  category: string;
  accountLast4: string | null;
  reference: string | null;
  confidence: number;
  providerId: string | null;
  rail: string | null;
  occurredAt: number | null;
}

function currencyIn(raw: string, body: string): CurrencyCode {
  if (/INR|₹/.test(raw)) return 'INR';
  if (/PKR|Rs|روپ/.test(raw)) return 'PKR';
  if (/\bINR\b|₹/.test(body)) return 'INR';
  return 'PKR';
}

export function parseBankSms(body: string): ParsedSms | null {
  const text = normalizeMessage(body);
  if (rejectReason(text)) return null;
  const movement = classifyMovement(text);
  if (!movement) return null;
  const hits = extractAmounts(text);
  const amount = chooseTransactionAmount(hits);
  if (!amount) return null;
  const chosen = hits.find(hit => hit.minor === amount.minor && hit.role === (amount.contextual ? 'transaction' : 'unknown')) ?? hits.find(hit => hit.minor === amount.minor);
  const merchant = extractMerchant(text);
  const accountLast4 = extractAccountLast4(text);
  const reference = extractReference(text);
  const provider = detectProvider(text);
  let category = categoryFor(merchant, text);
  if (movement.transactionType === 'cash_withdrawal') category = 'Cash Withdrawals';
  if (movement.transactionType === 'income' && category === 'Other') category = 'Income';
  if (movement.transactionType === 'refund' && category === 'Other') category = 'Transfers';
  return {
    merchant: merchant ? titleCase(merchant) : 'Unknown merchant',
    amountMinor: amount.minor,
    currency: currencyIn(chosen?.raw ?? '', text),
    direction: movement.direction,
    transactionType: movement.transactionType,
    category,
    accountLast4,
    reference,
    confidence: scoreConfidence(merchant, accountLast4, reference, amount.contextual),
    providerId: provider?.id ?? null,
    rail: extractRail(text),
    occurredAt: extractTimestamp(text),
  };
}

export { categoryFor };
