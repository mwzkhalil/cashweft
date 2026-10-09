import {
  DEFAULT_PREFERENCES, LEGACY_CATEGORY_MAP, TRANSACTION_TYPES,
} from './model';
import type {
  Account, Budget, CashAdjustment, CurrencyCode, Direction, MerchantCorrection,
  Preferences, SenderRule, Transaction, TransactionStatus, TransactionType, TransferLink,
} from './model';

export interface Snapshot {
  schema: 2;
  transactions: Transaction[];
  budgets: Budget[];
  senders: SenderRule[];
  preferences: Preferences;
  accounts: Account[];
  links: TransferLink[];
  corrections: MerchantCorrection[];
  adjustments: CashAdjustment[];
  categories: string[];
  exportedAt: number;
}

const DIRECTIONS = new Set<Direction>(['debit', 'credit']);
const STATUSES = new Set<TransactionStatus>(['auto', 'review', 'ignored', 'manual']);
const TYPES = new Set<TransactionType>(TRANSACTION_TYPES);

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} is not supported.`);
  return value as Record<string, unknown>;
}

function minorOf(row: Record<string, unknown>): number {
  const value = row.amountMinor ?? row.amountPaise ?? row.amount_minor ?? row.amount_paise;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) throw new Error('This backup format is not supported.');
  return value;
}

function currencyOf(row: Record<string, unknown>, legacy: boolean): CurrencyCode {
  if (row.currency === 'PKR' || row.currency === 'INR') return row.currency;
  if (legacy) return 'INR';
  throw new Error('This backup format is not supported.');
}

function categoryOf(value: unknown): string {
  const name = typeof value === 'string' && value.trim() ? value.trim() : 'Other';
  return LEGACY_CATEGORY_MAP[name] ?? name;
}

function typeOf(row: Record<string, unknown>, direction: Direction, legacy: boolean): TransactionType {
  if (typeof row.transactionType === 'string' && TYPES.has(row.transactionType as TransactionType)) return row.transactionType as TransactionType;
  if (legacy) return direction === 'credit' ? 'income' : 'expense';
  throw new Error('This backup format is not supported.');
}

export function migrateTransaction(value: unknown, legacy: boolean): Transaction {
  const row = asRecord(value, 'Transaction');
  const direction = row.direction;
  const status = row.status;
  if (typeof direction !== 'string' || !DIRECTIONS.has(direction as Direction)) throw new Error('This backup format is not supported.');
  if (typeof status !== 'string' || !STATUSES.has(status as TransactionStatus)) throw new Error('This backup format is not supported.');
  if (typeof row.id !== 'string' || typeof row.merchant !== 'string') throw new Error('This backup format is not supported.');
  const occurredAt = Number(row.occurredAt);
  const createdAt = Number(row.createdAt ?? occurredAt);
  const updatedAt = Number(row.updatedAt ?? createdAt);
  if (!Number.isFinite(occurredAt)) throw new Error('This backup format is not supported.');
  return {
    id: row.id,
    sourceHash: typeof row.sourceHash === 'string' ? row.sourceHash : null,
    sender: typeof row.sender === 'string' ? row.sender : null,
    rawBody: typeof row.rawBody === 'string' ? row.rawBody : null,
    occurredAt,
    merchant: row.merchant,
    amountMinor: minorOf(row),
    currency: currencyOf(row, legacy),
    direction: direction as Direction,
    transactionType: typeOf(row, direction as Direction, legacy),
    category: categoryOf(row.category),
    status: status as TransactionStatus,
    accountLast4: typeof row.accountLast4 === 'string' ? row.accountLast4 : null,
    reference: typeof row.reference === 'string' ? row.reference : null,
    confidence: typeof row.confidence === 'number' ? row.confidence : 1,
    providerId: typeof row.providerId === 'string' ? row.providerId : null,
    accountId: typeof row.accountId === 'string' ? row.accountId : null,
    counterpartyAccountId: typeof row.counterpartyAccountId === 'string' ? row.counterpartyAccountId : null,
    rail: typeof row.rail === 'string' ? row.rail : null,
    createdAt: Number.isFinite(createdAt) ? createdAt : occurredAt,
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : occurredAt,
  };
}

function migrateBudget(value: unknown): Budget {
  const row = asRecord(value, 'Budget');
  const amount = row.amountMinor ?? row.amountPaise;
  if (typeof row.category !== 'string' || typeof amount !== 'number' || !Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error('This backup format is not supported.');
  }
  return { category: categoryOf(row.category), amountMinor: amount };
}

function migratePreferences(value: unknown, legacy: boolean, hadTransactions: boolean): Preferences {
  const row = value && typeof value === 'object' ? value as Partial<Preferences> : {};
  const next = { ...DEFAULT_PREFERENCES, ...row, language: row.language === 'ur' ? 'ur' as const : 'en' as const };
  if (next.grouping !== 'southAsian') next.grouping = 'international';
  if (!['none', 'pending', 'keep-inr', 'mark-pkr'].includes(next.legacyCurrency)) next.legacyCurrency = 'none';
  if (legacy && hadTransactions && next.legacyCurrency === 'none') next.legacyCurrency = 'pending';
  return next;
}

export function migrateSnapshot(input: unknown): Snapshot {
  const raw = asRecord(input, 'Backup');
  if (raw.schema !== 1 && raw.schema !== 2) throw new Error('This backup format is not supported.');
  if (!Array.isArray(raw.transactions) || !Array.isArray(raw.budgets) || !Array.isArray(raw.senders)) {
    throw new Error('This backup format is not supported.');
  }
  const legacy = raw.schema === 1;
  const transactions = raw.transactions.map(row => migrateTransaction(row, legacy));
  return {
    schema: 2,
    transactions,
    budgets: raw.budgets.map(migrateBudget),
    senders: raw.senders as SenderRule[],
    preferences: migratePreferences(raw.preferences, legacy, transactions.length > 0),
    accounts: Array.isArray(raw.accounts) ? raw.accounts as Account[] : [],
    links: Array.isArray(raw.links) ? raw.links as TransferLink[] : [],
    corrections: Array.isArray(raw.corrections) ? raw.corrections as MerchantCorrection[] : [],
    adjustments: Array.isArray(raw.adjustments) ? raw.adjustments as CashAdjustment[] : [],
    categories: Array.isArray(raw.categories) ? raw.categories.filter((item): item is string => typeof item === 'string') : [],
    exportedAt: typeof raw.exportedAt === 'number' ? raw.exportedAt : Date.now(),
  };
}
