import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { randomUUID } from 'expo-crypto';
import {
  addTransaction, addTransactions, categoryNames, editTransaction, exportSnapshot, getDatabase, listAccounts,
  listAdjustments, listBudgets, listCorrections, listLinks, listSenders, listTransactions,
  loadPreferences, relabelCurrency, removeAccount, removeBudget, removeLink, removeSender, restoreSnapshot,
  saveAccount, saveAdjustment, saveBudget, saveCorrection, saveCustomCategory, saveLink, savePreference, saveSender, setTransactionType,
} from '@/lib/database';
import type { Snapshot } from '@/lib/database';
import { CASH_ACCOUNT_ID, DEFAULT_PREFERENCES, SYSTEM_CATEGORIES } from '@/lib/model';
import type { Account, Budget, CashAdjustment, Category, Direction, MerchantCorrection, Preferences, SenderRule, Transaction, TransactionStatus, TransactionType, TransferLink } from '@/lib/model';
import { textToMinor } from '@/lib/money';
import { readBankSms, requestSmsPermission } from '@/lib/sms';
import { categoryFromMemory, merchantKey, rememberCorrection } from '@/finance/accounting/corrections';

interface LedgerContextValue {
  ready: boolean;
  busy: boolean;
  error: string | null;
  transactions: Transaction[];
  budgets: Budget[];
  senders: SenderRule[];
  preferences: Preferences;
  accounts: Account[];
  links: TransferLink[];
  corrections: MerchantCorrection[];
  adjustments: CashAdjustment[];
  categories: string[];
  refresh: () => Promise<void>;
  scan: (full?: boolean) => Promise<number>;
  enableSms: () => Promise<boolean>;
  addManual: (merchant: string, amountText: string, direction: Direction, category: Category, occurredAt?: number, transactionType?: TransactionType, accountId?: string | null) => Promise<void>;
  setTransaction: (id: string, merchant: string, category: Category, status: TransactionStatus, transactionType?: TransactionType) => Promise<void>;
  setBudget: (category: Category, amountMinor: number) => Promise<void>;
  removeBudget: (category: Category) => Promise<void>;
  setSender: (sender: SenderRule) => Promise<void>;
  removeSender: (address: string) => Promise<void>;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => Promise<void>;
  setAccount: (account: Account) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  confirmLink: (debitId: string, creditId: string, reason: string, confidence: number) => Promise<void>;
  rejectLink: (debitId: string, creditId: string, reason: string) => Promise<void>;
  unlink: (id: string) => Promise<void>;
  addAdjustment: (amountMinor: number, note: string) => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  markLegacyAsPkr: () => Promise<void>;
  keepLegacyInr: () => Promise<void>;
  restore: (snapshot: Snapshot) => Promise<void>;
  clearError: () => void;
}

const LedgerContext = createContext<LedgerContextValue | null>(null);

function scanStart(full: boolean, lastScanAt: number): number {
  return full || !lastScanAt ? Date.now() - 90 * 86400_000 : lastScanAt - 120_000;
}

export function LedgerProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [senders, setSenders] = useState<SenderRule[]>([]);
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [links, setLinks] = useState<TransferLink[]>([]);
  const [corrections, setCorrections] = useState<MerchantCorrection[]>([]);
  const [adjustments, setAdjustments] = useState<CashAdjustment[]>([]);
  const [categories, setCategories] = useState<string[]>([...SYSTEM_CATEGORIES]);
  const scanBusyRef = useRef(false);

  const refresh = useCallback(async () => {
    const [nextTransactions, nextBudgets, nextSenders, nextPreferences, nextAccounts, nextLinks, nextCorrections, nextAdjustments, nextCategories] = await Promise.all([
      listTransactions(), listBudgets(), listSenders(), loadPreferences(), listAccounts(), listLinks(), listCorrections(), listAdjustments(), categoryNames(),
    ]);
    setTransactions(nextTransactions);
    setBudgets(nextBudgets);
    setSenders(nextSenders);
    setPreferences(nextPreferences);
    setAccounts(nextAccounts);
    setLinks(nextLinks);
    setCorrections(nextCorrections);
    setAdjustments(nextAdjustments);
    setCategories(nextCategories);
  }, []);

  useEffect(() => {
    getDatabase().then(refresh).then(() => setReady(true)).catch(e => {
      setError(e instanceof Error ? e.message : 'Could not open the ledger.');
      setReady(true);
    });
  }, [refresh]);

  const scan = useCallback(async (full = false): Promise<number> => {
    if (Platform.OS !== 'android' || !preferences.readSms) return 0;
    if (scanBusyRef.current) return 0;
    scanBusyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const since = scanStart(full, preferences.lastScanAt);
      const candidates = await readBankSms(senders, since, preferences.autoAdd, preferences.retainRawSms);
      const prepared = candidates.map(item => ({ ...item, category: categoryFromMemory(item.merchant, item.category, corrections) }));
      const added = await addTransactions(prepared);
      await savePreference('lastScanAt', Date.now());
      await refresh();
      return added;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not read SMS.';
      setError(message);
      throw e;
    } finally { scanBusyRef.current = false; setBusy(false); }
  }, [preferences, senders, corrections, refresh]);

  const scanRef = useRef(scan);
  useEffect(() => { scanRef.current = scan; }, [scan]);
  useEffect(() => {
    if (!ready || !preferences.readSms || Platform.OS !== 'android') return;
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void scanRef.current().catch(() => {}); });
    void scanRef.current().catch(() => {});
    return () => subscription.remove();
  }, [ready, preferences.readSms]);

  const enableSms = useCallback(async () => {
    const granted = await requestSmsPermission();
    if (granted) { await savePreference('readSms', true); await refresh(); }
    return granted;
  }, [refresh]);

  const addManual = useCallback(async (merchant: string, amountText: string, direction: Direction, category: Category, occurredAt = Date.now(), transactionType?: TransactionType, accountId: string | null = null) => {
    const amountMinor = textToMinor(amountText);
    if (!merchant.trim() || amountMinor === null) throw new Error('Enter a merchant and an amount above zero.');
    const now = Date.now();
    const type = transactionType ?? (direction === 'credit' ? 'income' : 'expense');
    await addTransaction({
      id: randomUUID(), sourceHash: null, sender: null, rawBody: null, occurredAt, merchant: merchant.trim(),
      amountMinor, currency: 'PKR', direction, transactionType: type, category, status: 'manual',
      accountLast4: null, reference: null, confidence: 1, providerId: null, accountId, counterpartyAccountId: null,
      rail: accountId === CASH_ACCOUNT_ID ? 'cash' : null, createdAt: now, updatedAt: now,
    });
    await refresh();
  }, [refresh]);

  const setTransaction = useCallback(async (id: string, merchant: string, category: Category, status: TransactionStatus, transactionType?: TransactionType) => {
    if (!merchant.trim()) throw new Error('Merchant is required.');
    await editTransaction(id, { merchant, category, status, transactionType });
    const key = merchantKey(merchant);
    const match = key ? rememberCorrection(corrections, merchant, category, Date.now()).find(item => item.merchantKey === key) : undefined;
    if (match && transactions.find(item => item.id === id)?.category !== category) await saveCorrection(match);
    await refresh();
  }, [refresh, transactions, corrections]);

  const changeBudget = useCallback(async (category: Category, amountMinor: number) => {
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new Error('Enter a budget above zero.');
    await saveBudget(category, amountMinor);
    await refresh();
  }, [refresh]);

  const changePreference = useCallback(async <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    await savePreference(key, value);
    if (key === 'cashBridge' && value === true && !accounts.some(account => account.id === CASH_ACCOUNT_ID)) {
      await saveAccount({ id: CASH_ACCOUNT_ID, name: 'Cash', kind: 'cash', providerId: null, maskedId: null, isOwn: true, createdAt: Date.now() });
    }
    await refresh();
  }, [refresh, accounts]);

  const value = useMemo<LedgerContextValue>(() => ({
    ready, busy, error, transactions, budgets, senders, preferences, accounts, links, corrections, adjustments, categories,
    refresh, scan, enableSms, addManual, setTransaction, setBudget: changeBudget,
    removeBudget: async category => { await removeBudget(category); await refresh(); },
    setSender: async sender => { await saveSender(sender); await refresh(); },
    removeSender: async address => { await removeSender(address); await refresh(); },
    setPreference: changePreference,
    setAccount: async account => { await saveAccount(account); await refresh(); },
    removeAccount: async id => { await removeAccount(id); await refresh(); },
    confirmLink: async (debitId, creditId, reason, confidence) => {
      const debit = transactions.find(item => item.id === debitId);
      const credit = transactions.find(item => item.id === creditId);
      if (!debit || !credit) throw new Error('Those entries are no longer in the ledger.');
      await saveLink({ id: randomUUID(), debitId, creditId, status: 'confirmed', reason, confidence, debitPriorType: debit.transactionType, creditPriorType: credit.transactionType, createdAt: Date.now() });
      await setTransactionType(debitId, 'internal_transfer');
      await setTransactionType(creditId, 'internal_transfer');
      await refresh();
    },
    rejectLink: async (debitId, creditId, reason) => {
      const debit = transactions.find(item => item.id === debitId);
      const credit = transactions.find(item => item.id === creditId);
      if (!debit || !credit) return;
      await saveLink({ id: randomUUID(), debitId, creditId, status: 'rejected', reason, confidence: 0, debitPriorType: debit.transactionType, creditPriorType: credit.transactionType, createdAt: Date.now() });
      await refresh();
    },
    unlink: async id => {
      const link = links.find(item => item.id === id);
      if (!link) return;
      await setTransactionType(link.debitId, link.debitPriorType);
      await setTransactionType(link.creditId, link.creditPriorType);
      await removeLink(id);
      await refresh();
    },
    addAdjustment: async (amountMinor, note) => { await saveAdjustment({ id: randomUUID(), amountMinor, note, occurredAt: Date.now() }); await refresh(); },
    addCategory: async name => { await saveCustomCategory(name); await refresh(); },
    markLegacyAsPkr: async () => { await relabelCurrency('PKR'); await savePreference('legacyCurrency', 'mark-pkr'); await refresh(); },
    keepLegacyInr: async () => { await savePreference('legacyCurrency', 'keep-inr'); await refresh(); },
    restore: async snapshot => { await restoreSnapshot(snapshot); await refresh(); },
    clearError: () => setError(null),
  }), [ready, busy, error, transactions, budgets, senders, preferences, accounts, links, corrections, adjustments, categories, refresh, scan, enableSms, addManual, setTransaction, changeBudget, changePreference]);

  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}

export function useLedger(): LedgerContextValue {
  const value = useContext(LedgerContext);
  if (!value) throw new Error('LedgerProvider is missing');
  return value;
}

export { exportSnapshot };
