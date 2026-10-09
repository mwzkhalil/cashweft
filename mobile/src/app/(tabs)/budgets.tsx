import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, CategoryDot, EmptyState, Screen, ScreenHead, SectionTitle } from '@/ui/Kit';
import { money, startOfMonth } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { categoryNet } from '@/finance/accounting/ledger';
import { budgetPace } from '@/finance/intelligence/forecast';

export default function Budgets() {
  const p = usePalette();
  const now = useNow();
  const { budgets, transactions, preferences } = useLedger();
  const month = transactions.filter(item => item.occurredAt >= startOfMonth(now) && item.currency === 'PKR');
  const totalBudget = budgets.reduce((sum, item) => sum + item.amountMinor, 0);
  const totalSpent = budgets.reduce((sum, item) => sum + Math.max(0, categoryNet(month, item.category)), 0);
  const day = new Date(now).getDate();
  const days = new Date(new Date(now).getFullYear(), new Date(now).getMonth() + 1, 0).getDate();
  return <Screen>
    <ScreenHead title="Budgets" action={{ icon: 'plus', label: 'Add a budget', onPress: () => router.push('/budget') }} />
    <View style={{ backgroundColor: p.leaf, borderRadius: 18, padding: 18, marginTop: 6 }}>
      <Text style={{ fontFamily: fonts.body, color: p.onLeaf }}>Left this month</Text>
      <Text style={{ fontFamily: fonts.mono, color: p.onLeaf, fontSize: 29, marginTop: 8, writingDirection: 'ltr' }}>{money(totalBudget - totalSpent, 'PKR', preferences.grouping)}</Text>
      <Text style={{ fontFamily: fonts.body, color: p.onLeaf, marginTop: 5 }}>of {money(totalBudget, 'PKR', preferences.grouping)}</Text>
    </View>
    <View style={{ marginTop: 28, marginBottom: 8 }}><SectionTitle>Categories</SectionTitle></View>
    {budgets.length ? budgets.map(item => {
      const used = Math.max(0, categoryNet(month, item.category));
      const pace = budgetPace(used, item.amountMinor, day, days);
      return <Pressable key={item.category} accessibilityRole="button" accessibilityLabel={`Edit ${item.category} budget`} onPress={() => router.push({ pathname: '/budget', params: { category: item.category } })} style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: p.line }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}><CategoryDot category={item.category} size={11} /><Text style={{ flex: 1, color: p.ink, fontFamily: fonts.bodyMedium }}>{item.category}</Text><Text style={{ color: p.ink, fontFamily: fonts.mono, writingDirection: 'ltr' }}>{money(used, 'PKR', preferences.grouping)}</Text></View>
        <View style={{ height: 6, backgroundColor: p.sunk, borderRadius: 4, marginTop: 12, overflow: 'hidden' }}><View style={{ width: `${Math.min(100, used / item.amountMinor * 100)}%`, height: 6, backgroundColor: used > item.amountMinor ? p.debit : p.leaf }} /></View>
        <Text style={{ marginTop: 6, color: p.muted, fontFamily: fonts.body, fontSize: 12 }}>{money(Math.max(0, item.amountMinor - used), 'PKR', preferences.grouping)} left{used > item.amountMinor ? ' · Over budget' : ''}</Text>
        {pace.status !== 'insufficient' ? <Text style={{ marginTop: 4, color: p.muted, fontFamily: fonts.body, fontSize: 12 }}>{pace.status === 'at-risk' ? 'Pace is above this budget. ' : 'Pace is inside this budget. '}{pace.assumption}</Text> : null}
      </Pressable>;
    }) : <EmptyState title="Set a monthly limit" detail="Budgets follow expenses and fees, then subtract refunds. Transfers and ATM withdrawals are not counted as spending." action={<Action compact title="Set a budget" icon="plus" onPress={() => router.push('/budget')} />} />}
  </Screen>;
}
