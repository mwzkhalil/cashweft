import React from 'react';
import { Text, View } from 'react-native';
import { Body, Screen, ScreenHead, SectionTitle } from '@/ui/Kit';
import { BrandLockup } from '@/ui/Logo';
import { fonts, usePalette } from '@/ui/theme';
import { PROVIDERS } from '@/finance/parser/providers';

const principles = [
  ['Privacy First', 'The ledger stays on this phone. Cashweft does not ask for an account.'],
  ['Local by Design', 'Parsing, budgets, and Ask Cashweft run on the device.'],
  ['Secure backup', 'Optional backup is encrypted on this phone. The server stores ciphertext only.'],
];

export default function About() {
  const p = usePalette();
  return <Screen><ScreenHead title="About" back />
    <View style={{ alignItems: 'center', marginTop: 8 }}><BrandLockup size={72} /></View>
    <Body style={{ marginTop: 16, textAlign: 'center' }}>Version 1.0.1</Body>
    <View style={{ marginTop: 22 }}><SectionTitle>How Cashweft works</SectionTitle></View>
    {principles.map(([title, detail]) => <View key={title} style={{ marginTop: 14 }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 16, color: p.ink }}>{title}</Text>
      <Body muted>{detail}</Body>
    </View>)}
    <View style={{ marginTop: 22 }}><SectionTitle>Institution support</SectionTitle></View>
    {PROVIDERS.map(item => <Text key={item.id} style={{ marginTop: 10, color: p.ink, fontFamily: fonts.body }}>{item.name}: {item.support}. {item.evidence}</Text>)}
    <View style={{ marginTop: 22 }}><SectionTitle>On this phone</SectionTitle></View>
    <Body muted>Money Threads connects related entries on this phone. Cashweft’s own checks decide what to show. An optional on-device model is not included in this build, and nothing is uploaded.</Body>
    <Body muted style={{ marginTop: 16 }}>No provider in this build is verified against live bank messages. The local SQLite file is not encrypted by Cashweft.</Body>
  </Screen>;
}
