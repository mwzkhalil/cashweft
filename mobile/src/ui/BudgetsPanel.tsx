import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Caption, EmptyState, ProgressBar } from './Kit';
import { CategoryIcon } from './CategoryIcon';
import { brand } from './brand';
import { fonts, usePalette } from './theme';
import { money, startOfMonth } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { useLedger } from '@/state/LedgerProvider';
import { categoryNet } from '@/finance/accounting/ledger';
import { withPaths } from '@/finance/accounting/summary';
import { budgetPace } from '@/finance/intelligence/forecast';
import { copy, fill } from '@/i18n/copy';

export function BudgetsPanel() {
  const p = usePalette();
  const now = useNow();
  const { budgets, transactions, threads, preferences } = useLedger();
  const t = copy(preferences.language);
  const g = preferences.grouping;
  const month = withPaths(transactions.filter(item => item.occurredAt >= startOfMonth(now) && item.currency === 'PKR'), threads);
  const totalBudget = budgets.reduce((sum, item) => sum + item.amountMinor, 0);
  const totalSpent = budgets.reduce((sum, item) => sum + Math.max(0, categoryNet(month, item.category)), 0);
  const day = new Date(now).getDate();
  const days = new Date(new Date(now).getFullYear(), new Date(now).getMonth() + 1, 0).getDate();
  if (!budgets.length) return <View style={{ marginTop: 16 }}><EmptyState title={t.budgetsEmpty} detail={t.budgetsEmptyDetail} action={<Action title={t.setBudget} icon="plus" onPress={() => router.push('/budget')} />} /></View>;
  return <View style={{ marginTop: 16 }}>
    <View style={{ backgroundColor: p.leaf, borderRadius: 20, padding: 18 }}>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: p.onLeaf }}>{t.leftThisMonth}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: fonts.mono, color: p.onLeaf, fontSize: 32, lineHeight: 42, writingDirection: 'ltr' }}>{money(totalBudget - totalSpent, 'PKR', g)}</Text>
      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: p.onLeaf, marginBottom: 12 }}>{fill(t.ofAmount, { amount: money(totalBudget, 'PKR', g) })}</Text>
      <ProgressBar ratio={totalBudget ? totalSpent / totalBudget : 0} color={totalSpent > totalBudget ? brand.offWhite : brand.mint} track={`${brand.offWhite}40`} />
    </View>
    <View style={{ marginTop: 12 }}>
      {budgets.map(item => {
        const used = Math.max(0, categoryNet(month, item.category));
        const over = used > item.amountMinor;
        const pace = budgetPace(used, item.amountMinor, day, days);
        return <Pressable key={item.category} accessibilityRole="button" accessibilityLabel={`${item.category}, ${money(used, 'PKR', g)} of ${money(item.amountMinor, 'PKR', g)}`} onPress={() => router.push({ pathname: '/budget', params: { category: item.category } })}
          style={({ pressed }) => ({ paddingVertical: 14, gap: 8, opacity: pressed ? .8 : 1 })}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <CategoryIcon category={item.category} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: p.ink, fontFamily: fonts.bodyMedium, fontSize: 15 }}>{item.category}</Text>
              <Caption style={{ color: over ? p.debit : p.muted }}>{over ? fill(t.over, { amount: money(used - item.amountMinor, 'PKR', g) }) : fill(t.left, { amount: money(item.amountMinor - used, 'PKR', g) })}{pace.status === 'at-risk' && !over ? ` · ${t.overPace}` : ''}</Caption>
            </View>
            <Text style={{ color: p.ink, fontFamily: fonts.mono, fontSize: 14, writingDirection: 'ltr' }}>{money(used, 'PKR', g)}</Text>
          </View>
          <ProgressBar ratio={used / item.amountMinor} color={over ? p.debit : pace.status === 'at-risk' ? p.review : p.marigold} track={p.sunk} />
        </Pressable>;
      })}
    </View>
    <View style={{ marginTop: 12 }}><Action title={t.setBudget} icon="plus" variant="secondary" onPress={() => router.push('/budget')} /></View>
  </View>;
}
