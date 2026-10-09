import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CategoryDot, EmptyState, Screen, ScreenHead, SectionTitle } from '@/ui/Kit';
import { money } from '@/lib/format';
import { colorForCategory, fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { cashEstimate, countsAsExpense, netSpend } from '@/finance/accounting/ledger';
import { findRecurring } from '@/finance/intelligence/recurring';
import { unusualSpend } from '@/finance/intelligence/anomalies';
import { periodChange } from '@/finance/intelligence/forecast';

type Period = 'Week' | 'Month' | 'Year';
function periodStart(period: Period, shift = 0): number {
  const date = new Date();
  if (period === 'Week') { const day = (date.getDay() + 6) % 7; date.setDate(date.getDate() - day - shift * 7); }
  else if (period === 'Month') date.setMonth(date.getMonth() - shift, 1);
  else date.setFullYear(date.getFullYear() - shift, 0, 1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export default function Insights() {
  const p = usePalette();
  const { transactions, preferences, adjustments } = useLedger();
  const [period, setPeriod] = useState<Period>('Month');
  const data = useMemo(() => {
    const current = transactions.filter(item => item.occurredAt >= periodStart(period) && item.currency === 'PKR');
    const previous = transactions.filter(item => item.occurredAt >= periodStart(period, 1) && item.occurredAt < periodStart(period) && item.currency === 'PKR');
    const totals = new Map<string, number>();
    for (const item of current.filter(countsAsExpense)) totals.set(item.category, (totals.get(item.category) ?? 0) + item.amountMinor);
    for (const item of current.filter(item => item.transactionType === 'refund')) totals.set(item.category, (totals.get(item.category) ?? 0) - item.amountMinor);
    const categories = [...totals.entries()].map(([category, amount]) => ({ category, amount })).filter(row => row.amount > 0).sort((a, b) => b.amount - a.amount);
    const providers = new Map<string, number>();
    for (const item of current.filter(countsAsExpense)) providers.set(item.providerId ?? item.rail ?? 'Unspecified', (providers.get(item.providerId ?? item.rail ?? 'Unspecified') ?? 0) + item.amountMinor);
    return { categories, providers: [...providers.entries()].sort((a, b) => b[1] - a[1]), change: periodChange(netSpend(current), netSpend(previous)), recurring: findRecurring(transactions), unusual: unusualSpend(transactions) };
  }, [transactions, period]);
  const total = data.categories.reduce((sum, row) => sum + row.amount, 0);
  const digital = transactions.filter(item => countsAsExpense(item) && item.accountId !== 'cash-wallet' && item.currency === 'PKR').reduce((sum, item) => sum + item.amountMinor, 0);
  const cashSpent = transactions.filter(item => countsAsExpense(item) && item.accountId === 'cash-wallet').reduce((sum, item) => sum + item.amountMinor, 0);
  return <Screen>
    <ScreenHead title="Where it went" />
    <View style={{ flexDirection: 'row', gap: 7, marginTop: 7 }}>
      {(['Week', 'Month', 'Year'] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityState={{ selected: period === value }} onPress={() => setPeriod(value)} style={{ paddingHorizontal: 20, minHeight: 44, justifyContent: 'center', borderRadius: 9, backgroundColor: period === value ? p.leaf : p.surface }}><Text style={{ fontFamily: fonts.bodyMedium, color: period === value ? p.onLeaf : p.muted }}>{value}</Text></Pressable>)}
    </View>
    <View style={{ marginTop: 28, marginBottom: 18 }}><Text style={{ fontFamily: fonts.body, color: p.muted, fontSize: 14 }}>Spending · {period.toLowerCase()}</Text><Text style={{ fontFamily: fonts.mono, fontSize: 34, color: p.ink, marginTop: 5, writingDirection: 'ltr' }}>{money(total, 'PKR', preferences.grouping)}</Text><Text style={{ fontFamily: fonts.body, color: p.muted, marginTop: 8 }}>{data.change.text}</Text></View>
    {data.categories.length ? <>
      <View accessibilityLabel="Spending by category" style={{ height: 22, flexDirection: 'row', overflow: 'hidden', borderRadius: 7, marginBottom: 22 }}>
        {data.categories.map(row => <View key={row.category} style={{ width: `${row.amount / total * 100}%`, backgroundColor: colorForCategory(row.category) }} />)}
      </View>
      <SectionTitle>By category</SectionTitle>
      {data.categories.map(row => <View key={row.category} style={{ paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: p.line }}><CategoryDot category={row.category} size={11} /><Text style={{ flex: 1, fontFamily: fonts.bodyMedium, color: p.ink }}>{row.category}</Text><Text style={{ fontFamily: fonts.mono, color: p.ink, writingDirection: 'ltr' }}>{money(row.amount, 'PKR', preferences.grouping)}</Text><Text style={{ width: 40, textAlign: 'right', color: p.muted }}>{Math.round(row.amount / total * 100)}%</Text></View>)}
    </> : <EmptyState title="Your picture will grow" detail="Expenses show here. Transfers and cash withdrawals stay out of this total." />}
    <View style={{ marginTop: 28 }}><SectionTitle>Cash and digital</SectionTitle><Text style={{ marginTop: 8, color: p.muted, fontFamily: fonts.body }}>Digital expenses {money(digital, 'PKR', preferences.grouping)}. Cash expenses {money(cashSpent, 'PKR', preferences.grouping)}. Estimated cash left {money(cashEstimate(transactions, adjustments), 'PKR', preferences.grouping)}.</Text></View>
    {data.recurring.length ? <View style={{ marginTop: 24 }}><SectionTitle>Recurring</SectionTitle>{data.recurring.slice(0, 4).map(item => <Text key={item.merchantKey} style={{ marginTop: 8, color: p.ink, fontFamily: fonts.body }}>{item.merchant} · {item.reason}</Text>)}</View> : null}
    {data.unusual.length ? <View style={{ marginTop: 24 }}><SectionTitle>Unusual for you</SectionTitle>{data.unusual.slice(0, 3).map(item => <Text key={item.merchant} style={{ marginTop: 8, color: p.ink, fontFamily: fonts.body }}>{item.merchant}: {item.reason}</Text>)}</View> : null}
    {data.providers.length ? <View style={{ marginTop: 24 }}><SectionTitle>By source</SectionTitle>{data.providers.slice(0, 6).map(([name, amount]) => <Text key={name} style={{ marginTop: 8, color: p.ink, fontFamily: fonts.body }}>{name} · {money(amount, 'PKR', preferences.grouping)}</Text>)}</View> : null}
  </Screen>;
}
