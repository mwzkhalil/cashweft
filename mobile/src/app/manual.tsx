import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Screen, ScreenHead } from '@/ui/Kit';
import { CategoryPicker, Field } from '@/ui/Forms';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import type { Direction, TransactionType } from '@/lib/model';
import { showMessage } from '@/ui/dialog';

export default function Manual() {
  const p = usePalette();
  const { addManual } = useLedger();
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [direction, setDirection] = useState<Direction>('debit');
  const [kind, setKind] = useState<TransactionType>('expense');
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try {
      await addManual(merchant, amount, direction, category, Date.now(), kind);
      router.back();
    } catch (e) { showMessage('Check the entry', e instanceof Error ? e.message : 'Try again.'); }
    finally { setSaving(false); }
  }
  return <Screen><ScreenHead title="Add an entry" back />
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
      {(['debit', 'credit'] as const).map(value => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: direction === value }} onPress={() => { setDirection(value); setKind(value === 'credit' ? 'income' : 'expense'); }} style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 10, backgroundColor: direction === value ? p.leaf : p.surface }}><Text style={{ fontFamily: fonts.bodyMedium, color: direction === value ? p.onLeaf : p.ink }}>{value === 'debit' ? 'Out' : 'In'}</Text></Pressable>)}
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
      {(['expense', 'income', 'refund', 'cash_withdrawal', 'fee', 'adjustment'] as const).map(value => <Pressable key={value} accessibilityRole="radio" onPress={() => setKind(value)} style={{ minHeight: 40, paddingHorizontal: 10, justifyContent: 'center', borderRadius: 9, backgroundColor: kind === value ? p.marigoldSoft : p.surface }}><Text style={{ fontFamily: fonts.body, color: p.ink }}>{value.replaceAll('_', ' ')}</Text></Pressable>)}
    </View>
    <View style={{ gap: 18 }}>
      <Field label="Amount in rupees" value={amount} onChangeText={setAmount} numeric placeholder="0.00" />
      <Field label="Name or place" value={merchant} onChangeText={setMerchant} placeholder="Merchant" />
      <CategoryPicker value={category} onChange={setCategory} />
      <Action title={saving ? 'Saving…' : 'Save entry'} disabled={saving} onPress={() => void save()} />
    </View>
  </Screen>;
}
