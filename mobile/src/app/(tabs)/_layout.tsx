import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Icon } from '@/ui/Icon';
import type { IconName } from '@/ui/Icon';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { copy } from '@/i18n/copy';

const items: { name: string; key: 'home' | 'activity' | 'insights' | 'budgets' | 'you'; icon: IconName }[] = [
  { name: 'home', key: 'home', icon: 'home' }, { name: 'inbox', key: 'activity', icon: 'inbox' },
  { name: 'insights', key: 'insights', icon: 'insights' }, { name: 'budgets', key: 'budgets', icon: 'budgets' },
  { name: 'you', key: 'you', icon: 'you' },
];

export default function TabLayout() {
  const p = usePalette();
  const { preferences } = useLedger();
  const t = copy(preferences.language);
  return <Tabs screenOptions={{ headerShown: false, tabBarShowLabel: false,
    tabBarStyle: { backgroundColor: p.surface, borderTopColor: p.line, height: 72, paddingTop: 8, paddingBottom: 8, elevation: 0 },
    tabBarItemStyle: { height: 55 } }}>
    {items.map(item => <Tabs.Screen key={item.name} name={item.name} options={{ title: t[item.key],
      tabBarAccessibilityLabel: t[item.key],
      tabBarIcon: ({ focused }) => <View style={{ alignItems: 'center', gap: 2, minWidth: 64 }}>
        <View style={{ paddingHorizontal: 14, paddingVertical: 3 }}><Icon name={item.icon} color={focused ? p.marigold : p.muted} size={22} /></View>
        <Text style={{ fontFamily: focused ? fonts.bodyMedium : fonts.body, fontSize: 10, color: focused ? p.marigold : p.muted }}>{t[item.key]}</Text>
      </View> }} />)}
  </Tabs>;
}
