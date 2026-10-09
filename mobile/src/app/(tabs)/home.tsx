import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Body, Caption, EmptyState, Screen, ScreenHead, SectionTitle, SummarySlip, TransactionRow } from '@/ui/Kit';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { monthLabel, startOfMonth, money } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { showMessage } from '@/ui/dialog';
import { canReadSms } from '@/lib/sms';
import { cashEstimate, incomeTotal, netSpend } from '@/finance/accounting/ledger';
import { budgetPace } from '@/finance/intelligence/forecast';
import { copy } from '@/i18n/copy';

export default function Home() {
  const p = usePalette();
  const now = useNow();
  const { transactions, budgets, preferences, adjustments, scan, busy, error, clearError } = useLedger();
  const t = copy(preferences.language);
  const start = startOfMonth(now);
  const month = transactions.filter(item => item.occurredAt >= start && item.currency === 'PKR');
  const spent = netSpend(month);
  const received = incomeTotal(month);
  const budget = budgets.reduce((sum, item) => sum + item.amountMinor, 0);
  const review = transactions.filter(item => item.status === 'review').length;
  const inr = transactions.some(item => item.currency === 'INR');
  const cash = preferences.cashBridge ? cashEstimate(transactions.filter(item => item.currency === 'PKR'), adjustments) : null;
  const day = new Date(now).getDate();
  const days = new Date(new Date(now).getFullYear(), new Date(now).getMonth() + 1, 0).getDate();
  const pace = budgetPace(spent, budget, day, days);
  async function readNow() {
    try {
      const count = await scan(true);
      showMessage('SMS checked', count ? `${count} new ${count === 1 ? 'entry' : 'entries'} added.` : 'No new bank transactions found.');
    } catch (e) { showMessage('Could not read SMS', e instanceof Error ? e.message : 'Try again.'); }
  }
  return <Screen>
    <ScreenHead title={`${monthLabel(now)}`} action={{ icon: 'plus', label: 'Add a transaction', onPress: () => router.push('/manual') }} />
    <SummarySlip spent={Math.max(0, spent)} received={received} budget={budget} lastScanAt={preferences.lastScanAt} />
    <Caption>{t.tagline}</Caption>
    {inr ? <Caption>INR entries stay separate until you choose what to do with them in You.</Caption> : null}
    {error ? <Pressable onPress={clearError} style={{ marginTop: 17, padding: 12, backgroundColor: p.debitSoft, borderRadius: 10 }}><Body>{error}  ×</Body></Pressable> : null}
    {review ? <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/inbox')} style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: p.marigoldSoft, borderRadius: 12, padding: 15, marginTop: 19 }}>
      <Text style={{ fontFamily: fonts.bodyMedium, color: p.ink }}>{review} {t.review}</Text><Text style={{ color: p.review }}>Open ›</Text>
    </Pressable> : null}
    {pace.status === 'at-risk' && pace.projectedMinor ? <View style={{ marginTop: 14 }}><Body>At your recent pace you may pass the budget. {pace.assumption}</Body><Caption>Projected {money(pace.projectedMinor, 'PKR', preferences.grouping)}</Caption></View> : null}
    {cash !== null ? <Pressable accessibilityRole="button" onPress={() => router.push('/cash')} style={{ marginTop: 14 }}><Body>{t.cash}</Body><Text style={{ fontFamily: fonts.mono, color: p.ink, writingDirection: 'ltr' }}>{money(cash, 'PKR', preferences.grouping)}</Text><Caption>This is an estimate, not a bank balance.</Caption></Pressable> : null}
    <View style={{ marginTop: 28, marginBottom: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><SectionTitle>Latest</SectionTitle><Caption>{month.length} this month</Caption></View>
    {month.length ? month.slice(0, 8).map(item => <TransactionRow key={item.id} transaction={item} />) : <EmptyState title="Nothing here yet" detail="Add an expense, paste a message, or read allowlisted SMS on Android." action={<Action compact title="Add an expense" icon="plus" onPress={() => router.push('/manual')} />} />}
    <View style={{ marginTop: 23, gap: 10 }}>
      <Action title={t.ask} icon="search" onPress={() => router.push('/ask')} />
      {preferences.readSms && canReadSms() ? <Action title={busy ? 'Reading messages…' : 'Read new bank SMS'} icon="refresh" variant="secondary" disabled={busy} onPress={() => void readNow()} /> : null}
    </View>
  </Screen>;
}
