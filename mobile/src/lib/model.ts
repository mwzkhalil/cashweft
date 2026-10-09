export const SYSTEM_CATEGORIES = [
  'Groceries', 'Food and Restaurants', 'Transport', 'Fuel', 'Utilities',
  'Mobile and Internet', 'Education', 'Healthcare', 'Shopping', 'Rent', 'Housing',
  'Entertainment', 'Family', 'Charity and Zakat', 'Government Fees and Taxes',
  'Subscriptions', 'Cash Withdrawals', 'Transfers', 'Savings', 'Income', 'Other',
] as const;

export type SystemCategory = (typeof SYSTEM_CATEGORIES)[number];
export type Category = string;
export type Direction = 'debit' | 'credit';
export type TransactionStatus = 'auto' | 'review' | 'ignored' | 'manual';
export type CurrencyCode = 'PKR' | 'INR';
export type TransactionType =
  | 'expense' | 'income' | 'refund' | 'internal_transfer'
  | 'cash_withdrawal' | 'fee' | 'adjustment';
export type AccountKind = 'bank' | 'wallet' | 'cash';
export type LanguageCode = 'en' | 'ur';
export type GroupingStyle = 'international' | 'southAsian';
export type LegacyCurrencyChoice = 'none' | 'pending' | 'keep-inr' | 'mark-pkr';
export type LinkStatus = 'suggested' | 'confirmed' | 'rejected';
export type SupportLevel = 'implemented' | 'tested' | 'verified';

export const TRANSACTION_TYPES: TransactionType[] = [
  'expense', 'income', 'refund', 'internal_transfer', 'cash_withdrawal', 'fee', 'adjustment',
];

export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  'Food & dining': 'Food and Restaurants',
  Groceries: 'Groceries',
  Travel: 'Transport',
  Bills: 'Utilities',
  Shopping: 'Shopping',
  Health: 'Healthcare',
  Entertainment: 'Entertainment',
  Transfers: 'Transfers',
};

export interface Transaction {
  id: string;
  sourceHash: string | null;
  sender: string | null;
  rawBody: string | null;
  occurredAt: number;
  merchant: string;
  amountMinor: number;
  currency: CurrencyCode;
  direction: Direction;
  transactionType: TransactionType;
  category: string;
  status: TransactionStatus;
  accountLast4: string | null;
  reference: string | null;
  confidence: number;
  providerId: string | null;
  accountId: string | null;
  counterpartyAccountId: string | null;
  rail: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  category: string;
  amountMinor: number;
}

export interface SenderRule {
  address: string;
  label: string;
  enabled: boolean;
}

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  providerId: string | null;
  maskedId: string | null;
  isOwn: boolean;
  createdAt: number;
}

export interface TransferLink {
  id: string;
  debitId: string;
  creditId: string;
  status: Exclude<LinkStatus, 'suggested'>;
  reason: string;
  confidence: number;
  debitPriorType: TransactionType;
  creditPriorType: TransactionType;
  createdAt: number;
}

export interface MerchantCorrection {
  merchantKey: string;
  category: string;
  hits: number;
  updatedAt: number;
}

export interface CashAdjustment {
  id: string;
  amountMinor: number;
  note: string;
  occurredAt: number;
}

export interface Preferences {
  onboardingDone: boolean;
  readSms: boolean;
  autoAdd: boolean;
  lastScanAt: number;
  language: LanguageCode;
  grouping: GroupingStyle;
  cashBridge: boolean;
  retainRawSms: boolean;
  legacyCurrency: LegacyCurrencyChoice;
}

export const DEFAULT_SENDERS: SenderRule[] = [];

export const DEFAULT_PREFERENCES: Preferences = {
  onboardingDone: false,
  readSms: false,
  autoAdd: true,
  lastScanAt: 0,
  language: 'en',
  grouping: 'international',
  cashBridge: false,
  retainRawSms: false,
  legacyCurrency: 'none',
};

export const CASH_ACCOUNT_ID = 'cash-wallet';

export const THREAD_KINDS = [
  'SELF_TRANSFER', 'CASH_CONVERSION', 'REFUND', 'LOAN_OUT', 'LOAN_REPAYMENT',
  'COMMITTEE_CONTRIBUTION', 'COMMITTEE_PAYOUT', 'RECURRING_COMMITMENT', 'DUPLICATE',
] as const;

export type ThreadKind = (typeof THREAD_KINDS)[number];

export interface MoneyThread {
  id: string;
  kind: ThreadKind;
  transactionIds: string[];
  status: 'confirmed' | 'rejected';
  partial: boolean;
  priorTypes: Partial<Record<string, TransactionType>>;
  priorStatus: Partial<Record<string, TransactionStatus>>;
  createdAt: number;
}

export interface ThreadPrior {
  key: string;
  confirm: number;
  reject: number;
}
