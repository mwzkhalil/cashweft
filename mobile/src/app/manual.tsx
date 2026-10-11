import React, { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Chip, Screen, ScreenHead, Segmented } from '@/ui/Kit';
import { CategoryPicker, Field } from '@/ui/Forms';
import { Icon } from '@/ui/Icon';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import type { Direction, TransactionType } from '@/lib/model';
import { recentCategories, typeLabel, typesFor } from '@/lib/labels';
import { showMessage } from '@/ui/dialog';
import { copy } from '@/i18n/copy';

export default function Manual() {
  const p = usePalette();
  const { addManual, transactions, preferences } = useLedger();
  const t = copy(preferences.language);
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [direction, setDirection] = useState<Direction>('debit');
  const [kind, setKind] = useState<TransactionType>('expense');
  const [more, setMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const recent = recentCategories(transactions, direction);
  function pickDirection(value: Direction) {
    setDirection(value);
    setKind(value === 'credit' ? 'income' : 'expense');
    if (value === 'credit' && category === 'Other') setCategory('Income');
    if (value === 'debit' && category === 'Income') setCategory('Other');
  }
  async function save() {
    setSaving(true);
    try {
      await addManual(merchant, amount, direction, category, Date.now(), kind);
      router.back();
    } catch (e) { showMessage('Check the entry', e instanceof Error ? e.message : 'Try again.'); }
    finally { setSaving(false); }
  }
  return <Screen><ScreenHead title={t.addEntry} back />
    <Segmented<Direction> value={direction} onChange={pickDirection} options={[{ value: 'debit', label: t.spent }, { value: 'credit', label: t.received }]} />
    <View style={{ marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 2, borderBottomColor: p.marigold, paddingBottom: 4 }}>
      <Text style={{ fontFamily: fonts.mono, fontSize: 24, color: p.muted }}>Rs</Text>
      <TextInput accessibilityLabel={t.amount} autoFocus={Platform.OS !== 'web'} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={p.muted} selectionColor={p.focus}
        style={{ flex: 1, minHeight: 56, fontFamily: fonts.mono, fontSize: 36, color: p.ink, writingDirection: 'ltr', textAlign: 'left' }} />
    </View>
    <View style={{ gap: 18, marginTop: 20 }}>
      <Field label={t.nameOrPlace} value={merchant} onChangeText={setMerchant} placeholder="Imtiaz, rickshaw, Ammi" />
      <CategoryPicker value={category} onChange={setCategory} recent={recent} label={t.category} moreLabel={t.allCategories} />
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: more }} onPress={() => setMore(value => !value)} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: p.ink }}>{t.type}: {typeLabel(kind)}</Text>
        <View style={{ transform: [{ rotate: more ? '90deg' : '0deg' }] }}><Icon name="chevron" color={p.muted} size={16} /></View>
      </Pressable>
      {more ? <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 8, marginTop: -12 }}>
        {typesFor(direction).map(value => <Chip key={value} label={typeLabel(value)} selected={kind === value} onPress={() => setKind(value)} />)}
      </View> : null}
      <Action title={saving ? '…' : t.save} disabled={saving || !amount.trim()} onPress={() => void save()} />
    </View>
  </Screen>;
}
