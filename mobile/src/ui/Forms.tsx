import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { Category } from '@/lib/model';
import { useLedger } from '@/state/LedgerProvider';
import { Caption, Label } from './Kit';
import { CategoryIcon } from './CategoryIcon';
import { fonts, usePalette } from './theme';

export function Field({ label, value, onChangeText, placeholder, numeric = false, multiline = false, autoCapitalize = 'sentences' }: {
  label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; numeric?: boolean; multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const p = usePalette();
  return <View style={{ gap: 8 }}><Label>{label}</Label><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={p.muted}
    keyboardType={numeric ? 'decimal-pad' : 'default'} multiline={multiline} autoCapitalize={autoCapitalize} selectionColor={p.focus}
    style={{ minHeight: multiline ? 135 : 50, paddingHorizontal: 14, paddingVertical: 12, textAlignVertical: multiline ? 'top' : 'center', borderRadius: 11,
      borderWidth: 1, borderColor: p.strongLine, color: p.ink, backgroundColor: p.surface, fontFamily: multiline ? fonts.monoRegular : fonts.body, fontSize: 15, lineHeight: multiline ? 21 : undefined }} /></View>;
}

export function CategoryPicker({ value, onChange, recent, label = 'Category', moreLabel = 'All categories' }: { value: Category; onChange: (category: Category) => void; recent?: string[]; label?: string; moreLabel?: string }) {
  const p = usePalette();
  const { categories } = useLedger();
  const [all, setAll] = useState(!recent);
  const full = categories.includes(value) ? categories : [value, ...categories];
  const short = [...new Set([value, ...(recent ?? []), 'Groceries', 'Food and Restaurants', 'Transport', 'Utilities', 'Shopping', 'Other'])].filter(item => full.includes(item)).slice(0, 6);
  const options = all ? full : short;
  return <View style={{ gap: 8 }}><Label>{label}</Label><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
    {options.map(category => <Pressable accessibilityRole="radio" accessibilityState={{ checked: value === category }} accessibilityLabel={category} key={category} onPress={() => onChange(category)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingStart: 6, paddingEnd: 12, borderRadius: 24,
      backgroundColor: value === category ? p.marigoldSoft : p.surface, borderWidth: value === category ? 2 : 1, borderColor: value === category ? p.marigold : p.line }}><CategoryIcon category={category} size={32} /><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: p.ink }}>{category}</Text></Pressable>)}
    {!all ? <Pressable accessibilityRole="button" onPress={() => setAll(true)} style={{ minHeight: 48, paddingHorizontal: 12, justifyContent: 'center' }}><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: p.marigold }}>{moreLabel}</Text></Pressable> : null}
  </View></View>;
}

export function Note({ children }: { children: React.ReactNode }) { return <Caption style={{ lineHeight: 19 }}>{children}</Caption>; }
