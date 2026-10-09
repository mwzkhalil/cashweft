import React, { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen, Action, Body, Caption } from '@/ui/Kit';
import { BrandLockup } from '@/ui/Logo';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { canReadSms } from '@/lib/sms';

export default function Onboarding() {
  const p = usePalette();
  const { enableSms, setPreference } = useLedger();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const sms = canReadSms();
  async function finish(readSms: boolean) {
    setBusy(true);
    setFailure(null);
    try {
      if (readSms) {
        const granted = await enableSms();
        if (!granted) Alert.alert('Permission not granted', 'You can add expenses manually and turn on SMS reading later.');
      }
      await setPreference('onboardingDone', true);
      router.replace('/(tabs)/home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Try again.';
      setFailure(message);
      if (Platform.OS !== 'web') Alert.alert('Could not continue', message);
    } finally { setBusy(false); }
  }
  return <Screen><View style={{ flex: 1, minHeight: 640, paddingTop: 28, paddingBottom: 26, justifyContent: 'space-between' }}>
    <View style={{ alignItems: 'center', paddingTop: 28 }}>
      <BrandLockup size={96} />
      <Text style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 38, color: p.ink, marginTop: 28, textAlign: 'center' }}>Welcome to Cashweft</Text>
      <Body muted style={{ marginTop: 14, textAlign: 'center' }}>A private, local-first ledger for understanding your money in Pakistan. It stays on this phone. There is no account to create.</Body>
    </View>
    <View style={{ gap: 12, paddingTop: 20 }}>
      <Caption>No bank login. No cloud assistant. Backup is optional.</Caption>
      <Action title={busy ? 'One moment…' : sms ? 'Read my bank SMS' : 'Get started'} onPress={() => void finish(sms)} disabled={busy} />
      {failure ? <Text accessibilityRole="alert" style={{ color: p.debit, fontFamily: fonts.body }}>{failure}</Text> : null}
      {sms ? <Pressable accessibilityRole="button" onPress={() => void finish(false)} disabled={busy} style={{ paddingVertical: 12, alignItems: 'center' }}><Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: p.ink }}>Start with manual entries</Text></Pressable> : null}
    </View>
  </View></Screen>;
}
