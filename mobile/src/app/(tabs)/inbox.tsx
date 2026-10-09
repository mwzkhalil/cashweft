import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Body, EmptyState, Screen, ScreenHead, SmsSlip, TransactionRow } from '@/ui/Kit';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import type { TransactionStatus } from '@/lib/model';
import { showMessage } from '@/ui/dialog';
import { suggestTransfers } from '@/finance/accounting/transfers';
import { duplicateHints } from '@/finance/intelligence/duplicates';

const tabs: { title: string; status: TransactionStatus | 'all' }[] = [
  { title: 'All', status: 'all' }, { title: 'Review', status: 'review' }, { title: 'Ledger', status: 'auto' }, { title: 'Ignored', status: 'ignored' },
];

export default function Inbox() {
  const p = usePalette();
  const { transactions, accounts, links, setTransaction, confirmLink, rejectLink, unlink } = useLedger();
  const [selected, setSelected] = useState<TransactionStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState('all');
  const suggestions = useMemo(() => suggestTransfers(transactions, accounts, links), [transactions, accounts, links]);
  const dupes = useMemo(() => duplicateHints(transactions), [transactions]);
  const visible = transactions.filter(item => {
    if (selected !== 'all' && item.status !== selected) return false;
    if (provider !== 'all' && item.providerId !== provider && item.rail !== provider) return false;
    if (!query.trim()) return true;
    const hay = `${item.merchant} ${item.category} ${item.reference ?? ''} ${item.sender ?? ''}`.toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  }).slice(0, 80);
  async function change(id: string, merchant: string, category: typeof transactions[number]['category'], status: TransactionStatus) {
    try { await setTransaction(id, merchant, category, status); }
    catch (e) { showMessage('Could not update', e instanceof Error ? e.message : 'Try again.'); }
  }
  return <Screen>
    <ScreenHead title="Activity" action={{ icon: 'plus', label: 'Add a transaction', onPress: () => router.push('/manual') }} />
    <TextInput accessibilityLabel="Search transactions" value={query} onChangeText={setQuery} placeholder="Search merchant, category, reference" placeholderTextColor={p.muted}
      style={{ minHeight: 48, borderWidth: 1, borderColor: p.line, borderRadius: 12, paddingHorizontal: 14, color: p.ink, fontFamily: fonts.body, backgroundColor: p.surface }} />
    <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
      {['all', 'raast', 'ibft', 'wallet'].map(value => <Pressable key={value} accessibilityRole="button" onPress={() => setProvider(value)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9, backgroundColor: provider === value ? p.leaf : p.surface }}><Text style={{ fontFamily: fonts.bodyMedium, color: provider === value ? p.onLeaf : p.muted }}>{value}</Text></Pressable>)}
    </View>
    <View style={{ flexDirection: 'row', marginTop: 12, padding: 4, backgroundColor: p.sunk, borderRadius: 12, gap: 3 }}>
      {tabs.map(tab => <Pressable key={tab.status} accessibilityRole="tab" accessibilityState={{ selected: selected === tab.status }} onPress={() => setSelected(tab.status)} style={{ flex: 1, alignItems: 'center', paddingVertical: 10, backgroundColor: selected === tab.status ? p.surface : 'transparent', borderRadius: 9 }}><Text style={{ fontFamily: selected === tab.status ? fonts.bodyMedium : fonts.body, color: selected === tab.status ? p.ink : p.muted, fontSize: 11 }}>{tab.title}</Text></Pressable>)}
    </View>
    {suggestions.length ? <View style={{ marginTop: 16, gap: 8 }}><Body>Possible transfers between your own accounts. Nothing is linked until you confirm.</Body>
      {suggestions.slice(0, 3).map(item => <View key={`${item.debitId}-${item.creditId}`} style={{ padding: 12, backgroundColor: p.surface, borderRadius: 12, gap: 8 }}>
        <Body>{item.reason}</Body>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Action compact title="Link" onPress={() => void confirmLink(item.debitId, item.creditId, item.reason, item.confidence).catch(e => showMessage('Could not link', e instanceof Error ? e.message : 'Try again.'))} /></View>
          <View style={{ flex: 1 }}><Action compact title="Not a match" variant="ghost" onPress={() => void rejectLink(item.debitId, item.creditId, item.reason)} /></View>
        </View>
      </View>)}
    </View> : null}
    {links.filter(link => link.status === 'confirmed').slice(0, 3).map(link => <Pressable key={link.id} accessibilityRole="button" onPress={() => void unlink(link.id)} style={{ marginTop: 10 }}><CaptionLink text="Linked transfer · tap to undo" /></Pressable>)}
    {dupes.slice(0, 2).map(hint => <CaptionLink key={`${hint.leftId}-${hint.rightId}`} text={hint.reason} />)}
    <View style={{ marginTop: 16, gap: 12 }}>
      {visible.length ? visible.map(item => item.rawBody && item.status === 'review' ? <SmsSlip key={item.id} transaction={item} actions={<View style={{ flexDirection: 'row', gap: 7 }}>
        <View style={{ flex: 1 }}><Action compact title="Not a spend" variant="ghost" onPress={() => void change(item.id, item.merchant, item.category, 'ignored')} /></View>
        <View style={{ flex: 1 }}><Action compact title="Fix" variant="secondary" onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: item.id } })} /></View>
        <View style={{ flex: 1 }}><Action compact title="Looks right" variant="leaf" onPress={() => void change(item.id, item.merchant, item.category, 'auto')} /></View>
      </View>} /> : <TransactionRow key={item.id} transaction={item} />) : <EmptyState title="Nothing in this view" detail="Try another filter, or add an entry." />}
    </View>
  </Screen>;
}

function CaptionLink({ text }: { text: string }) {
  const p = usePalette();
  return <Text style={{ marginTop: 8, color: p.muted, fontFamily: fonts.body, fontSize: 13 }}>{text}</Text>;
}
