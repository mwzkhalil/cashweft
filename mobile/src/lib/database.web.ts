import { CASH_ACCOUNT_ID, DEFAULT_PREFERENCES, DEFAULT_SENDERS, SYSTEM_CATEGORIES } from './model';
import type { Account, Budget, CashAdjustment, Category, MerchantCorrection, Preferences, SenderRule, Transaction, TransferLink } from './model';
import { migrateSnapshot } from './snapshot';
import type { Snapshot } from './snapshot';
import { BROWSER_LEDGER_KEY, LEGACY_BROWSER_LEDGER_KEY, chooseStoredValue } from './identity';

function empty(): Snapshot {
  return {
    schema: 2, transactions: [], budgets: [], senders: DEFAULT_SENDERS, preferences: DEFAULT_PREFERENCES,
    accounts: [], links: [], corrections: [], adjustments: [], categories: [], exportedAt: 0,
  };
}

function read(): Snapshot {
  const chosen = chooseStoredValue(localStorage.getItem(BROWSER_LEDGER_KEY), localStorage.getItem(LEGACY_BROWSER_LEDGER_KEY));
  if (!chosen.value) return empty();
  const parsed = JSON.parse(chosen.value) as { schema?: number };
  const snapshot = migrateSnapshot(parsed);
  if (chosen.copiedFromLegacy || parsed.schema !== 2) localStorage.setItem(BROWSER_LEDGER_KEY, JSON.stringify(snapshot));
  return snapshot;
}

function write(snapshot: Snapshot): void {
  localStorage.setItem(BROWSER_LEDGER_KEY, JSON.stringify({ ...snapshot, schema: 2 }));
}

export async function getDatabase(): Promise<void> { read(); }
export async function listTransactions(): Promise<Transaction[]> {
  return read().transactions.sort((a, b) => b.occurredAt - a.occurredAt || b.createdAt - a.createdAt);
}
export async function listTransactionsPage(limit: number, offset: number): Promise<Transaction[]> {
  return (await listTransactions()).slice(offset, offset + limit);
}
export async function addTransaction(transaction: Transaction): Promise<boolean> {
  const snapshot = read();
  if (snapshot.transactions.some(item => item.id === transaction.id || !!transaction.sourceHash && item.sourceHash === transaction.sourceHash)) return false;
  snapshot.transactions.push(transaction);
  write(snapshot);
  return true;
}
export async function addTransactions(items: Transaction[]): Promise<number> {
  let added = 0;
  for (const item of items) if (await addTransaction(item)) added += 1;
  return added;
}
export async function editTransaction(id: string, values: Pick<Transaction, 'merchant' | 'category' | 'status'> & Partial<Pick<Transaction, 'transactionType'>>): Promise<void> {
  const snapshot = read();
  const item = snapshot.transactions.find(transaction => transaction.id === id);
  if (!item) throw new Error('Entry not found.');
  item.merchant = values.merchant.trim();
  item.category = values.category;
  item.status = values.status;
  if (values.transactionType) item.transactionType = values.transactionType;
  item.updatedAt = Date.now();
  write(snapshot);
}
export async function setTransactionType(id: string, transactionType: Transaction['transactionType']): Promise<void> {
  const snapshot = read();
  const item = snapshot.transactions.find(transaction => transaction.id === id);
  if (!item) return;
  item.transactionType = transactionType;
  item.updatedAt = Date.now();
  write(snapshot);
}
export async function relabelCurrency(): Promise<number> {
  const snapshot = read();
  let changed = 0;
  for (const item of snapshot.transactions) if (item.currency === 'INR') { item.currency = 'PKR'; changed += 1; }
  write(snapshot);
  return changed;
}
export async function listBudgets(): Promise<Budget[]> { return read().budgets.sort((a, b) => a.category.localeCompare(b.category)); }
export async function saveBudget(category: Category, amountMinor: number): Promise<void> {
  const snapshot = read();
  snapshot.budgets = snapshot.budgets.filter(item => item.category !== category);
  snapshot.budgets.push({ category, amountMinor });
  write(snapshot);
}
export async function removeBudget(category: Category): Promise<void> {
  const snapshot = read();
  snapshot.budgets = snapshot.budgets.filter(item => item.category !== category);
  write(snapshot);
}
export async function listSenders(): Promise<SenderRule[]> { return read().senders.sort((a, b) => a.address.localeCompare(b.address)); }
export async function saveSender(sender: SenderRule): Promise<void> {
  const snapshot = read();
  snapshot.senders = snapshot.senders.filter(item => item.address !== sender.address);
  snapshot.senders.push({ ...sender, address: sender.address.toUpperCase().trim(), label: sender.label.trim() });
  write(snapshot);
}
export async function removeSender(address: string): Promise<void> {
  const snapshot = read();
  snapshot.senders = snapshot.senders.filter(item => item.address !== address);
  write(snapshot);
}
export async function loadPreferences(): Promise<Preferences> { return { ...DEFAULT_PREFERENCES, ...read().preferences }; }
export async function savePreference<K extends keyof Preferences>(key: K, value: Preferences[K]): Promise<void> {
  const snapshot = read();
  snapshot.preferences[key] = value;
  write(snapshot);
}
export async function listAccounts(): Promise<Account[]> { return read().accounts; }
export async function saveAccount(account: Account): Promise<void> {
  const snapshot = read();
  snapshot.accounts = snapshot.accounts.filter(item => item.id !== account.id);
  snapshot.accounts.push({ ...account, name: account.name.trim() });
  write(snapshot);
}
export async function removeAccount(id: string): Promise<void> {
  if (id === CASH_ACCOUNT_ID) return;
  const snapshot = read();
  snapshot.accounts = snapshot.accounts.filter(item => item.id !== id);
  write(snapshot);
}
export async function listLinks(): Promise<TransferLink[]> { return read().links; }
export async function saveLink(link: TransferLink): Promise<void> {
  const snapshot = read();
  snapshot.links = snapshot.links.filter(item => item.id !== link.id);
  snapshot.links.push(link);
  write(snapshot);
}
export async function removeLink(id: string): Promise<void> {
  const snapshot = read();
  snapshot.links = snapshot.links.filter(item => item.id !== id);
  write(snapshot);
}
export async function listCorrections(): Promise<MerchantCorrection[]> { return read().corrections; }
export async function saveCorrection(correction: MerchantCorrection): Promise<void> {
  const snapshot = read();
  snapshot.corrections = snapshot.corrections.filter(item => item.merchantKey !== correction.merchantKey);
  snapshot.corrections.push(correction);
  write(snapshot);
}
export async function listAdjustments(): Promise<CashAdjustment[]> { return read().adjustments; }
export async function saveAdjustment(adjustment: CashAdjustment): Promise<void> {
  const snapshot = read();
  snapshot.adjustments.push(adjustment);
  write(snapshot);
}
export async function listCustomCategories(): Promise<string[]> { return read().categories; }
export async function saveCustomCategory(name: string): Promise<void> {
  const snapshot = read();
  if (!snapshot.categories.includes(name.trim())) snapshot.categories.push(name.trim());
  write(snapshot);
}
export async function categoryNames(): Promise<string[]> {
  const custom = await listCustomCategories();
  return [...SYSTEM_CATEGORIES, ...custom.filter(name => !SYSTEM_CATEGORIES.includes(name as typeof SYSTEM_CATEGORIES[number]))];
}
export async function exportSnapshot(): Promise<Snapshot> { return { ...read(), exportedAt: Date.now() }; }
export async function restoreSnapshot(input: unknown): Promise<void> {
  const snapshot = migrateSnapshot(input);
  write(snapshot);
}
export type { Snapshot };
export { migrateSnapshot };
