import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Action, Caption, Chip, ChipRow, EmptyState, Screen, ScreenHead, SummaryCard } from '@/ui/Kit';
import { Icon } from '@/ui/Icon';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { money, startOfMonth } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { pathLabel } from '@/lib/labels';
import { loanPosition, moneySuggestions } from '@/finance/threads/decide';
import { periodSummary } from '@/finance/accounting/summary';
import type { ReviewCard } from '@/finance/threads/decide';
import type { GroupingStyle, MoneyThread, ThreadKind, Transaction } from '@/lib/model';
import { showMessage } from '@/ui/dialog';
import { copy } from '@/i18n/copy';

const sections = ['check', 'confirmed', 'loans', 'committee', 'cash', 'refunds'] as const;
type Section = (typeof sections)[number];
const sectionNames: Record<Section, string> = { check: 'To check', confirmed: 'Confirmed', loans: 'Loans', committee: 'Committee', cash: 'Cash', refunds: 'Refunds' };

function confidence(score: number): string {
  if (score >= 0.9) return 'Strong match';
  if (score >= 0.82) return 'Fair match';
  return 'Weak match';
}

export default function MoneyPaths() {
  const now = useNow();
  const { transactions, accounts, threads, priors, preferences, confirmThread, rejectThread, undoThread } = useLedger();
  const t = copy(preferences.language);
  const g = preferences.grouping;
  const cards = moneySuggestions(transactions, accounts, threads, priors);
  const [section, setSection] = useState<Section>('check');
  const month = transactions.filter(item => item.currency === 'PKR' && item.occurredAt >= startOfMonth(now));
  const summary = periodSummary(month, threads);
  const spend = { trueSpendMinor: summary.spentMinor, movedMinor: summary.movedMinor, leftMinor: summary.spentMinor + summary.movedMinor };
  const loans = loanPosition(transactions, threads);
  async function answer(card: ReviewCard, action: ReviewCard['actions'][number]) {
    try {
      if (action === 'reject') { await rejectThread(card); return; }
      const moved = await confirmThread(card, action);
      if (action === 'keep-one') showMessage('Ledger updated', 'The extra copy is set aside.');
      else if (moved > 0) showMessage('Ledger updated', `${money(moved, 'PKR', g)} is no longer counted as spending.`);
    } catch (e) { showMessage('Could not update', e instanceof Error ? e.message : 'Try again.'); }
  }
  const visible = threads.filter(thread => thread.status === 'confirmed' && matches(section, thread.kind));
  const figures = [{ label: t.moved, value: money(spend.movedMinor, 'PKR', g) }, { label: t.leftAccounts, value: money(spend.leftMinor, 'PKR', g) }];
  if (loans.lentMinor) figures.push({ label: 'Still lent', value: money(Math.max(0, loans.lentMinor - loans.returnedMinor), 'PKR', g) });
  return <Screen>
    <ScreenHead title={t.moneyPaths} back caption={t.thisMonth} />
    <SummaryCard label={t.trueSpend} amount={money(spend.trueSpendMinor, 'PKR', g)} figures={figures} />
    <View style={{ marginTop: 12 }}><ChipRow>{sections.map(name => <Chip key={name} label={sectionNames[name]} count={name === 'check' ? cards.length : undefined} selected={section === name} onPress={() => setSection(name)} />)}</ChipRow></View>
    {section === 'check' ? cards.length ? cards.map(card => <Suggested key={card.id} card={card} transactions={transactions} grouping={g} onAnswer={action => void answer(card, action)} />)
      : <View style={{ marginTop: 12 }}><EmptyState title={t.allClear} /></View> : null}
    {section !== 'check' ? visible.length ? visible.map(thread => <Confirmed key={thread.id} thread={thread} transactions={transactions} grouping={g} onUndo={() => void undoThread(thread.id)} />)
      : <View style={{ marginTop: 12 }}><EmptyState title={t.nothingHere} /></View> : null}
    <Caption style={{ marginTop: 20 }}>Nothing changes until you connect a path. Checked on this phone.</Caption>
  </Screen>;
}

function matches(section: Section, kind: ThreadKind): boolean {
  if (section === 'confirmed') return true;
  if (section === 'loans') return kind === 'LOAN_OUT' || kind === 'LOAN_REPAYMENT';
  if (section === 'committee') return kind === 'COMMITTEE_CONTRIBUTION' || kind === 'COMMITTEE_PAYOUT';
  if (section === 'cash') return kind === 'CASH_CONVERSION';
  if (section === 'refunds') return kind === 'REFUND';
  return false;
}

function rowsFor(ids: string[], transactions: Transaction[]): Transaction[] {
  return ids.map(id => transactions.find(item => item.id === id)).filter((item): item is Transaction => Boolean(item));
}

function Suggested({ card, transactions, grouping, onAnswer }: { card: ReviewCard; transactions: Transaction[]; grouping: GroupingStyle; onAnswer: (action: ReviewCard['actions'][number]) => void }) {
  const p = usePalette();
  const [why, setWhy] = useState(false);
  const rows = rowsFor(card.transactionIds, transactions);
  const primary = card.actions.find(action => action !== 'reject');
  return <View style={{ marginTop: 12, padding: 16, borderRadius: 16, backgroundColor: p.surface, borderWidth: 1.5, borderStyle: 'dashed', borderColor: p.strongLine }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: p.ink }}>{pathLabel(card.kind)}</Text>
      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderStyle: 'dashed', borderColor: p.muted }}><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: p.muted }}>Suggested</Text></View>
    </View>
    <Flow rows={rows} grouping={grouping} />
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: why }} onPress={() => setWhy(value => !value)} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: p.marigold }}>Why?</Text>
      <View style={{ transform: [{ rotate: why ? '90deg' : '0deg' }] }}><Icon name="chevron" color={p.marigold} size={14} /></View>
    </Pressable>
    {why ? <View style={{ gap: 4, marginBottom: 8 }}>
      {card.evidence.map(line => <View key={line} style={{ flexDirection: 'row', gap: 6 }}><Icon name="check" color={p.muted} size={14} /><Caption style={{ flex: 1, color: p.ink }}>{line}</Caption></View>)}
      <Caption>{confidence(card.score)}</Caption>
    </View> : null}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {card.actions.filter(action => action !== primary).map(action => <View key={action} style={{ flexGrow: 1 }}><Action compact title={label(card.kind, action)} variant="secondary" onPress={() => onAnswer(action)} /></View>)}
      {primary ? <View style={{ flexGrow: 1 }}><Action compact title={label(card.kind, primary)} onPress={() => onAnswer(primary)} /></View> : null}
    </View>
  </View>;
}

function Confirmed({ thread, transactions, grouping, onUndo }: { thread: MoneyThread; transactions: Transaction[]; grouping: GroupingStyle; onUndo: () => void }) {
  const p = usePalette();
  const rows = rowsFor(thread.transactionIds, transactions);
  return <View style={{ marginTop: 12, padding: 16, borderRadius: 16, backgroundColor: p.surface, borderWidth: 1.5, borderColor: p.marigold }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Icon name="check" color={p.marigold} size={18} />
      <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: p.ink }}>{pathLabel(thread.kind)}</Text>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: p.marigold }}>{thread.partial ? 'Partly returned' : 'Confirmed'}</Text>
    </View>
    <Flow rows={rows} grouping={grouping} />
    <View style={{ alignSelf: 'flex-start' }}><Action compact title="Undo" variant="ghost" onPress={onUndo} /></View>
  </View>;
}

function Flow({ rows, grouping }: { rows: Transaction[]; grouping: GroupingStyle }) {
  const p = usePalette();
  const spoken = rows.map(row => `${row.merchant} ${row.direction === 'debit' ? 'out' : 'in'} ${money(row.amountMinor, row.currency, grouping)}`).join(', then ');
  return <View accessible accessibilityLabel={spoken} style={{ marginVertical: 12 }}>
    {rows.map((row, index) => <View key={row.id}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: p.marigold, backgroundColor: index === 0 ? p.marigold : 'transparent' }} />
        <Text numberOfLines={1} style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: p.ink }}>{row.merchant}{row.accountLast4 ? ` ··${row.accountLast4}` : ''}</Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 14, color: row.direction === 'debit' ? p.ink : p.credit, writingDirection: 'ltr' }}>{row.direction === 'debit' ? '−' : '+'}{money(row.amountMinor, row.currency, grouping)}</Text>
      </View>
      {index < rows.length - 1 ? <View style={{ marginStart: 5, borderStartWidth: 2, borderStartColor: p.marigold, height: 22, justifyContent: 'center', paddingStart: 14 }}>
        <Icon name="arrowDown" color={p.muted} size={14} />
      </View> : null}
    </View>)}
  </View>;
}

function label(kind: ThreadKind, action: ReviewCard['actions'][number]): string {
  if (action === 'keep-one') return 'Keep one';
  if (action === 'partial') return 'Partly';
  if (action === 'reject' && kind === 'DUPLICATE') return 'Both are real';
  if (action === 'reject') return 'Not related';
  if (kind === 'LOAN_REPAYMENT') return 'Yes, returned';
  return 'Connect';
}
