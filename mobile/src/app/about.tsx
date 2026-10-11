import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Body, Caption, Group, ListRow, Screen, ScreenHead } from '@/ui/Kit';
import { BrandLockup } from '@/ui/Logo';
import { fonts, usePalette } from '@/ui/theme';
import { PROVIDERS } from '@/finance/parser/providers';
import { APP_VERSION } from '@/lib/version';

const facts = [
  ['No account', 'Your ledger stays on this phone.'],
  ['Read on the phone', 'SMS, budgets, Money Paths, and Ask run here. Nothing is uploaded.'],
  ['Backup is optional', 'Backups are encrypted on the phone before they leave it.'],
  ['Phone storage', 'The ledger file itself is not encrypted by Cashweft.'],
];

export default function About() {
  const p = usePalette();
  const [banks, setBanks] = useState(false);
  return <Screen><ScreenHead title="About" back />
    <View style={{ alignItems: 'center', marginTop: 4, gap: 8 }}><BrandLockup size={64} /><Caption>Version {APP_VERSION}</Caption></View>
    <Group>
      {facts.map(([title, detail], index) => <View key={title} style={{ padding: 14, gap: 2, borderBottomWidth: index < facts.length - 1 ? 1 : 0, borderBottomColor: p.line }}>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, color: p.ink }}>{title}</Text>
        <Caption>{detail}</Caption>
      </View>)}
    </Group>
    <Group>
      <ListRow icon="info" title="Banks and wallets" value={`${PROVIDERS.length}`} onPress={() => setBanks(value => !value)} last={!banks} />
      {banks ? <View style={{ padding: 14, gap: 8 }}>
        {PROVIDERS.map(item => <Body key={item.id}>{item.name} · <Text style={{ color: p.muted }}>{item.support}</Text></Body>)}
        <Caption>No bank format in this build is verified against live messages.</Caption>
      </View> : null}
    </Group>
  </Screen>;
}
