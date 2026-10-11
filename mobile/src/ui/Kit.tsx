import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import type { Category, Transaction } from '@/lib/model';
import { money, signedMoney, timeLabel } from '@/lib/format';
import { brand } from './brand';
import { CategoryIcon } from './CategoryIcon';
import { colorForCategory, fonts, usePalette } from './theme';
import type { Palette } from './theme';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { CONTENT_MAX, screenBottomPadding } from './layout';
import { useLayout } from './useLayout';
import { isMove } from '@/finance/accounting/summary';
import { durations, useReducedMotion } from './motion';

export function Body({ children, muted = false, style }: { children: React.ReactNode; muted?: boolean; style?: object }) {
  const p = usePalette();
  return <Text style={[{ fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: muted ? p.muted : p.ink }, style]}>{children}</Text>;
}

export function Label({ children, style }: { children: React.ReactNode; style?: object }) {
  const p = usePalette();
  return <Text style={[{ fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 19, color: p.ink }, style]}>{children}</Text>;
}

export function Caption({ children, style, numberOfLines }: { children: React.ReactNode; style?: object; numberOfLines?: number }) {
  const p = usePalette();
  return <Text numberOfLines={numberOfLines} style={[{ fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: p.muted }, style]}>{children}</Text>;
}

export function Title({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  const p = usePalette();
  return <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: compact ? 25 : 36, lineHeight: compact ? 31 : 40, color: p.ink, letterSpacing: -.5 }}>{children}</Text>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const p = usePalette();
  return <Text accessibilityRole="header" style={{ fontFamily: fonts.displayMedium, fontSize: 18, color: p.ink, lineHeight: 24 }}>{children}</Text>;
}

export function Screen({ children, scroll = true, inset = true, tab = false }: { children: React.ReactNode; scroll?: boolean; inset?: boolean; tab?: boolean }) {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const bottom = screenBottomPadding(tab, insets.bottom);
  const frame = { width: '100%' as const, maxWidth: CONTENT_MAX, alignSelf: 'center' as const, paddingHorizontal: inset ? wide ? 24 : 16 : 0, paddingBottom: bottom };
  return <SafeAreaView edges={tab && wide ? ['top', 'right'] : ['top', 'left', 'right']} style={{ flex: 1, backgroundColor: p.bg }}>
    {scroll ? <ScrollView contentContainerStyle={[frame, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled">{children}</ScrollView>
      : <View style={[frame, { flex: 1 }]}>{children}</View>}
  </SafeAreaView>;
}

type HeadAction = { icon: IconName; label: string; onPress: () => void; primary?: boolean };

export function IconButton({ icon, label, onPress, primary = false, disabled = false }: HeadAction & { disabled?: boolean }) {
  const p = usePalette();
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} hitSlop={4}
    style={({ pressed }) => ({ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: primary ? p.marigold : 'transparent', opacity: disabled ? .45 : pressed ? .8 : 1 })}>
    <Icon name={icon} color={primary ? p.onMarigold : p.ink} size={22} />
  </Pressable>;
}

export function ScreenHead({ title, back = false, action, actions, caption, onCaption }: { title: string; back?: boolean; action?: HeadAction; actions?: HeadAction[]; caption?: string; onCaption?: () => void }) {
  const p = usePalette();
  const buttons = actions ?? (action ? [action] : []);
  return <View style={{ paddingTop: back ? 8 : 14, paddingBottom: 14 }}>
    <View style={{ minHeight: back || buttons.length ? 48 : 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {back ? <View style={{ marginStart: -12 }}><IconButton icon="back" label="Back" onPress={() => router.back()} /></View> : caption ? <Pressable disabled={!onCaption} onPress={onCaption} accessibilityRole={onCaption ? 'button' : 'text'} style={{ minHeight: 48, justifyContent: 'center', flexShrink: 1 }}><Caption numberOfLines={1}>{caption}</Caption></Pressable> : <View />}
      {buttons.length ? <View style={{ flexDirection: 'row', gap: 4, marginEnd: -4 }}>{buttons.map(item => <IconButton key={item.label} {...item} />)}</View> : null}
    </View>
    <Title compact={back}>{title}</Title>
    {back && caption ? <Caption style={{ marginTop: 4, color: p.muted }}>{caption}</Caption> : null}
  </View>;
}

export function Chip({ label, selected, onPress, count }: { label: string; selected: boolean; onPress: () => void; count?: number }) {
  const p = usePalette();
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected }} accessibilityLabel={count ? `${label}, ${count}` : label} onPress={onPress}
    style={{ minHeight: 48, justifyContent: 'center' }}>
    <View style={{ minHeight: 36, paddingHorizontal: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: selected ? p.marigold : p.surface, borderWidth: selected ? 0 : 1, borderColor: p.line }}>
      {selected ? <Icon name="check" color={p.onMarigold} size={14} /> : null}
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: selected ? p.onMarigold : p.ink }}>{label}</Text>
      {count ? <View style={{ minWidth: 20, height: 20, paddingHorizontal: 5, borderRadius: 10, backgroundColor: selected ? p.onMarigold : p.review, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: selected ? p.marigold : p.bg }}>{count > 99 ? '99+' : count}</Text></View> : null}
    </View>
  </Pressable>;
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="tablist" contentContainerStyle={{ gap: 8, paddingEnd: 8 }} style={{ flexGrow: 0 }}>{children}</ScrollView>;
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  const p = usePalette();
  return <View accessibilityRole="tablist" style={{ flexDirection: 'row', padding: 4, backgroundColor: p.sunk, borderRadius: 14, gap: 4 }}>
    {options.map(option => <Pressable key={option.value} accessibilityRole="tab" accessibilityState={{ selected: value === option.value }} onPress={() => onChange(option.value)}
      style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: value === option.value ? p.surface : 'transparent' }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: value === option.value ? p.ink : p.muted }}>{option.label}</Text>
    </Pressable>)}
  </View>;
}

export function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  const p = usePalette();
  return <View style={{ marginTop: 20 }}>
    {title ? <Caption style={{ marginBottom: 6, marginStart: 4, fontFamily: fonts.bodyMedium }}>{title}</Caption> : null}
    <View style={{ backgroundColor: p.surface, borderRadius: 16, overflow: 'hidden' }}>{children}</View>
  </View>;
}

export function ListRow({ icon, title, value, onPress, last = false, tone }: { icon?: IconName; title: string; value?: string; onPress?: () => void; last?: boolean; tone?: 'review' }) {
  const p = usePalette();
  const body = <>
    {icon ? <Icon name={icon} color={tone === 'review' ? p.review : p.marigold} size={22} /> : null}
    <Text numberOfLines={2} style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: p.ink }}>{title}</Text>
    {value ? <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 14, color: p.muted, maxWidth: '45%' }}>{value}</Text> : null}
    {onPress ? <Icon name="chevron" color={p.muted} size={18} /> : null}
  </>;
  const style = { minHeight: 52, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: p.line };
  return onPress ? <Pressable accessibilityRole="button" accessibilityLabel={value ? `${title}, ${value}` : title} onPress={onPress} style={({ pressed }) => [style, { backgroundColor: pressed ? p.sunk : 'transparent' }]}>{body}</Pressable> : <View style={style}>{body}</View>;
}

export function SwitchRow({ title, value, onChange, last = false }: { title: string; value: boolean; onChange: (value: boolean) => void; last?: boolean }) {
  const p = usePalette();
  return <View style={{ minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: p.line }}>
    <Text style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: p.ink }}>{title}</Text>
    <Switch accessibilityLabel={title} value={value} onValueChange={onChange} trackColor={{ false: p.line, true: p.leaf }} thumbColor={value ? p.onLeaf : p.muted} />
  </View>;
}

export function AttentionRow({ icon, title, onPress, tone }: { icon: IconName; title: string; onPress: () => void; tone?: 'review' }) {
  const p = usePalette();
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={onPress}
    style={({ pressed }) => ({ minHeight: 52, marginTop: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, backgroundColor: tone === 'review' ? p.marigoldSoft : p.surface, borderStartWidth: tone === 'review' ? 3 : 0, borderStartColor: p.review, opacity: pressed ? .85 : 1 })}>
    <Icon name={icon} color={tone === 'review' ? p.review : p.marigold} size={22} />
    <Text numberOfLines={2} style={{ flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: p.ink }}>{title}</Text>
    <Icon name="chevron" color={p.muted} size={18} />
  </Pressable>;
}

function actionColors(variant: 'primary' | 'secondary' | 'ghost' | 'leaf', p: Palette) {
  return {
    primary: { backgroundColor: p.marigold, color: p.onMarigold },
    leaf: { backgroundColor: p.leaf, color: p.onLeaf },
    secondary: { backgroundColor: p.surface, color: p.ink },
    ghost: { backgroundColor: 'transparent', color: p.ink },
  }[variant];
}

export function Action({ title, onPress, icon, variant = 'primary', disabled = false, compact = false, accessibilityLabel }: {
  title: string; onPress: () => void; icon?: IconName; variant?: 'primary' | 'secondary' | 'ghost' | 'leaf'; disabled?: boolean; compact?: boolean; accessibilityLabel?: string;
}) {
  const p = usePalette();
  const { backgroundColor, color } = actionColors(variant, p);
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [{ minHeight: compact ? 38 : 48, paddingHorizontal: compact ? 12 : 18, borderRadius: 12,
      backgroundColor, borderWidth: variant === 'secondary' ? 1 : 0, borderColor: p.strongLine,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
      opacity: disabled ? .45 : pressed ? .82 : 1 }]}>
    {icon ? <Icon name={icon} color={color} size={18} /> : null}
    <Text style={{ fontFamily: fonts.bodyMedium, fontSize: compact ? 13 : 15, color }}>{title}</Text>
  </Pressable>;
}

export function CategoryDot({ category, size = 8 }: { category: Category; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colorForCategory(category) }} />;
}

export function CategoryChip({ category, onPress }: { category: Category; onPress?: () => void }) {
  const p = usePalette();
  const inner = <><CategoryDot category={category} /><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, color: p.ink }}>{category}</Text></>;
  const style = { flexDirection: 'row' as const, alignItems: 'center' as const, alignSelf: 'flex-start' as const, gap: 6,
    minHeight: 27 };
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={category} style={style}>{inner}</Pressable>
    : <View style={style}>{inner}</View>;
}

export function TransactionRow({ transaction, grouping }: { transaction: Transaction; grouping?: 'international' | 'southAsian' }) {
  const p = usePalette();
  const t = transaction;
  const moved = isMove(t);
  const ignored = t.status === 'ignored';
  const review = t.status === 'review';
  const kind = moved ? 'moved' : t.direction === 'debit' ? 'spent' : 'received';
  const amount = moved ? money(t.amountMinor, t.currency, grouping) : signedMoney(t.amountMinor, t.direction, t.currency, false, grouping);
  return <Pressable onPress={() => router.push({ pathname: '/transaction/[id]', params: { id: t.id } })}
    accessibilityRole="button" accessibilityLabel={`${t.merchant}, ${kind} ${money(t.amountMinor, t.currency, grouping)}, ${t.category}${review ? ', needs review' : ''}${ignored ? ', ignored' : ''}`}
    style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingVertical: 10, paddingHorizontal: 8, marginHorizontal: -8,
      gap: 12, borderRadius: 12, backgroundColor: review ? p.marigoldSoft : pressed ? p.surface : 'transparent', borderStartWidth: review ? 3 : 0, borderStartColor: p.review, opacity: ignored ? .6 : 1 }]}>
    {moved ? <View style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: p.line, alignItems: 'center', justifyContent: 'center' }}><Icon name="threads" color={p.muted} size={18} /></View> : <CategoryIcon category={t.category} />}
    <View style={{ flex: 1, minWidth: 0 }}>
      <Label style={{ fontSize: 15 }}><Text numberOfLines={1}>{t.merchant}</Text></Label>
      <Caption style={{ marginTop: 2 }} numberOfLines={1}>{review ? 'Needs review' : ignored ? 'Ignored' : moved ? 'Moved' : t.category} · {timeLabel(t.occurredAt)}</Caption>
    </View>
    <Text style={{ fontFamily: fonts.mono, fontSize: 15, color: moved || ignored ? p.muted : t.direction === 'debit' ? p.ink : p.credit, writingDirection: 'ltr', textDecorationLine: ignored ? 'line-through' : 'none' }}>{amount}</Text>
  </Pressable>;
}

function highlightedBody(body: string, p: Palette): React.ReactNode[] {
  const pattern = /((?:PKR|Rs\.?|INR|₹)\s*[\d,]+(?:\.\d{1,2})?|(?:A\/c|Acct|Card)\s*(?:[Xx*·-]+)?\d{3,4}|[\w.+-]+@[\w.-]+)/gi;
  const output: React.ReactNode[] = [];
  let cursor = 0; let match: RegExpExecArray | null;
  while ((match = pattern.exec(body))) {
    if (match.index > cursor) output.push(body.slice(cursor, match.index));
    const isAmount = /^(?:PKR|Rs|INR|₹)/i.test(match[0]);
    output.push(<Text key={match.index} style={isAmount ? { backgroundColor: p.marigoldSoft, color: p.ink, fontFamily: fonts.mono } : { textDecorationLine: 'underline', color: p.ink }}>{match[0]}</Text>);
    cursor = match.index + match[0].length;
  }
  if (cursor < body.length) output.push(body.slice(cursor));
  return output;
}

export function SmsSlip({ transaction, actions }: { transaction: Transaction; actions?: React.ReactNode }) {
  const p = usePalette();
  if (!transaction.rawBody) return null;
  return <View style={{ backgroundColor: p.surface, borderRadius: 20, borderWidth: 1, borderColor: transaction.status === 'review' ? p.marigold : p.line, overflow: 'hidden' }}>
    <View style={{ paddingHorizontal: 15, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><Icon name="sms" color={p.muted} size={15} /><Text style={{ fontFamily: fonts.mono, fontSize: 12, color: p.muted }}>{transaction.sender}</Text></View>
      <Caption>{timeLabel(transaction.occurredAt)}</Caption>
    </View>
    <View style={{ margin: 12, padding: 12, backgroundColor: p.sunk, borderRadius: 12 }}>
      <Text selectable style={{ fontFamily: fonts.monoRegular, fontSize: 12, lineHeight: 19, color: p.ink }}>{highlightedBody(transaction.rawBody, p)}</Text>
    </View>
    <View style={{ marginTop: 9, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: p.line, padding: 15, gap: 9 }}>
      <View style={{ position: 'absolute', top: -8, left: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: p.bg, borderWidth: 1, borderColor: p.line }} />
      <View style={{ position: 'absolute', top: -8, right: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: p.bg, borderWidth: 1, borderColor: p.line }} />
      <Caption>Read as</Caption>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Label style={{ flex: 1 }}><Text numberOfLines={1}>{transaction.merchant}</Text></Label>
        <Text style={{ fontFamily: fonts.mono, color: transaction.direction === 'debit' ? p.debit : p.credit, fontSize: 14, writingDirection: 'ltr' }}>{signedMoney(transaction.amountMinor, transaction.direction, transaction.currency)}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <CategoryChip category={transaction.category} />
        <Caption style={{ color: transaction.status === 'review' ? p.review : p.leaf }}>{transaction.status === 'review' ? 'Needs review' : transaction.status === 'ignored' ? 'Ignored' : 'In ledger'}</Caption>
      </View>
      {actions ? <View style={{ marginTop: 7 }}>{actions}</View> : null}
    </View>
  </View>;
}

export function ProgressBar({ ratio, color, track, height = 6 }: { ratio: number; color: string; track: string; height?: number }) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, ratio));
  const [progress] = useState(() => new Animated.Value(clamped));
  useEffect(() => {
    if (reduceMotion) { progress.setValue(clamped); return; }
    const animation = Animated.timing(progress, { toValue: clamped, duration: durations.fill, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [clamped, progress, reduceMotion]);
  return <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
    <Animated.View style={{ width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), height, borderRadius: height, backgroundColor: color }} />
  </View>;
}

export function SummaryCard({ label, amount, figures, budget, onBudget }: {
  label: string; amount: string;
  figures: { label: string; value: string }[];
  budget?: { ratio: number; text: string; over: boolean };
  onBudget?: () => void;
}) {
  const p = usePalette();
  const bar = budget ? <View style={{ marginTop: 16, gap: 6 }}>
    <ProgressBar ratio={budget.ratio} color={budget.over ? brand.offWhite : brand.mint} track={`${brand.offWhite}40`} />
    <Text style={{ fontFamily: fonts.body, fontSize: 13, color: p.onLeaf }}>{budget.text}</Text>
  </View> : null;
  return <View style={{ backgroundColor: p.leaf, borderRadius: 20, padding: 18 }}>
    <Text style={{ fontFamily: fonts.body, fontSize: 14, color: p.onLeaf }}>{label}</Text>
    <Text adjustsFontSizeToFit numberOfLines={1} style={{ fontFamily: fonts.mono, fontSize: 36, lineHeight: 46, color: p.onLeaf, writingDirection: 'ltr' }}>{amount}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 20, rowGap: 6, marginTop: 6 }}>
      {figures.map(item => <View key={item.label}>
        <Text style={{ fontFamily: fonts.body, fontSize: 13, color: `${brand.offWhite}CC` }}>{item.label}</Text>
        <Text style={{ fontFamily: fonts.mono, fontSize: 15, color: p.onLeaf, writingDirection: 'ltr' }}>{item.value}</Text>
      </View>)}
    </View>
    {bar && onBudget ? <Pressable accessibilityRole="button" accessibilityLabel={budget?.text} onPress={onBudget} style={{ minHeight: 48, justifyContent: 'flex-end' }}>{bar}</Pressable> : bar}
  </View>;
}

export function EmptyState({ title, detail, action }: { title: string; detail?: string; action?: React.ReactNode }) {
  const p = usePalette();
  return <View style={{ paddingVertical: 28, paddingHorizontal: 20, alignItems: 'flex-start', gap: 8, backgroundColor: p.surface, borderRadius: 16 }}>
    <SectionTitle>{title}</SectionTitle>{detail ? <Body muted>{detail}</Body> : null}{action ? <View style={{ marginTop: 8 }}>{action}</View> : null}
  </View>;
}

export function LoadingScreen() {
  const p = usePalette();
  return <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: p.bg }}><ActivityIndicator color={p.marigold} /></SafeAreaView>;
}
