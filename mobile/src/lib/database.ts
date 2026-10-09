import * as SQLite from 'expo-sqlite';
import { CASH_ACCOUNT_ID, DEFAULT_PREFERENCES, DEFAULT_SENDERS, LEGACY_CATEGORY_MAP, SYSTEM_CATEGORIES } from './model';
import type { Account, Budget, CashAdjustment, Category, MerchantCorrection, MoneyThread, Preferences, SenderRule, ThreadPrior, Transaction, TransferLink } from './model';
import { migratePriors, migrateSnapshot, migrateThreads } from './snapshot';
import type { Snapshot } from './snapshot';
import { DATABASE_FILE, LEGACY_DATABASE_FILE, shouldCopyLegacyDatabase } from './identity';

let database: Promise<SQLite.SQLiteDatabase> | undefined;

type TransactionRow = {
  id: string;
  source_hash: string | null;
  sender: string | null;
  raw_body: string | null;
  occurred_at: number;
  merchant: string;
  amount_paise: number;
  amount_minor: number | null;
  currency: Transaction['currency'] | null;
  direction: Transaction['direction'];
  transaction_type: Transaction['transactionType'] | null;
  category: string;
  status: Transaction['status'];
  account_last4: string | null;
  reference: string | null;
  confidence: number;
  provider_id: string | null;
  account_id: string | null;
  counterparty_account_id: string | null;
  rail: string | null;
  created_at: number;
  updated_at: number;
};

const CREATE_NEW = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  source_hash TEXT UNIQUE,
  sender TEXT,
  raw_body TEXT,
  occurred_at INTEGER NOT NULL,
  merchant TEXT NOT NULL,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL DEFAULT 'PKR',
  direction TEXT NOT NULL CHECK (direction IN ('debit','credit')),
  transaction_type TEXT NOT NULL DEFAULT 'expense',
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('auto','review','ignored','manual')),
  account_last4 TEXT,
  reference TEXT,
  confidence REAL NOT NULL,
  provider_id TEXT,
  account_id TEXT,
  counterparty_account_id TEXT,
  rail TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS budgets (
  category TEXT PRIMARY KEY,
  amount_paise INTEGER NOT NULL CHECK (amount_paise > 0),
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0)
);
CREATE TABLE IF NOT EXISTS senders (
  address TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  provider_id TEXT,
  masked_id TEXT,
  is_own INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS transfer_links (
  id TEXT PRIMARY KEY,
  debit_id TEXT NOT NULL,
  credit_id TEXT NOT NULL,
  status TEXT NOT NULL,
  reason TEXT NOT NULL,
  confidence REAL NOT NULL,
  debit_prior_type TEXT NOT NULL,
  credit_prior_type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS merchant_corrections (
  merchant_key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  hits INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cash_adjustments (
  id TEXT PRIMARY KEY,
  amount_minor INTEGER NOT NULL,
  note TEXT NOT NULL,
  occurred_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS custom_categories (name TEXT PRIMARY KEY);
CREATE INDEX IF NOT EXISTS transactions_by_date ON transactions (occurred_at DESC);
CREATE INDEX IF NOT EXISTS transactions_by_status ON transactions (status, occurred_at DESC);
CREATE INDEX IF NOT EXISTS transactions_by_category ON transactions (category, occurred_at DESC);
CREATE INDEX IF NOT EXISTS transactions_by_type ON transactions (transaction_type, occurred_at DESC);
`;

function fromRow(row: TransactionRow): Transaction {
  return {
    id: row.id, sourceHash: row.source_hash, sender: row.sender, rawBody: row.raw_body,
    occurredAt: row.occurred_at, merchant: row.merchant, amountMinor: row.amount_minor ?? row.amount_paise,
    currency: row.currency === 'INR' ? 'INR' : 'PKR', direction: row.direction,
    transactionType: row.transaction_type ?? (row.direction === 'credit' ? 'income' : 'expense'),
    category: row.category, status: row.status, accountLast4: row.account_last4, reference: row.reference,
    confidence: row.confidence, providerId: row.provider_id, accountId: row.account_id,
    counterpartyAccountId: row.counterparty_account_id, rail: row.rail,
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

async function columnNames(db: SQLite.SQLiteDatabase, table: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.map(row => row.name);
}

async function addColumn(db: SQLite.SQLiteDatabase, table: string, name: string, definition: string): Promise<void> {
  const names = await columnNames(db, table);
  if (!names.includes(name)) await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
}

const SIDE_TABLES = `
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS senders (
  address TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS preferences (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  provider_id TEXT,
  masked_id TEXT,
  is_own INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS transfer_links (
  id TEXT PRIMARY KEY,
  debit_id TEXT NOT NULL,
  credit_id TEXT NOT NULL,
  status TEXT NOT NULL,
  reason TEXT NOT NULL,
  confidence REAL NOT NULL,
  debit_prior_type TEXT NOT NULL,
  credit_prior_type TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS merchant_corrections (
  merchant_key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  hits INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS cash_adjustments (
  id TEXT PRIMARY KEY,
  amount_minor INTEGER NOT NULL,
  note TEXT NOT NULL,
  occurred_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS custom_categories (name TEXT PRIMARY KEY);
CREATE INDEX IF NOT EXISTS transactions_by_date ON transactions (occurred_at DESC);
CREATE INDEX IF NOT EXISTS transactions_by_status ON transactions (status, occurred_at DESC);
`;

async function migrateLegacy(db: SQLite.SQLiteDatabase): Promise<void> {
  const version = (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? 0;
  const tables = await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'");
  if (!tables.length) {
    await db.execAsync(CREATE_NEW);
    await db.execAsync('PRAGMA user_version = 2');
    return;
  }
  await db.execAsync(SIDE_TABLES);
  await addColumn(db, 'transactions', 'amount_minor', 'INTEGER');
  await addColumn(db, 'transactions', 'currency', "TEXT NOT NULL DEFAULT 'PKR'");
  await addColumn(db, 'transactions', 'transaction_type', "TEXT NOT NULL DEFAULT 'expense'");
  await addColumn(db, 'transactions', 'provider_id', 'TEXT');
  await addColumn(db, 'transactions', 'account_id', 'TEXT');
  await addColumn(db, 'transactions', 'counterparty_account_id', 'TEXT');
  await addColumn(db, 'transactions', 'rail', 'TEXT');
  await addColumn(db, 'budgets', 'amount_minor', 'INTEGER');
  await db.execAsync('UPDATE transactions SET amount_minor = amount_paise WHERE amount_minor IS NULL');
  await db.execAsync('UPDATE budgets SET amount_minor = amount_paise WHERE amount_minor IS NULL');
  if (version < 2) {
    await db.execAsync("UPDATE transactions SET currency = 'INR'");
    await db.execAsync("UPDATE transactions SET transaction_type = 'income' WHERE direction = 'credit' AND transaction_type = 'expense'");
    for (const [from, to] of Object.entries(LEGACY_CATEGORY_MAP)) {
      if (from === to) continue;
      await db.runAsync('UPDATE transactions SET category=? WHERE category=?', to, from);
      await db.runAsync('UPDATE budgets SET category=? WHERE category=?', to, from);
    }
    const count = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM transactions');
    if ((count?.n ?? 0) > 0) {
      await db.runAsync('INSERT INTO preferences (key,value) VALUES (?,?) ON CONFLICT(key) DO NOTHING', 'legacyCurrency', JSON.stringify('pending'));
    }
    await db.execAsync('PRAGMA user_version = 2');
  }
  await db.execAsync('CREATE INDEX IF NOT EXISTS transactions_by_category ON transactions (category, occurred_at DESC)');
  await db.execAsync('CREATE INDEX IF NOT EXISTS transactions_by_type ON transactions (transaction_type, occurred_at DESC)');
}

async function seed(db: SQLite.SQLiteDatabase): Promise<void> {
  const seeded = await db.getFirstAsync<{ value: string }>('SELECT value FROM metadata WHERE key=?', 'default_senders');
  if (seeded) return;
  const existingUser = await db.getFirstAsync('SELECT 1 FROM preferences WHERE key=?', 'onboardingDone');
  if (!existingUser) for (const sender of DEFAULT_SENDERS) {
    await db.runAsync('INSERT OR IGNORE INTO senders (address,label,enabled) VALUES (?,?,?)', sender.address, sender.label, Number(sender.enabled));
  }
  await db.runAsync('INSERT INTO metadata (key,value) VALUES (?,?)', 'default_senders', '1');
}

async function hasLedger(db: SQLite.SQLiteDatabase): Promise<boolean> {
  const row = await db.getFirstAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'");
  return Boolean(row);
}

async function openLedgerDatabase(): Promise<SQLite.SQLiteDatabase> {
  const current = await SQLite.openDatabaseAsync(DATABASE_FILE);
  if (await hasLedger(current)) return current;
  const legacy = await SQLite.openDatabaseAsync(LEGACY_DATABASE_FILE);
  const legacyHasLedger = await hasLedger(legacy);
  if (shouldCopyLegacyDatabase(false, legacyHasLedger)) {
    await legacy.execAsync('PRAGMA wal_checkpoint(FULL)');
    await SQLite.backupDatabaseAsync({ sourceDatabase: legacy, destDatabase: current });
  }
  await legacy.closeAsync();
  if (!legacyHasLedger) await SQLite.deleteDatabaseAsync(LEGACY_DATABASE_FILE);
  return current;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!database) {
    database = (async () => {
      const db = await openLedgerDatabase();
      await migrateLegacy(db);
      await seed(db);
      return db;
    })().catch(error => { database = undefined; throw error; });
  }
  return database;
}

const INSERT_TX = `INSERT OR IGNORE INTO transactions
  (id,source_hash,sender,raw_body,occurred_at,merchant,amount_paise,amount_minor,currency,direction,transaction_type,category,status,account_last4,reference,confidence,provider_id,account_id,counterparty_account_id,rail,created_at,updated_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

function txParams(t: Transaction): (string | number | null)[] {
  return [t.id, t.sourceHash, t.sender, t.rawBody, t.occurredAt, t.merchant, t.amountMinor, t.amountMinor,
    t.currency, t.direction, t.transactionType, t.category, t.status, t.accountLast4, t.reference, t.confidence,
    t.providerId, t.accountId, t.counterpartyAccountId, t.rail, t.createdAt, t.updatedAt];
}

export async function listTransactions(): Promise<Transaction[]> {
  const rows = await (await getDatabase()).getAllAsync<TransactionRow>('SELECT * FROM transactions ORDER BY occurred_at DESC, created_at DESC');
  return rows.map(fromRow);
}

export async function listTransactionsPage(limit: number, offset: number): Promise<Transaction[]> {
  const rows = await (await getDatabase()).getAllAsync<TransactionRow>('SELECT * FROM transactions ORDER BY occurred_at DESC, created_at DESC LIMIT ? OFFSET ?', limit, offset);
  return rows.map(fromRow);
}

export async function addTransaction(t: Transaction): Promise<boolean> {
  const result = await (await getDatabase()).runAsync(INSERT_TX, ...txParams(t));
  return result.changes > 0;
}

export async function addTransactions(items: Transaction[]): Promise<number> {
  if (!items.length) return 0;
  const db = await getDatabase();
  let added = 0;
  await db.withExclusiveTransactionAsync(async tx => {
    for (const item of items) {
      const result = await tx.runAsync(INSERT_TX, ...txParams(item));
      if (result.changes > 0) added += 1;
    }
  });
  return added;
}

export async function editTransaction(id: string, values: Pick<Transaction, 'merchant' | 'category' | 'status'> & Partial<Pick<Transaction, 'transactionType'>>): Promise<void> {
  await (await getDatabase()).runAsync('UPDATE transactions SET merchant=?,category=?,status=?,transaction_type=COALESCE(?, transaction_type),updated_at=? WHERE id=?',
    values.merchant.trim(), values.category, values.status, values.transactionType ?? null, Date.now(), id);
}

export async function setTransactionType(id: string, transactionType: Transaction['transactionType']): Promise<void> {
  await (await getDatabase()).runAsync('UPDATE transactions SET transaction_type=?,updated_at=? WHERE id=?', transactionType, Date.now(), id);
}

export async function relabelCurrency(next: 'PKR'): Promise<number> {
  const result = await (await getDatabase()).runAsync("UPDATE transactions SET currency=? WHERE currency='INR'", next);
  return result.changes;
}

export async function listBudgets(): Promise<Budget[]> {
  return (await getDatabase()).getAllAsync<Budget>('SELECT category, COALESCE(amount_minor, amount_paise) AS amountMinor FROM budgets ORDER BY category');
}

export async function saveBudget(category: Category, amountMinor: number): Promise<void> {
  await (await getDatabase()).runAsync('INSERT INTO budgets (category,amount_paise,amount_minor) VALUES (?,?,?) ON CONFLICT(category) DO UPDATE SET amount_paise=excluded.amount_paise, amount_minor=excluded.amount_minor', category, amountMinor, amountMinor);
}

export async function removeBudget(category: Category): Promise<void> {
  await (await getDatabase()).runAsync('DELETE FROM budgets WHERE category=?', category);
}

export async function listSenders(): Promise<SenderRule[]> {
  const rows = await (await getDatabase()).getAllAsync<{ address: string; label: string; enabled: number }>('SELECT address,label,enabled FROM senders ORDER BY address');
  return rows.map(row => ({ ...row, enabled: !!row.enabled }));
}

export async function saveSender(sender: SenderRule): Promise<void> {
  await (await getDatabase()).runAsync('INSERT INTO senders (address,label,enabled) VALUES (?,?,?) ON CONFLICT(address) DO UPDATE SET label=excluded.label,enabled=excluded.enabled',
    sender.address.toUpperCase().trim(), sender.label.trim(), Number(sender.enabled));
}

export async function removeSender(address: string): Promise<void> {
  await (await getDatabase()).runAsync('DELETE FROM senders WHERE address=?', address);
}

export async function loadPreferences(): Promise<Preferences> {
  const rows = await (await getDatabase()).getAllAsync<{ key: string; value: string }>('SELECT key,value FROM preferences');
  const values = Object.fromEntries(rows.map(({ key, value }) => [key, JSON.parse(value)]));
  return { ...DEFAULT_PREFERENCES, ...values };
}

export async function savePreference<K extends keyof Preferences>(key: K, value: Preferences[K]): Promise<void> {
  await (await getDatabase()).runAsync('INSERT INTO preferences (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', key, JSON.stringify(value));
}

export async function listAccounts(): Promise<Account[]> {
  const rows = await (await getDatabase()).getAllAsync<{ id: string; name: string; kind: Account['kind']; provider_id: string | null; masked_id: string | null; is_own: number; created_at: number }>('SELECT * FROM accounts ORDER BY name');
  return rows.map(row => ({ id: row.id, name: row.name, kind: row.kind, providerId: row.provider_id, maskedId: row.masked_id, isOwn: !!row.is_own, createdAt: row.created_at }));
}

export async function saveAccount(account: Account): Promise<void> {
  await (await getDatabase()).runAsync('INSERT INTO accounts (id,name,kind,provider_id,masked_id,is_own,created_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,kind=excluded.kind,provider_id=excluded.provider_id,masked_id=excluded.masked_id,is_own=excluded.is_own',
    account.id, account.name.trim(), account.kind, account.providerId, account.maskedId, Number(account.isOwn), account.createdAt);
}

export async function removeAccount(id: string): Promise<void> {
  if (id === CASH_ACCOUNT_ID) return;
  await (await getDatabase()).runAsync('DELETE FROM accounts WHERE id=?', id);
}

export async function listLinks(): Promise<TransferLink[]> {
  const rows = await (await getDatabase()).getAllAsync<{ id: string; debit_id: string; credit_id: string; status: TransferLink['status']; reason: string; confidence: number; debit_prior_type: TransferLink['debitPriorType']; credit_prior_type: TransferLink['creditPriorType']; created_at: number }>('SELECT * FROM transfer_links');
  return rows.map(row => ({ id: row.id, debitId: row.debit_id, creditId: row.credit_id, status: row.status, reason: row.reason, confidence: row.confidence, debitPriorType: row.debit_prior_type, creditPriorType: row.credit_prior_type, createdAt: row.created_at }));
}

export async function saveLink(link: TransferLink): Promise<void> {
  await (await getDatabase()).runAsync('INSERT INTO transfer_links (id,debit_id,credit_id,status,reason,confidence,debit_prior_type,credit_prior_type,created_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status',
    link.id, link.debitId, link.creditId, link.status, link.reason, link.confidence, link.debitPriorType, link.creditPriorType, link.createdAt);
}

export async function removeLink(id: string): Promise<void> {
  await (await getDatabase()).runAsync('DELETE FROM transfer_links WHERE id=?', id);
}

export async function listCorrections(): Promise<MerchantCorrection[]> {
  return (await getDatabase()).getAllAsync<MerchantCorrection>('SELECT merchant_key AS merchantKey, category, hits, updated_at AS updatedAt FROM merchant_corrections');
}

export async function saveCorrection(correction: MerchantCorrection): Promise<void> {
  await (await getDatabase()).runAsync('INSERT INTO merchant_corrections (merchant_key,category,hits,updated_at) VALUES (?,?,?,?) ON CONFLICT(merchant_key) DO UPDATE SET category=excluded.category,hits=excluded.hits,updated_at=excluded.updated_at',
    correction.merchantKey, correction.category, correction.hits, correction.updatedAt);
}

export async function listAdjustments(): Promise<CashAdjustment[]> {
  return (await getDatabase()).getAllAsync<CashAdjustment>('SELECT id, amount_minor AS amountMinor, note, occurred_at AS occurredAt FROM cash_adjustments ORDER BY occurred_at DESC');
}

export async function saveAdjustment(adjustment: CashAdjustment): Promise<void> {
  await (await getDatabase()).runAsync('INSERT INTO cash_adjustments (id,amount_minor,note,occurred_at) VALUES (?,?,?,?)', adjustment.id, adjustment.amountMinor, adjustment.note, adjustment.occurredAt);
}

export async function listCustomCategories(): Promise<string[]> {
  const rows = await (await getDatabase()).getAllAsync<{ name: string }>('SELECT name FROM custom_categories ORDER BY name');
  return rows.map(row => row.name);
}

export async function saveCustomCategory(name: string): Promise<void> {
  await (await getDatabase()).runAsync('INSERT OR IGNORE INTO custom_categories (name) VALUES (?)', name.trim());
}

export async function categoryNames(): Promise<string[]> {
  const custom = await listCustomCategories();
  return [...SYSTEM_CATEGORIES, ...custom.filter(name => !SYSTEM_CATEGORIES.includes(name as typeof SYSTEM_CATEGORIES[number]))];
}

async function readMeta(key: string): Promise<string | null> {
  const row = await (await getDatabase()).getFirstAsync<{ value: string }>('SELECT value FROM metadata WHERE key=?', key);
  return row?.value ?? null;
}

async function writeMeta(key: string, value: string): Promise<void> {
  await (await getDatabase()).runAsync('INSERT INTO metadata (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', key, value);
}

export async function loadMoneyThreads(): Promise<MoneyThread[]> {
  const raw = await readMeta('moneyThreads');
  if (!raw) return [];
  try { return migrateThreads(JSON.parse(raw)); } catch { return []; }
}

export async function saveMoneyThreads(threads: MoneyThread[]): Promise<void> {
  await writeMeta('moneyThreads', JSON.stringify(threads));
}

export async function loadThreadPriors(): Promise<ThreadPrior[]> {
  const raw = await readMeta('threadPriors');
  if (!raw) return [];
  try { return migratePriors(JSON.parse(raw)); } catch { return []; }
}

export async function saveThreadPriors(priors: ThreadPrior[]): Promise<void> {
  await writeMeta('threadPriors', JSON.stringify(priors));
}

export async function exportSnapshot(): Promise<Snapshot> {
  const [transactions, budgets, senders, preferences, accounts, links, corrections, adjustments, categories, threads, threadPriors] = await Promise.all([
    listTransactions(), listBudgets(), listSenders(), loadPreferences(), listAccounts(), listLinks(), listCorrections(), listAdjustments(), listCustomCategories(), loadMoneyThreads(), loadThreadPriors(),
  ]);
  return { schema: 2, transactions, budgets, senders, preferences, accounts, links, corrections, adjustments, categories, threads, threadPriors, exportedAt: Date.now() };
}

export async function restoreSnapshot(input: unknown): Promise<void> {
  const snapshot = migrateSnapshot(input);
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async tx => {
    await tx.execAsync('DELETE FROM transactions; DELETE FROM budgets; DELETE FROM senders; DELETE FROM preferences; DELETE FROM accounts; DELETE FROM transfer_links; DELETE FROM merchant_corrections; DELETE FROM cash_adjustments; DELETE FROM custom_categories;');
    for (const t of snapshot.transactions) await tx.runAsync(INSERT_TX, ...txParams(t));
    for (const b of snapshot.budgets) await tx.runAsync('INSERT INTO budgets (category,amount_paise,amount_minor) VALUES (?,?,?)', b.category, b.amountMinor, b.amountMinor);
    for (const s of snapshot.senders) await tx.runAsync('INSERT INTO senders VALUES (?,?,?)', s.address, s.label, Number(s.enabled));
    for (const [key, value] of Object.entries(snapshot.preferences)) await tx.runAsync('INSERT INTO preferences VALUES (?,?)', key, JSON.stringify(value));
    for (const a of snapshot.accounts) await tx.runAsync('INSERT INTO accounts VALUES (?,?,?,?,?,?,?)', a.id, a.name, a.kind, a.providerId, a.maskedId, Number(a.isOwn), a.createdAt);
    for (const link of snapshot.links) await tx.runAsync('INSERT INTO transfer_links VALUES (?,?,?,?,?,?,?,?,?)', link.id, link.debitId, link.creditId, link.status, link.reason, link.confidence, link.debitPriorType, link.creditPriorType, link.createdAt);
    for (const c of snapshot.corrections) await tx.runAsync('INSERT INTO merchant_corrections VALUES (?,?,?,?)', c.merchantKey, c.category, c.hits, c.updatedAt);
    for (const adj of snapshot.adjustments) await tx.runAsync('INSERT INTO cash_adjustments VALUES (?,?,?,?)', adj.id, adj.amountMinor, adj.note, adj.occurredAt);
    for (const name of snapshot.categories) await tx.runAsync('INSERT INTO custom_categories VALUES (?)', name);
    await tx.runAsync('INSERT INTO metadata (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', 'moneyThreads', JSON.stringify(snapshot.threads));
    await tx.runAsync('INSERT INTO metadata (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', 'threadPriors', JSON.stringify(snapshot.threadPriors));
    const count = await tx.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM transactions');
    if ((count?.n ?? 0) !== snapshot.transactions.length) throw new Error('Restore did not keep every transaction.');
  });
}

export type { Snapshot };
export { migrateSnapshot };
