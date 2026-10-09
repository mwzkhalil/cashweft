import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Action, Body, Caption, Screen, ScreenHead, SectionTitle } from '@/ui/Kit';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { money } from '@/lib/format';
import { loanPosition, moneySuggestions, trueSpend } from '@/finance/threads/decide';
import type { ReviewCard } from '@/finance/threads/decide';
import type { MoneyThread, ThreadKind } from '@/lib/model';
import { showMessage } from '@/ui/dialog';

const sections = ['Needs review', 'Connected', 'Loans', 'Committee', 'Cash', 'Refunds'] as const;

function confidence(score: number): string {
  if (score >= 0.9) return 'High';
  if (score >= 0.82) return 'Fair';
  return 'Low';
}

export default function Threads() {
  const p = usePalette();
  const { transactions, accounts, threads, priors, preferences, confirmThread, rejectThread, undoThread } = useLedger();
  const [section, setSection] = useState<(typeof sections)[number]>('Needs review');
  const [offer, setOffer] = useState(true);
  const cards = moneySuggestions(transactions, accounts, threads, priors);
  const spend = trueSpend(transactions.filter(item => item.currency === 'PKR'), threads);
  const loans = loanPosition(transactions, threads);
  async function answer(card: ReviewCard, action: 'connect' | 'partial' | 'keep-one' | 'reject') {
    try {
      if (action === 'reject') { await rejectThread(card); return; }
      const moved = await confirmThread(card, action);
      if (action === 'keep-one') showMessage('Ledger updated', 'The extra copy is set aside. The first one stays.');
      else if (moved > 0) showMessage('Ledger updated', `${money(moved, 'PKR', preferences.grouping)} is no longer counted as spending.`);
    } catch (e) { showMessage('Could not update', e instanceof Error ? e.message : 'Try again.'); }
  }
  const visible = threads.filter(thread => thread.status === 'confirmed' && matches(section, thread.kind));
  return <Screen>
    <ScreenHead title="Money Threads" back />
    <Body muted>See where money moved, and what was actually spent. Home still shows the normal total.</Body>
    <View style={{ marginTop: 18, padding: 16, borderRadius: 14, backgroundColor: p.surface, borderWidth: 1, borderColor: p.line }}>
      <Caption>Money left accounts</Caption>
      <Text style={{ fontFamily: fonts.mono, color: p.ink, marginTop: 4 }}>{money(spend.leftMinor, 'PKR', preferences.grouping)}</Text>
      <Caption style={{ marginTop: 10 }}>Money moved</Caption>
      <Text style={{ fontFamily: fonts.mono, color: p.ink, marginTop: 4 }}>{money(spend.movedMinor, 'PKR', preferences.grouping)}</Text>
      <Caption style={{ marginTop: 10 }}>True Spend</Caption>
      <Text style={{ fontFamily: fonts.displayMedium, fontSize: 22, color: p.ink, marginTop: 4 }}>{money(spend.trueSpendMinor, 'PKR', preferences.grouping)}</Text>
      <Caption style={{ marginTop: 8 }}>True Spend leaves out confirmed transfers, cash taken out, money lent, and committee money set aside. Refunds reduce it. Nothing changes until you confirm a card.</Caption>
    </View>
    {loans.lentMinor ? <View style={{ marginTop: 12 }}><Body>Outstanding money lent {money(Math.max(0, loans.lentMinor - loans.returnedMinor), 'PKR', preferences.grouping)}</Body><Caption>Money returned {money(loans.returnedMinor, 'PKR', preferences.grouping)}</Caption></View> : null}
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
      {sections.map(name => <Pressable key={name} accessibilityRole="button" onPress={() => setSection(name)} style={{ minHeight: 36, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 18, backgroundColor: section === name ? p.leaf : p.surface }}>
        <Text style={{ color: section === name ? p.onLeaf : p.ink, fontFamily: fonts.bodyMedium, fontSize: 13 }}>{name}</Text>
      </Pressable>)}
    </View>
    {section === 'Needs review' ? cards.map(card => <Review key={card.id} card={card} transactions={transactions} grouping={preferences.grouping} onAnswer={action => void answer(card, action)} />) : null}
    {section === 'Needs review' && !cards.length ? <View style={{ marginTop: 18 }}><Body>Nothing needs your eyes.</Body></View> : null}
    {section !== 'Needs review' ? visible.map(thread => <Connected key={thread.id} thread={thread} transactions={transactions} grouping={preferences.grouping} onUndo={() => void undoThread(thread.id)} />) : null}
    {section !== 'Needs review' && !visible.length ? <View style={{ marginTop: 18 }}><Caption>Nothing connected here yet.</Caption></View> : null}
    {offer ? <View style={{ marginTop: 28, padding: 16, borderRadius: 14, backgroundColor: p.bg, borderWidth: 1, borderColor: p.line }}>
      <SectionTitle>Private Money Intelligence</SectionTitle>
      <Body muted style={{ marginTop: 8 }}>Cashweft can download an optional on-device model later. It would run on this phone, and transaction text would not be uploaded. The phone-sized pack is not in this build, so these cards use Cashweft’s own checks. You can dismiss this.</Body>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        <Action compact title="Not now" variant="secondary" onPress={() => setOffer(false)} />
      </View>
    </View> : null}
  </Screen>;
}

function matches(section: (typeof sections)[number], kind: ThreadKind): boolean {
  if (section === 'Connected') return true;
  if (section === 'Loans') return kind === 'LOAN_OUT' || kind === 'LOAN_REPAYMENT';
  if (section === 'Committee') return kind === 'COMMITTEE_CONTRIBUTION' || kind === 'COMMITTEE_PAYOUT';
  if (section === 'Cash') return kind === 'CASH_CONVERSION';
  if (section === 'Refunds') return kind === 'REFUND';
  return false;
}

function namesFor(ids: string[], transactions: { id: string; merchant: string; amountMinor: number }[]) {
  return ids.map(id => transactions.find(item => item.id === id)).filter((item): item is { id: string; merchant: string; amountMinor: number } => Boolean(item));
}

function Review({ card, transactions, grouping, onAnswer }: { card: ReviewCard; transactions: { id: string; merchant: string; amountMinor: number }[]; grouping: 'international' | 'southAsian'; onAnswer: (action: ReviewCard['actions'][number]) => void }) {
  const p = usePalette();
  const rows = namesFor(card.transactionIds, transactions);
  return <View style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: p.surface }}>
    <Text style={{ fontFamily: fonts.displayMedium, fontSize: 22, color: p.ink }}>{money(rows[0]?.amountMinor ?? card.impactMinor, 'PKR', grouping)}</Text>
    <Caption style={{ marginTop: 4 }}>{card.title}</Caption>
    <Body style={{ marginTop: 8 }}>{card.detail}</Body>
    <Weave rows={rows} grouping={grouping} />
    <Caption style={{ marginTop: 10 }}>Why Cashweft noticed this</Caption>
    {card.evidence.map(line => <Text key={line} style={{ marginTop: 4, color: p.ink, fontFamily: fonts.body }}>✓ {line}</Text>)}
    <Caption style={{ marginTop: 8 }}>Confidence {confidence(card.score)}</Caption>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
      {card.actions.map(action => <Action key={action} compact title={label(card.kind, action)} variant={action === 'reject' ? 'secondary' : 'primary'} onPress={() => onAnswer(action)} />)}
    </View>
  </View>;
}

function Connected({ thread, transactions, grouping, onUndo }: { thread: MoneyThread; transactions: { id: string; merchant: string; amountMinor: number }[]; grouping: 'international' | 'southAsian'; onUndo: () => void }) {
  const p = usePalette();
  const rows = namesFor(thread.transactionIds, transactions);
  return <View style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: p.surface }}>
    <Weave rows={rows} grouping={grouping} />
    <Caption style={{ marginTop: 8 }}>{thread.partial ? 'Part of a loan was returned.' : 'Connected by you.'}</Caption>
    <View style={{ marginTop: 12 }}><Action compact title="Undo" variant="ghost" onPress={onUndo} /></View>
  </View>;
}

function Weave({ rows, grouping }: { rows: { merchant: string; amountMinor: number }[]; grouping: 'international' | 'southAsian' }) {
  const p = usePalette();
  return <View style={{ marginTop: 12 }}>
    {rows.map((row, index) => <View key={`${row.merchant}-${index}`}>
      <Text style={{ fontFamily: fonts.bodyMedium, color: p.ink }}>{row.merchant}</Text>
      {index < rows.length - 1 ? <View style={{ borderLeftWidth: 1, borderColor: p.leaf, marginLeft: 7, paddingLeft: 12, paddingVertical: 6 }}>
        <Text style={{ fontFamily: fonts.mono, color: p.muted }}>{money(row.amountMinor, 'PKR', grouping)}</Text>
      </View> : null}
    </View>)}
  </View>;
}

function label(kind: ThreadKind, action: ReviewCard['actions'][number]): string {
  if (action === 'keep-one') return 'Keep one';
  if (action === 'partial') return 'Partly';
  if (action === 'reject' && kind === 'DUPLICATE') return 'Both are real';
  if (action === 'reject') return 'Not related';
  if (kind === 'LOAN_REPAYMENT') return 'Yes, repayment';
  return 'Connect them';
}
