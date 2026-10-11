import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/ui/Icon';
import type { IconName } from '@/ui/Icon';
import { fonts, usePalette } from '@/ui/theme';
import { tabBarHeight } from '@/ui/layout';
import { useLayout } from '@/ui/useLayout';
import { useLedger } from '@/state/LedgerProvider';
import { copy } from '@/i18n/copy';

const TAB_ITEMS: { name: string; key: 'home' | 'activity' | 'insights' | 'you'; icon: IconName }[] = [
  { name: 'home', key: 'home', icon: 'home' },
  { name: 'inbox', key: 'activity', icon: 'inbox' },
  { name: 'insights', key: 'insights', icon: 'insights' },
  { name: 'you', key: 'you', icon: 'you' },
];

export default function TabLayout() {
  const p = usePalette();
  const insets = useSafeAreaInsets();
  const { wide } = useLayout();
  const { preferences, transactions } = useLedger();
  const t = copy(preferences.language);
  const review = transactions.filter(item => item.status === 'review').length;
  const bottom = Math.max(insets.bottom, 8);
  const bar = wide
    ? { backgroundColor: p.surface, borderRightColor: p.line, paddingTop: insets.top + 12, paddingLeft: insets.left, width: 88 + insets.left }
    : { backgroundColor: p.surface, borderTopColor: p.line, height: tabBarHeight(insets.bottom), paddingTop: 6, paddingBottom: bottom, elevation: 0 };
  return <Tabs screenOptions={{ headerShown: false, tabBarPosition: wide ? 'left' : 'bottom', tabBarVariant: wide ? 'material' : 'uikit',
    tabBarActiveTintColor: p.marigold, tabBarInactiveTintColor: p.muted, tabBarLabelPosition: 'below-icon',
    tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 12, marginTop: 2 },
    tabBarStyle: bar, tabBarItemStyle: { minHeight: 48 } }}>
    {TAB_ITEMS.map(item => <Tabs.Screen key={item.name} name={item.name} options={{ title: t[item.key],
      tabBarAccessibilityLabel: item.name === 'inbox' && review ? `${t[item.key]}, ${review} ${t.toReview}` : t[item.key],
      tabBarBadge: item.name === 'inbox' && review ? review > 99 ? '99+' : review : undefined,
      tabBarBadgeStyle: { backgroundColor: p.review, color: p.bg, fontFamily: fonts.bodyMedium, fontSize: 11 },
      tabBarIcon: ({ focused }) => <View style={{ width: 56, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? p.marigoldSoft : 'transparent' }}>
        <Icon name={item.icon} color={focused ? p.marigold : p.muted} size={22} />
      </View> }} />)}
  </Tabs>;
}
