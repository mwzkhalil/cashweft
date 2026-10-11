import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Caption, Chip, ChipRow, EmptyState, ProgressBar, Screen, ScreenHead, Segmented, SectionTitle } from '@/ui/Kit';
import { CategoryIcon } from '@/ui/CategoryIcon';
import { BudgetsPanel } from '@/ui/BudgetsPanel';
import { money } from '@/lib/format';
import { colorForCategory, fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { CASH_ACCOUNT_ID } from '@/lib/model';
import { cashEstimate, countsAsExpense, netSpend } from '@/finance/accounting/ledger';
import { withPaths } from '@/finance/accounting/summary';
import { findRecurring } from '@/finance/intelligence/recurring';
import { unusualSpend } from '@/finance/intelligence/anomalies';
import { periodChange } from '@/finance/intelligence/forecast';
import { copy } from '@/i18n/copy';

type Period = 'week' | 'month' | 'year';
function periodStart(period: Period, shift = 0): number {
  const date = new Date();
  if (period === 'week') { const day = (date.getDay() + 6) % 7; date.setDate(date.getDate() - day - shift * 7); }
  else if (period === 'month') date.setMonth(date.getMonth() - shift, 1);
  else date.setFullYear(date.getFullYear() - shift, 0, 1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export default function Insights() {
  const p = usePalette();
  const { transactions, threads, preferences, adjustments } = useLedger();
  const t = copy(preferences.language);
  const g = preferences.grouping;
  const params = useLocalSearchParams<{ view?: string; at?: string }>();
  const [view, setView] = useState<'spending' | 'budgets'>(params.view === 'budgets' ? 'budgets' : 'spending');
  const [request, setRequest] = useState(params.at);
  if (params.at !== request) {
    setRequest(params.at);
    if (params.view === 'budgets') setView('budgets');
  }
  const [period, setPeriod] = useState<Period>('month');
  const data = useMemo(() => {
    const pkr = withPaths(transactions.filter(item => item.currency === 'PKR'), threads);
    const current = pkr.filter(item => item.occurredAt >= periodStart(period));
    const previous = pkr.filter(item => item.occurredAt >= periodStart(period, 1) && item.occurredAt < periodStart(period));
    const totals = new Map<string, number>();
    for (const item of current.filter(countsAsExpense)) totals.set(item.category, (totals.get(item.category) ?? 0) + item.amountMinor);
    for (const item of current.filter(item => item.transactionType === 'refund' && item.status !== 'ignored')) totals.set(item.category, (totals.get(item.category) ?? 0) - item.amountMinor);
    const categories = [...totals.entries()].map(([category, amount]) => ({ category, amount })).filter(row => row.amount > 0).sort((a, b) => b.amount - a.amount);
    const providers = new Map<string, number>();
    for (const item of current.filter(countsAsExpense)) { const key = item.providerId ?? item.rail ?? 'Other'; providers.set(key, (providers.get(key) ?? 0) + item.amountMinor); }
    const digital = current.filter(item => countsAsExpense(item) && item.accountId !== CASH_ACCOUNT_ID).reduce((sum, item) => sum + item.amountMinor, 0);
    const cash = current.filter(item => countsAsExpense(item) && item.accountId === CASH_ACCOUNT_ID).reduce((sum, item) => sum + item.amountMinor, 0);
    return { categories, digital, cash, providers: [...providers.entries()].sort((a, b) => b[1] - a[1]), change: periodChange(netSpend(current), netSpend(previous)), recurring: findRecurring(transactions), unusual: unusualSpend(transactions) };
  }, [transactions, threads, period]);
  const total = data.categories.reduce((sum, row) => sum + row.amount, 0);
  const top = data.categories[0]?.amount ?? 1;
  const both = Math.max(1, data.digital + data.cash);
  return <Screen tab>
    <ScreenHead title={t.insights} />
    <Segmented value={view} onChange={setView} options={[{ value: 'spending', label: t.spending }, { value: 'budgets', label: t.budgets }]} />
    {view === 'budgets' ? <BudgetsPanel /> : <>
      <View style={{ marginTop: 8 }}><ChipRow>{(['week', 'month', 'year'] as const).map(value => <Chip key={value} label={t[value]} selected={period === value} onPress={() => setPeriod(value)} />)}</ChipRow></View>
      <View style={{ marginTop: 12, marginBottom: 16 }}>
        <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: fonts.mono, fontSize: 36, lineHeight: 46, color: p.ink, writingDirection: 'ltr' }}>{money(total, 'PKR', g)}</Text>
        {data.change.comparable ? <Caption style={{ marginTop: 2 }}>{data.change.text}</Caption> : null}
      </View>
      {data.categories.length ? <>
        <View accessibilityLabel={t.byCategory} style={{ height: 16, flexDirection: 'row', overflow: 'hidden', borderRadius: 8, marginBottom: 20, gap: 2 }}>
          {data.categories.map(row => <View key={row.category} style={{ width: `${row.amount / total * 100}%`, backgroundColor: colorForCategory(row.category) }} />)}
        </View>
        <SectionTitle>{t.byCategory}</SectionTitle>
        {data.categories.map(row => <View key={row.category} accessible accessibilityLabel={`${row.category}, ${money(row.amount, 'PKR', g)}, ${Math.round(row.amount / total * 100)}%`} style={{ paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CategoryIcon category={row.category} />
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Text numberOfLines={1} style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: p.ink }}>{row.category}</Text>
              <Text style={{ fontFamily: fonts.mono, fontSize: 14, color: p.ink, writingDirection: 'ltr' }}>{money(row.amount, 'PKR', g)}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}><ProgressBar ratio={row.amount / top} color={colorForCategory(row.category)} track={p.sunk} height={4} /></View>
              <Caption style={{ width: 36, textAlign: 'right' }}>{Math.round(row.amount / total * 100)}%</Caption>
            </View>
          </View>
        </View>)}
      </> : <EmptyState title={t.insightsEmpty} detail={t.insightsEmptyDetail} />}
      {data.digital + data.cash > 0 ? <View style={{ marginTop: 24, gap: 10 }}>
        <SectionTitle>{t.cashAndDigital}</SectionTitle>
        <Split label={t.digital} amount={money(data.digital, 'PKR', g)} ratio={data.digital / both} color={p.marigold} />
        <Split label={t.cashInHand} amount={money(data.cash, 'PKR', g)} ratio={data.cash / both} color={p.review} />
        {preferences.cashBridge ? <Caption>{t.cash} {money(cashEstimate(transactions.filter(item => item.currency === 'PKR'), adjustments), 'PKR', g)} · {t.cashNote}</Caption> : null}
      </View> : null}
      {data.recurring.length ? <MiniList title={t.repeats} rows={data.recurring.slice(0, 4).map(item => ({ key: item.merchantKey, text: item.merchant, detail: item.reason }))} /> : null}
      {data.unusual.length ? <MiniList title={t.unusual} rows={data.unusual.slice(0, 4).map(item => ({ key: item.merchant, text: item.merchant, detail: item.reason }))} /> : null}
      {data.providers.length > 1 ? <MiniList title={t.bySource} rows={data.providers.slice(0, 4).map(([name, amount]) => ({ key: name, text: name, detail: money(amount, 'PKR', g) }))} /> : null}
    </>}
  </Screen>;
}

function Split({ label, amount, ratio, color }: { label: string; amount: string; ratio: number; color: string }) {
  const p = usePalette();
  return <View accessible accessibilityLabel={`${label}, ${amount}`} style={{ gap: 6 }}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: p.ink }}>{label}</Text><Text style={{ fontFamily: fonts.mono, fontSize: 14, color: p.ink, writingDirection: 'ltr' }}>{amount}</Text></View>
    <ProgressBar ratio={ratio} color={color} track={p.sunk} />
  </View>;
}

function MiniList({ title, rows }: { title: string; rows: { key: string; text: string; detail: string }[] }) {
  const p = usePalette();
  return <View style={{ marginTop: 24 }}>
    <SectionTitle>{title}</SectionTitle>
    {rows.map(row => <View key={row.key} style={{ paddingVertical: 8 }}>
      <Text numberOfLines={1} style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: p.ink }}>{row.text}</Text>
      <Caption numberOfLines={2}>{row.detail}</Caption>
    </View>)}
  </View>;
}
