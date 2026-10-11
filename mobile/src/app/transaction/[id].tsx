import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, Body, Caption, Chip, Group, ListRow, Screen, ScreenHead, SmsSlip } from '@/ui/Kit';
import { CategoryPicker, Field } from '@/ui/Forms';
import { Icon } from '@/ui/Icon';
import { dateLabel, signedMoney, timeLabel } from '@/lib/format';
import type { TransactionStatus, TransactionType } from '@/lib/model';
import { typeLabel, typesFor } from '@/lib/labels';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { showMessage } from '@/ui/dialog';
import { providerById } from '@/finance/parser/providers';

const statusNames: Record<TransactionStatus, string> = { auto: 'From SMS', manual: 'Added by you', review: 'Needs review', ignored: 'Ignored' };

export default function TransactionDetail() {
  const p = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, preferences, setTransaction } = useLedger();
  const item = transactions.find(entry => entry.id === id);
  const [merchant, setMerchant] = useState(item?.merchant ?? '');
  const [category, setCategory] = useState(item?.category ?? 'Other');
  const [kind, setKind] = useState<TransactionType>(item?.transactionType ?? 'expense');
  const [details, setDetails] = useState(false);
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
  const kinds = [...new Set([...typesFor(item.direction), item.transactionType, ...(item.direction === 'debit' ? ['internal_transfer' as const] : [])])];
  return <Screen><ScreenHead title={item.merchant} back caption={`${dateLabel(item.occurredAt)} · ${timeLabel(item.occurredAt)} · ${statusNames[item.status]}`} />
    <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: fonts.mono, fontSize: 32, color: item.direction === 'debit' ? p.ink : p.credit, writingDirection: 'ltr' }}>{signedMoney(item.amountMinor, item.direction, item.currency, true, preferences.grouping)}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, marginTop: 8 }}>
      {kinds.map(value => <Chip key={value} label={typeLabel(value)} selected={kind === value} onPress={() => setKind(value)} />)}
    </View>
    <View style={{ gap: 16, marginVertical: 16 }}><Field label="Name or place" value={merchant} onChangeText={setMerchant} /><CategoryPicker value={category} onChange={setCategory} recent={[item.category]} /></View>
    <Action title={busy ? '…' : item.status === 'review' ? 'Looks right' : 'Save'} disabled={busy} onPress={() => void save(item.status === 'manual' ? 'manual' : 'auto')} />
    {item.status !== 'ignored' ? <View style={{ marginTop: 8 }}><Action title="Not a spend, ignore it" variant="ghost" disabled={busy} onPress={() => void save('ignored')} /></View> : null}
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: details }} onPress={() => setDetails(value => !value)} style={{ minHeight: 48, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: p.ink }}>Details</Text>
      <View style={{ transform: [{ rotate: details ? '90deg' : '0deg' }] }}><Icon name="chevron" color={p.muted} size={16} /></View>
    </Pressable>
    {details ? <>
      <Group>
        <ListRow title="Account" value={item.accountLast4 ? `··${item.accountLast4}` : '—'} />
        <ListRow title="Reference" value={item.reference ?? '—'} />
        <ListRow title="Source" value={provider?.name ?? item.providerId ?? '—'} last />
      </Group>
      {item.rawBody ? <View style={{ marginTop: 12 }}><SmsSlip transaction={item} /></View> : <Caption style={{ marginTop: 12 }}>Message text was not kept.</Caption>}
    </> : null}
  </Screen>;
}
