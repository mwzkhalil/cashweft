import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, Body, Caption, Chip, ChipRow, EmptyState, Screen, ScreenHead, SmsSlip, TransactionRow } from '@/ui/Kit';
import { matchesView } from '@/finance/accounting/summary';
import type { ActivityView } from '@/finance/accounting/summary';
import { Icon } from '@/ui/Icon';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import type { Transaction, TransactionStatus } from '@/lib/model';
import { groupByDay } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { showMessage } from '@/ui/dialog';
import { suggestTransfers } from '@/finance/accounting/transfers';
import { duplicateHints } from '@/finance/intelligence/duplicates';
import { copy } from '@/i18n/copy';

type View_ = ActivityView;

export default function Activity() {
  const p = usePalette();
  const now = useNow();
  const { transactions, accounts, links, preferences, setTransaction, confirmLink, rejectLink, unlink } = useLedger();
  const t = copy(preferences.language);
  const params = useLocalSearchParams<{ status?: string; at?: string }>();
  const [view, setView] = useState<View_>(params.status === 'review' ? 'review' : 'all');
  const [request, setRequest] = useState(params.at);
  if (params.at !== request) {
    setRequest(params.at);
    if (params.status === 'review') setView('review');
  }
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => suggestTransfers(transactions, accounts, links), [transactions, accounts, links]);
  const dupes = useMemo(() => duplicateHints(transactions), [transactions]);
  const linked = links.filter(link => link.status === 'confirmed');
  const checks = suggestions.length + dupes.length;
  const review = transactions.filter(item => item.status === 'review').length;
  const needle = query.trim().toLowerCase();
  const visible = transactions.filter(item => matchesView(item, view) && (!needle || `${item.merchant} ${item.category} ${item.reference ?? ''} ${item.sender ?? ''}`.toLowerCase().includes(needle))).slice(0, 120);
  const groups = groupByDay(visible, now);
  async function change(id: string, merchant: string, category: Transaction['category'], status: TransactionStatus) {
    try { await setTransaction(id, merchant, category, status); }
    catch (e) { showMessage('Could not update', e instanceof Error ? e.message : 'Try again.'); }
  }
  const chips: { value: View_; label: string; count?: number }[] = [
    { value: 'all', label: t.all }, { value: 'spent', label: t.spent }, { value: 'received', label: t.received },
    { value: 'moved', label: t.moved }, { value: 'review', label: t.reviewChip, count: review },
  ];
  return <Screen tab>
    <ScreenHead title={t.activity} action={{ icon: 'plus', label: t.addEntry, onPress: () => router.push('/manual'), primary: true }} />
    <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: p.line, borderRadius: 12, paddingHorizontal: 12, backgroundColor: p.surface }}>
      <Icon name="search" color={p.muted} size={18} />
      <TextInput accessibilityLabel={t.searchEntries} value={query} onChangeText={setQuery} placeholder={t.searchEntries} placeholderTextColor={p.muted}
        style={{ flex: 1, minHeight: 46, color: p.ink, fontFamily: fonts.body, fontSize: 15 }} />
      {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={12}><Icon name="close" color={p.muted} size={16} /></Pressable> : null}
    </View>
    <View style={{ marginTop: 6 }}><ChipRow>{chips.map(chip => <Chip key={chip.value} label={chip.label} count={chip.count} selected={view === chip.value} onPress={() => setView(chip.value)} />)}</ChipRow></View>
    {checks ? <View style={{ marginTop: 8, backgroundColor: p.surface, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: p.strongLine }}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} style={{ minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon name="threads" color={p.marigold} size={22} />
        <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: p.ink }}>{suggestions.length ? `${suggestions.length} ${suggestions.length === 1 ? t.possibleMove : t.possibleMoves}` : dupes[0]?.reason}</Text>
        <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}><Icon name="chevron" color={p.muted} size={18} /></View>
      </Pressable>
      {open ? <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 12 }}>
        {suggestions.slice(0, 5).map(item => <View key={`${item.debitId}-${item.creditId}`} style={{ gap: 8 }}>
          <Body>{item.reason}</Body>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}><Action compact title={t.notRelated} variant="secondary" onPress={() => void rejectLink(item.debitId, item.creditId, item.reason)} /></View>
            <View style={{ flex: 1 }}><Action compact title={t.connect} onPress={() => void confirmLink(item.debitId, item.creditId, item.reason, item.confidence).catch(e => showMessage('Could not link', e instanceof Error ? e.message : 'Try again.'))} /></View>
          </View>
        </View>)}
        {dupes.slice(0, 3).map(hint => <Caption key={`${hint.leftId}-${hint.rightId}`}>{hint.reason}</Caption>)}
      </View> : null}
    </View> : null}
    {linked.length && view === 'moved' ? linked.slice(0, 3).map(link => <Pressable key={link.id} accessibilityRole="button" onPress={() => void unlink(link.id)} style={{ minHeight: 48, justifyContent: 'center' }}><Caption>Linked transfer · {t.undo}</Caption></Pressable>) : null}
    <View style={{ marginTop: 8 }}>
      {groups.length ? groups.map(group => <View key={group.day}>
        <Caption style={{ marginTop: 14, marginBottom: 2, fontFamily: fonts.bodyMedium }}>{group.label.kind === 'today' ? t.today : group.label.kind === 'yesterday' ? t.yesterday : group.label.text}</Caption>
        {group.items.map(item => item.rawBody && item.status === 'review' ? <View key={item.id} style={{ marginVertical: 6 }}><SmsSlip transaction={item} actions={<View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Action compact title={t.notASpend} variant="ghost" onPress={() => void change(item.id, item.merchant, item.category, 'ignored')} /></View>
          <View style={{ flex: 1 }}><Action compact title={t.fix} variant="secondary" onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: item.id } })} /></View>
          <View style={{ flex: 1 }}><Action compact title={t.looksRight} onPress={() => void change(item.id, item.merchant, item.category, 'auto')} /></View>
        </View>} /></View> : <TransactionRow key={item.id} transaction={item} grouping={preferences.grouping} />)}
      </View>) : <EmptyState title={view === 'review' ? t.allClear : t.nothingHere} detail={view === 'review' ? '' : t.tryAnother} />}
    </View>
  </Screen>;
}
