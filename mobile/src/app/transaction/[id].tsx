import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, Body, Caption, Screen, ScreenHead, SmsSlip } from '@/ui/Kit';
import { CategoryPicker, Field } from '@/ui/Forms';
import { dateLabel, signedMoney } from '@/lib/format';
import { TRANSACTION_TYPES } from '@/lib/model';
import type { TransactionStatus, TransactionType } from '@/lib/model';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { showMessage } from '@/ui/dialog';
import { providerById } from '@/finance/parser/providers';

export default function TransactionDetail() {
  const p = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, preferences, setTransaction } = useLedger();
  const item = transactions.find(entry => entry.id === id);
  const [merchant, setMerchant] = useState(item?.merchant ?? '');
  const [category, setCategory] = useState(item?.category ?? 'Other');
  const [kind, setKind] = useState<TransactionType>(item?.transactionType ?? 'expense');
  const [busy, setBusy] = useState(false);
  if (!item) return <Screen><ScreenHead title="Entry not found" back /><Body muted>This entry is not in the current ledger.</Body></Screen>;
  async function save(status: TransactionStatus) {
    if (!item) return;
    setBusy(true);
    try { await setTransaction(item.id, merchant, category, status, kind); router.back(); }
    catch (e) { showMessage('Could not save', e instanceof Error ? e.message : 'Try again.'); }
    finally { setBusy(false); }
  }
  const provider = providerById(item.providerId);
  return <Screen><ScreenHead title="Entry" back />
    <Text style={{ fontFamily: fonts.mono, fontSize: 32, color: item.direction === 'debit' ? p.debit : p.credit, writingDirection: 'ltr' }}>{signedMoney(item.amountMinor, item.direction, item.currency, true, preferences.grouping)}</Text>
    <Caption>{dateLabel(item.occurredAt)} · {item.status}</Caption>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 16 }}>
      {TRANSACTION_TYPES.map(value => <Pressable key={value} accessibilityRole="radio" onPress={() => setKind(value)} style={{ minHeight: 40, paddingHorizontal: 10, justifyContent: 'center', borderRadius: 9, backgroundColor: kind === value ? p.marigoldSoft : p.surface }}><Text style={{ color: p.ink, fontFamily: fonts.body }}>{value.replaceAll('_', ' ')}</Text></Pressable>)}
    </View>
    <View style={{ gap: 16, marginBottom: 16 }}><Field label="Name or place" value={merchant} onChangeText={setMerchant} /><CategoryPicker value={category} onChange={setCategory} /></View>
    <View style={{ backgroundColor: p.surface, borderRadius: 12, padding: 14, gap: 8, marginBottom: 16 }}>
      <Body>Account ··{item.accountLast4 ?? '—'}</Body>
      <Body>Reference {item.reference ?? '—'}</Body>
      <Body>Source {provider?.name ?? item.providerId ?? 'Not named'} · {item.rail ?? 'unspecified rail'}</Body>
      <Caption>Confidence {Math.round(item.confidence * 100)}%. Provider names are not verified bank integrations.</Caption>
    </View>
    {item.rawBody ? <View style={{ marginBottom: 16 }}><SmsSlip transaction={item} /></View> : <Caption>Message text was not kept. Parsed fields are still here.</Caption>}
    <View style={{ gap: 8, marginTop: 12 }}>
      <Action title={busy ? 'Saving…' : 'Save'} disabled={busy} onPress={() => void save(item.status === 'manual' ? 'manual' : 'auto')} />
      {item.status !== 'ignored' ? <Action title="Ignore" variant="ghost" disabled={busy} onPress={() => void save('ignored')} /> : null}
    </View>
  </Screen>;
}
