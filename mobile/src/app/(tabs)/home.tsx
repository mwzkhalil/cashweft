import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, AttentionRow, Body, EmptyState, Screen, ScreenHead, SectionTitle, SummaryCard, TransactionRow } from '@/ui/Kit';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { dateLabel, monthLabel, money, startOfDay, startOfMonth } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { showMessage } from '@/ui/dialog';
import { canReadSms } from '@/lib/sms';
import { loadHistoryJob } from '@/lib/database';
import type { HistoryJob } from '@/lib/model';
import { cashEstimate } from '@/finance/accounting/ledger';
import { periodSummary } from '@/finance/accounting/summary';
import { moneySuggestions } from '@/finance/threads/decide';
import { budgetPace } from '@/finance/intelligence/forecast';
import { copy, fill } from '@/i18n/copy';
import type { IconName } from '@/ui/Icon';

function openReview() {
  router.push({ pathname: '/(tabs)/inbox', params: { status: 'review', at: String(Date.now()) } });
}

function openBudgets() {
  router.push({ pathname: '/(tabs)/insights', params: { view: 'budgets', at: String(Date.now()) } });
}

export default function Home() {
  const p = usePalette();
  const now = useNow();
  const { transactions, budgets, preferences, adjustments, accounts, threads, priors, scan, busy, error, clearError, setPreference } = useLedger();
  const t = copy(preferences.language);
  const g = preferences.grouping;
  const start = startOfMonth(now);
  const month = transactions.filter(item => item.occurredAt >= start && item.currency === 'PKR');
  const summary = periodSummary(month, threads);
  const budget = budgets.reduce((sum, item) => sum + item.amountMinor, 0);
  const review = transactions.filter(item => item.status === 'review').length;
  const paths = moneySuggestions(transactions, accounts, threads, priors).length;
  const cash = preferences.cashBridge ? cashEstimate(transactions.filter(item => item.currency === 'PKR'), adjustments) : null;
  const day = new Date(now).getDate();
  const days = new Date(new Date(now).getFullYear(), new Date(now).getMonth() + 1, 0).getDate();
  const pace = budgetPace(summary.spentMinor, budget, day, days);
  const sms = preferences.readSms && canReadSms();
  const [paused, setPaused] = React.useState<HistoryJob | null>(null);
  React.useEffect(() => {
    if (!canReadSms()) return;
    void loadHistoryJob().then(setPaused);
  }, [preferences.lastScanAt, preferences.historyPromptSeen]);
  async function readNow() {
    try {
      const count = await scan();
      showMessage(t.smsChecked, count ? fill(t.newEntries, { n: count }) : t.noNewEntries);
    } catch (e) { showMessage(t.checkSms, e instanceof Error ? e.message : 'Try again.'); }
  }
  const read = preferences.lastScanAt ? startOfDay(preferences.lastScanAt) === startOfDay(now) ? t.readToday : fill(t.readOn, { date: dateLabel(preferences.lastScanAt) }) : t.checkSms;
  const caption = sms ? `${monthLabel(now)} · ${busy ? '…' : read}` : monthLabel(now);
  const attention: { key: string; icon: IconName; title: string; onPress: () => void; tone?: 'review' }[] = [];
  if (review) attention.push({ key: 'review', icon: 'alert', tone: 'review', title: `${review} ${t.toReview}`, onPress: openReview });
  if (paths) attention.push({ key: 'paths', icon: 'threads', title: `${paths} ${t.pathsToCheck}`, onPress: () => router.push('/threads') });
  if (paused) attention.push({ key: 'paused', icon: 'sms', title: t.importPaused, onPress: () => router.push({ pathname: '/sms-history', params: { resume: '1' } }) });
  else if (sms && !preferences.historyPromptSeen) attention.push({ key: 'history', icon: 'download', title: t.findOlder, onPress: () => { void setPreference('historyPromptSeen', true); router.push('/sms-history'); } });
  if (preferences.legacyCurrency === 'pending') attention.push({ key: 'inr', icon: 'info', title: t.inrPending, onPress: () => router.push('/(tabs)/you') });
  if (pace.status === 'at-risk' && pace.projectedMinor) attention.push({ key: 'pace', icon: 'budgets', title: `${t.overPace} · ${money(Math.round(pace.projectedMinor / 100) * 100, 'PKR', g)}`, onPress: openBudgets });
  const figures = [{ label: t.received, value: money(summary.receivedMinor, 'PKR', g) }, { label: t.moved, value: money(summary.movedMinor, 'PKR', g) }];
  if (cash !== null) figures.push({ label: t.cash, value: money(cash, 'PKR', g) });
  return <Screen tab>
    <ScreenHead title={t.thisMonth} caption={caption} onCaption={sms && !busy ? () => void readNow() : undefined}
      actions={[{ icon: 'search', label: t.ask, onPress: () => router.push('/ask') }, { icon: 'plus', label: t.addEntry, onPress: () => router.push('/manual'), primary: true }]} />
    <SummaryCard label={t.spent} amount={money(summary.spentMinor, 'PKR', g)} figures={figures}
      budget={budget ? { ratio: summary.spentMinor / budget, over: summary.spentMinor > budget, text: fill(t.budgetOf, { percent: `${Math.round(summary.spentMinor / budget * 100)}%`, amount: money(budget, 'PKR', g) }) } : undefined}
      onBudget={openBudgets} />
    {error ? <Pressable accessibilityRole="button" accessibilityLabel={`${error}. Dismiss`} onPress={clearError} style={{ marginTop: 12, minHeight: 48, padding: 12, backgroundColor: p.debitSoft, borderRadius: 12 }}><Body>{error}  ×</Body></Pressable> : null}
    {attention.length ? <View style={{ marginTop: 8 }}>{attention.slice(0, 3).map(({ key, ...item }) => <AttentionRow key={key} {...item} />)}</View> : null}
    <View style={{ marginTop: 24, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <SectionTitle>{t.recent}</SectionTitle>
      {transactions.length ? <Pressable accessibilityRole="button" onPress={() => router.push('/(tabs)/inbox')} style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 4 }}><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: p.marigold }}>{t.seeAll}</Text></Pressable> : null}
    </View>
    {transactions.length ? transactions.slice(0, 4).map(item => <TransactionRow key={item.id} transaction={item} grouping={g} />)
      : <EmptyState title={t.noEntries} detail={t.noEntriesDetail} action={<View style={{ flexDirection: 'row', gap: 8 }}>
        <Action compact title={t.add} icon="plus" onPress={() => router.push('/manual')} />
        <Action compact title={t.pasteSms} variant="secondary" icon="sms" onPress={() => router.push('/import')} />
      </View>} />}
  </Screen>;
}
