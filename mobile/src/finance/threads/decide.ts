import type { Account, MoneyThread, ThreadKind, ThreadPrior, Transaction, TransactionType } from '../../lib/model';
import { countsAsExpense, countsAsIncome, netSpend } from '../accounting/ledger';
import { findRecurring } from '../intelligence/recurring';
import { merchantKey } from '../accounting/corrections';
import { evidenceText, semanticMarkers } from './markers';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const SHOW_WITHOUT_MODEL = 0.82;
export const SHOW_WITH_MODEL = 0.78;

export interface ReviewCard {
  id: string;
  kind: ThreadKind;
  transactionIds: string[];
  title: string;
  detail: string;
  evidence: string[];
  impactMinor: number;
  score: number;
  jev: number | null;
  actions: ('connect' | 'reject' | 'partial' | 'keep-one')[];
}

export interface TrueSpend {
  leftMinor: number;
  movedMinor: number;
  trueSpendMinor: number;
}

export interface Hypothesis {
  kind: ThreadKind | 'UNRELATED';
  text: string;
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function decisionScore(rule: number, jev: number | null, prior: number): number {
  if (jev === null) return clamp(0.75 * rule + 0.25 * prior);
  return clamp(0.5 * rule + 0.35 * jev + 0.15 * prior);
}

export function priorKey(kind: ThreadKind, parts: string[]): string {
  return `${kind}:${parts.map(part => part.trim().toLowerCase()).filter(Boolean).sort().join('|')}`;
}

export function priorValue(priors: ThreadPrior[], key: string): number {
  const row = priors.find(item => item.key === key);
  if (!row || row.confirm + row.reject <= 0) return 0.5;
  return clamp(row.confirm / (row.confirm + row.reject));
}

function busyIds(threads: MoneyThread[]): Set<string> {
  return new Set(threads.filter(thread => thread.status === 'confirmed' || thread.status === 'rejected').flatMap(thread => thread.transactionIds));
}

function pairId(kind: ThreadKind, ids: string[]): string {
  return `${kind}:${[...ids].sort().join(':')}`;
}

function open(transactions: Transaction[], threads: MoneyThread[]): Transaction[] {
  const used = busyIds(threads);
  return transactions.filter(item => item.status !== 'ignored' && !used.has(item.id));
}

function hoursApart(left: Transaction, right: Transaction): number {
  return Math.abs(left.occurredAt - right.occurredAt) / HOUR;
}

function sameAmount(left: Transaction, right: Transaction): boolean {
  return left.currency === right.currency && left.amountMinor === right.amountMinor;
}

function own(accountId: string | null, accounts: Account[]): boolean {
  return Boolean(accountId && accounts.some(account => account.isOwn && account.id === accountId));
}

function nameOverlap(left: string, right: string): boolean {
  const words = new Set(left.toLowerCase().split(/\s+/).filter(word => word.length > 2));
  return right.toLowerCase().split(/\s+/).some(word => word.length > 2 && words.has(word));
}

export function hypothesesFor(kind: ThreadKind): Hypothesis[] {
  const shared = 'The two records are unrelated.';
  const specific: Record<ThreadKind, string> = {
    SELF_TRANSFER: 'The debit and the credit are the same person moving money between accounts they own.',
    CASH_CONVERSION: 'The withdrawal converted bank money into cash. It was not spent at a merchant.',
    REFUND: 'The later credit returns money from an earlier purchase at the same place.',
    LOAN_OUT: 'The debit is money lent to a person, not consumption.',
    LOAN_REPAYMENT: 'The later credit is repayment of money previously lent to that person.',
    COMMITTEE_CONTRIBUTION: 'The debit is a rotating savings committee contribution, not ordinary spending.',
    COMMITTEE_PAYOUT: 'The later credit is the committee payout of earlier contributions, not new income.',
    RECURRING_COMMITMENT: 'The repeated payments are one ongoing commitment.',
    DUPLICATE: 'The two payments are the same purchase stored twice.',
  };
  return [
    { kind, text: specific[kind] },
    { kind: 'UNRELATED', text: shared },
  ];
}

export function passesGate(kind: ThreadKind, rows: Transaction[], accounts: Account[]): boolean {
  if (kind === 'CASH_CONVERSION') return rows.length === 1 && rows[0].transactionType === 'cash_withdrawal';
  if (kind === 'RECURRING_COMMITMENT') return rows.length >= 3 && rows.every(row => countsAsExpense(row));
  if (kind === 'COMMITTEE_CONTRIBUTION') return rows.length >= 3 && rows.every(row => row.direction === 'debit' && row.amountMinor === rows[0].amountMinor);
  if (kind === 'LOAN_OUT') return rows.length === 1 && rows[0].direction === 'debit' && semanticMarkers(evidenceText([rows[0].merchant, rows[0].rawBody])).lending;
  if (kind === 'COMMITTEE_PAYOUT') {
    const ordered = [...rows].sort((a, b) => a.occurredAt - b.occurredAt);
    const credit = ordered[ordered.length - 1];
    const debits = ordered.filter(row => row.direction === 'debit');
    return Boolean(credit && credit.direction === 'credit' && debits.length >= 3 && credit.amountMinor >= debits[0].amountMinor * 6 && nameOverlap(debits[0].merchant, credit.merchant));
  }
  if (rows.length < 2) return false;
  const [first, second] = [...rows].sort((a, b) => a.occurredAt - b.occurredAt);
  if (kind === 'SELF_TRANSFER') {
    return first.direction === 'debit' && second.direction === 'credit' && sameAmount(first, second) && hoursApart(first, second) <= 48;
  }
  if (kind === 'REFUND') {
    return first.direction === 'debit' && second.direction === 'credit' && sameAmount(first, second)
      && nameOverlap(first.merchant, second.merchant) && second.occurredAt - first.occurredAt <= 30 * DAY;
  }
  if (kind === 'LOAN_REPAYMENT') {
    const marker = semanticMarkers(evidenceText([first.merchant, first.rawBody, second.merchant, second.rawBody]));
    return first.direction === 'debit' && second.direction === 'credit' && sameAmount(first, second)
      && nameOverlap(first.merchant, second.merchant) && (marker.lending || marker.returned)
      && second.occurredAt - first.occurredAt <= 120 * DAY;
  }
  if (kind === 'DUPLICATE') {
    const distinct = !(first.sourceHash && first.sourceHash === second.sourceHash);
    return sameAmount(first, second) && first.merchant.trim().toLowerCase() === second.merchant.trim().toLowerCase()
      && hoursApart(first, second) <= 10 / 60 && distinct;
  }
  return false;
}

function ruleScore(kind: ThreadKind, rows: Transaction[], accounts: Account[]): number {
  if (kind === 'CASH_CONVERSION') return 0.9;
  if (kind === 'COMMITTEE_CONTRIBUTION' || kind === 'RECURRING_COMMITMENT') return 0.84;
  const [first, second] = [...rows].sort((a, b) => a.occurredAt - b.occurredAt);
  if (kind === 'SELF_TRANSFER') {
    const owned = own(first.accountId, accounts) && own(second.accountId, accounts);
    const close = hoursApart(first, second) <= 1;
    const shared = Boolean(first.reference && first.reference === second.reference);
    return clamp(0.55 + (owned ? 0.2 : 0) + (close ? 0.12 : 0) + (shared ? 0.08 : 0));
  }
  if (kind === 'REFUND') return clamp(0.7 + (second.occurredAt - first.occurredAt <= 7 * DAY ? 0.16 : 0));
  if (kind === 'LOAN_REPAYMENT' || kind === 'LOAN_OUT') return 0.86;
  if (kind === 'COMMITTEE_PAYOUT') return 0.84;
  if (kind === 'DUPLICATE') return 0.88;
  return 0;
}

function card(kind: ThreadKind, rows: Transaction[], accounts: Account[], priors: ThreadPrior[], jev: number | null): ReviewCard | null {
  if (!passesGate(kind, rows, accounts)) return null;
  const rule = ruleScore(kind, rows, accounts);
  const key = priorKey(kind, rows.map(row => row.merchant));
  const score = decisionScore(rule, jev, priorValue(priors, key));
  if (!visible(rule, jev, score)) return null;
  const ordered = [...rows].sort((a, b) => a.occurredAt - b.occurredAt);
  const ids = ordered.map(row => row.id);
  return {
    id: pairId(kind, ids),
    kind,
    transactionIds: ids,
    title: titleFor(kind, ordered),
    detail: detailFor(kind, ordered),
    evidence: evidenceFor(kind, ordered, accounts),
    impactMinor: impactFor(kind, ordered),
    score,
    jev,
    actions: kind === 'LOAN_REPAYMENT' ? ['connect', 'partial', 'reject'] : kind === 'DUPLICATE' ? ['keep-one', 'reject'] : ['connect', 'reject'],
  };
}

function visible(rule: number, jev: number | null, score: number): boolean {
  if (jev === null) return rule >= SHOW_WITHOUT_MODEL;
  return score >= SHOW_WITH_MODEL && rule >= 0.7;
}

function titleFor(kind: ThreadKind, rows: Transaction[]): string {
  if (kind === 'SELF_TRANSFER') return `${rows[0].merchant} to ${rows[1].merchant}`;
  if (kind === 'LOAN_REPAYMENT' && rows[1]) return rows[1].merchant;
  return rows[0]?.merchant ?? '';
}

function detailFor(kind: ThreadKind, rows: Transaction[]): string {
  if (kind === 'SELF_TRANSFER') return 'Looks like your money moved, not money spent.';
  if (kind === 'CASH_CONVERSION') return 'This looks like cash in hand, not something you bought.';
  if (kind === 'REFUND') return 'Possible refund from your earlier purchase.';
  if (kind === 'LOAN_OUT') return 'This looks like money you lent, not something you spent.';
  if (kind === 'LOAN_REPAYMENT') return `Could this be money ${rows[1].merchant} returned?`;
  if (kind === 'COMMITTEE_CONTRIBUTION') return 'These look like committee contributions, not ordinary spending.';
  if (kind === 'COMMITTEE_PAYOUT') return 'This may be your committee payout.';
  if (kind === 'DUPLICATE') return 'These look unusually similar.';
  return 'This looks like one regular commitment.';
}

function evidenceFor(kind: ThreadKind, rows: Transaction[], accounts: Account[]): string[] {
  const lines: string[] = [];
  if (rows.length >= 2 && rows[0].amountMinor === rows[1].amountMinor) lines.push('Same amount');
  if (kind === 'SELF_TRANSFER') {
    const gap = Math.max(1, Math.round(hoursApart(rows[0], rows[1]) * 60));
    lines.push(gap < 120 ? `${gap} minutes apart` : `${Math.round(hoursApart(rows[0], rows[1]))} hours apart`);
    lines.push('Money left one account and arrived in another');
    if (own(rows[0].accountId, accounts) && own(rows[1].accountId, accounts)) lines.push('Both accounts are yours');
  }
  if (kind === 'CASH_CONVERSION') lines.push('Recorded as cash taken out of an account');
  if (kind === 'REFUND') lines.push('Same place, money came back later');
  if (kind === 'LOAN_REPAYMENT' || kind === 'LOAN_OUT') lines.push('The wording looks like lending');
  if (kind === 'COMMITTEE_CONTRIBUTION') lines.push(`${rows.length} similar contributions`);
  if (kind === 'COMMITTEE_PAYOUT') lines.push('A much larger amount came back from the same name');
  if (kind === 'DUPLICATE') lines.push('Same place and amount, a few minutes apart');
  if (kind === 'RECURRING_COMMITMENT') lines.push('Similar amount on a regular gap');
  return lines;
}

function impactFor(kind: ThreadKind, rows: Transaction[]): number {
  if (kind === 'DUPLICATE' || kind === 'RECURRING_COMMITMENT') return 0;
  if (kind === 'REFUND') return rows[1]?.amountMinor ?? 0;
  if (kind === 'LOAN_REPAYMENT' || kind === 'COMMITTEE_PAYOUT') return rows[rows.length - 1]?.amountMinor ?? 0;
  return rows.filter(row => row.direction === 'debit').reduce((sum, row) => sum + row.amountMinor, 0);
}

export function moneySuggestions(transactions: Transaction[], accounts: Account[], threads: MoneyThread[], priors: ThreadPrior[], jev: Record<string, number | null> = {}): ReviewCard[] {
  const rows = open(transactions, threads);
  const cards: ReviewCard[] = [];
  const push = (kind: ThreadKind, group: Transaction[]) => {
    const id = pairId(kind, group.map(item => item.id));
    const next = card(kind, group, accounts, priors, Object.prototype.hasOwnProperty.call(jev, id) ? jev[id] : null);
    if (next) cards.push(next);
  };
  for (const debit of rows.filter(item => item.direction === 'debit')) {
    const credits = rows.filter(item => item.direction === 'credit' && sameAmount(item, debit) && item.occurredAt >= debit.occurredAt && hoursApart(item, debit) <= 48);
    if (credits.length === 1) push('SELF_TRANSFER', [debit, credits[0]]);
    const marker = semanticMarkers(evidenceText([debit.merchant, debit.rawBody]));
    if (marker.lending) push('LOAN_OUT', [debit]);
  }
  for (const credit of rows.filter(item => item.direction === 'credit')) {
    const earlier = rows.filter(item => item.direction === 'debit' && sameAmount(item, credit) && nameOverlap(item.merchant, credit.merchant) && credit.occurredAt >= item.occurredAt && credit.occurredAt - item.occurredAt <= 30 * DAY);
    if (earlier.length === 1 && !passesGate('LOAN_REPAYMENT', [earlier[0], credit], accounts)) push('REFUND', [earlier[0], credit]);
    if (earlier.length === 1) push('LOAN_REPAYMENT', [earlier[0], credit]);
    const committee = rows.filter(item => item.direction === 'debit' && nameOverlap(item.merchant, credit.merchant) && semanticMarkers(evidenceText([item.merchant, item.rawBody])).committee);
    if (committee.length >= 3 && credit.amountMinor >= committee[0].amountMinor * 6) push('COMMITTEE_PAYOUT', [...committee, credit]);
  }
  for (const withdrawal of rows.filter(item => item.transactionType === 'cash_withdrawal')) push('CASH_CONVERSION', [withdrawal]);
  const byMerchant = new Map<string, Transaction[]>();
  for (const debit of rows.filter(item => item.direction === 'debit')) {
    const key = merchantKey(debit.merchant);
    if (!key) continue;
    byMerchant.set(key, [...(byMerchant.get(key) ?? []), debit]);
  }
  for (const group of byMerchant.values()) {
    const marker = semanticMarkers(group.map(item => evidenceText([item.merchant, item.rawBody])).join(' '));
    if (marker.committee && group.length >= 3 && group.every(item => item.amountMinor === group[0].amountMinor)) push('COMMITTEE_CONTRIBUTION', group);
  }
  for (const payment of findRecurring(rows)) {
    const group = rows.filter(item => merchantKey(item.merchant) === payment.merchantKey && countsAsExpense(item));
    const marker = semanticMarkers(group.map(item => evidenceText([item.merchant, item.rawBody])).join(' '));
    if (group.length >= 3 && !marker.committee) push('RECURRING_COMMITMENT', group);
  }
  const sorted = [...rows].sort((a, b) => a.occurredAt - b.occurredAt);
  for (let index = 0; index < sorted.length; index += 1) {
    const right = sorted[index + 1];
    if (!right) break;
    push('DUPLICATE', [sorted[index], right]);
  }
  const seen = new Set<string>();
  return cards.filter(item => seen.has(item.id) ? false : (seen.add(item.id), true));
}

export function undoThread(transactions: Transaction[], thread: MoneyThread): Transaction[] {
  const ids = new Set(thread.transactionIds);
  return transactions.map(item => {
    if (!ids.has(item.id)) return item;
    const transactionType = thread.priorTypes[item.id] ?? item.transactionType;
    const status = thread.priorStatus[item.id] ?? item.status;
    return transactionType === item.transactionType && status === item.status ? item : { ...item, transactionType, status };
  });
}

export function applyThread(transactions: Transaction[], thread: MoneyThread): Transaction[] {
  if (thread.status !== 'confirmed' || thread.partial) return transactions;
  const ids = new Set(thread.transactionIds);
  const later = thread.transactionIds[thread.transactionIds.length - 1];
  return transactions.map(item => {
    if (!ids.has(item.id)) return item;
    if (thread.kind === 'DUPLICATE' && item.id === later) return { ...item, status: 'ignored' };
    const next = nextType(thread.kind, item);
    return next === item.transactionType ? item : { ...item, transactionType: next };
  });
}

export function nextType(kind: ThreadKind, item: Transaction): TransactionType {
  if (kind === 'SELF_TRANSFER' && item.direction === 'debit' && countsAsExpense(item)) return 'internal_transfer';
  if (kind === 'CASH_CONVERSION' && countsAsExpense(item)) return 'cash_withdrawal';
  if ((kind === 'LOAN_OUT' || kind === 'COMMITTEE_CONTRIBUTION') && item.direction === 'debit' && countsAsExpense(item)) return 'internal_transfer';
  if (kind === 'REFUND' && item.direction === 'credit' && countsAsIncome(item)) return 'refund';
  if ((kind === 'LOAN_REPAYMENT' || kind === 'COMMITTEE_PAYOUT') && item.direction === 'credit' && countsAsIncome(item)) return 'internal_transfer';
  if (kind === 'DUPLICATE') return item.transactionType;
  return item.transactionType;
}

export function trueSpend(transactions: Transaction[], threads: MoneyThread[]): TrueSpend {
  const confirmed = threads.filter(thread => thread.status === 'confirmed' && !thread.partial);
  const adjusted = confirmed.reduce(applyThread, transactions);
  const trueSpendMinor = Math.max(0, netSpend(adjusted));
  const byId = new Map(transactions.map(item => [item.id, item]));
  const movedMinor = confirmed.reduce((sum, thread) => sum + impactFor(thread.kind, thread.transactionIds.map(id => byId.get(id)).filter((item): item is Transaction => Boolean(item))), 0);
  return { leftMinor: trueSpendMinor + movedMinor, movedMinor, trueSpendMinor };
}

export function loanPosition(transactions: Transaction[], threads: MoneyThread[]): { lentMinor: number; returnedMinor: number } {
  const confirmed = threads.filter(thread => thread.status === 'confirmed');
  const byId = new Map(transactions.map(item => [item.id, item]));
  let lentMinor = 0;
  let returnedMinor = 0;
  for (const thread of confirmed) {
    const rows = thread.transactionIds.map(id => byId.get(id)).filter((item): item is Transaction => Boolean(item));
    if (thread.kind === 'LOAN_OUT') lentMinor += rows.reduce((sum, item) => sum + item.amountMinor, 0);
    if (thread.kind === 'LOAN_REPAYMENT' && !thread.partial) {
      returnedMinor += rows.filter(item => item.direction === 'credit').reduce((sum, item) => sum + item.amountMinor, 0);
      lentMinor += rows.filter(item => item.direction === 'debit').reduce((sum, item) => sum + item.amountMinor, 0);
    }
  }
  return { lentMinor, returnedMinor: Math.min(returnedMinor, lentMinor) };
}

export function rewindPrior(priors: ThreadPrior[], key: string, confirmed: boolean): ThreadPrior[] {
  const current = priors.find(item => item.key === key);
  if (!current) return priors;
  const next = { ...current, confirm: Math.max(0, current.confirm - (confirmed ? 1 : 0)), reject: Math.max(0, current.reject - (confirmed ? 0 : 1)) };
  if (next.confirm + next.reject === 0) return priors.filter(item => item.key !== key);
  return [...priors.filter(item => item.key !== key), next];
}

export function bumpPrior(priors: ThreadPrior[], key: string, confirmed: boolean): ThreadPrior[] {
  const current = priors.find(item => item.key === key) ?? { key, confirm: 0, reject: 0 };
  const next = { ...current, confirm: current.confirm + (confirmed ? 1 : 0), reject: current.reject + (confirmed ? 0 : 1) };
  return [...priors.filter(item => item.key !== key), next];
}

export function canActivateModel(complete: boolean, bytes: number, digest: string, expectedBytes: number, expectedDigest: string): boolean {
  return complete && bytes === expectedBytes && /^[a-f0-9]{64}$/.test(digest) && digest.toLowerCase() === expectedDigest.toLowerCase();
}

export function deviceTier(ramMb: number | null): 'rules' | 'lite' | 'roomy' {
  if (ramMb !== null && ramMb < 3200) return 'rules';
  if (ramMb !== null && ramMb >= 5500) return 'roomy';
  return 'lite';
}
