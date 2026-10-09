import React from 'react';
import { Platform, Pressable, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Body, Caption, Screen, ScreenHead, SectionTitle } from '@/ui/Kit';
import { Icon } from '@/ui/Icon';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { showMessage } from '@/ui/dialog';
import { canReadSms } from '@/lib/sms';
import { copy } from '@/i18n/copy';
import type { IconName } from '@/ui/Icon';

export default function You() {
  const p = usePalette();
  const { preferences, senders, setPreference, enableSms, markLegacyAsPkr, keepLegacyInr } = useLedger();
  const t = copy(preferences.language);
  async function toggleRead(value: boolean) {
    try {
      if (value) { const granted = await enableSms(); if (!granted) showMessage('Permission needed', 'SMS reading needs Android READ_SMS permission.'); }
      else await setPreference('readSms', false);
    } catch (e) { showMessage('Could not change setting', e instanceof Error ? e.message : 'Try again.'); }
  }
  return <Screen>
    <ScreenHead title={t.you} />
    <Body muted>{t.tagline} The ledger stays on this phone until you choose an encrypted backup.</Body>
    <View style={{ marginTop: 24 }}><SectionTitle>{t.language}</SectionTitle></View>
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
      {(['en', 'ur'] as const).map(language => <Pressable key={language} accessibilityRole="button" onPress={() => void setPreference('language', language)} style={{ minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 10, backgroundColor: preferences.language === language ? p.leaf : p.surface }}><Text style={{ color: preferences.language === language ? p.onLeaf : p.ink, fontFamily: fonts.bodyMedium }}>{language === 'en' ? t.english : t.urdu}</Text></Pressable>)}
    </View>
    <View style={{ marginTop: 22 }}><SectionTitle>Numbers</SectionTitle></View>
    <Setting title="South Asian grouping" detail="Rs. 1,25,000 instead of Rs. 125,000" value={preferences.grouping === 'southAsian'} onChange={value => void setPreference('grouping', value ? 'southAsian' : 'international')} />
    <Setting title="Cash Bridge" detail="Track ATM cash separately from card and wallet spend" value={preferences.cashBridge} onChange={value => void setPreference('cashBridge', value)} />
    <Setting title="Keep message text" detail="Off stores the parsed fields only. On keeps the SMS for review." value={preferences.retainRawSms} onChange={value => void setPreference('retainRawSms', value)} />
    {canReadSms() ? <Setting title="Read bank SMS" detail="Only sender IDs you enable" value={preferences.readSms} onChange={value => void toggleRead(value)} /> : <View style={{ paddingVertical: 12 }}><Body>This build has no SMS reader. Paste a message or add entries yourself.</Body></View>}
    <Setting title="Auto-add when confident" detail="Uncertain reads wait in Activity" value={preferences.autoAdd} onChange={value => void setPreference('autoAdd', value)} />
    {preferences.legacyCurrency === 'pending' ? <View style={{ marginTop: 18, gap: 8 }}><Body>Older entries are marked INR. The amounts are unchanged.</Body><Menu title="Keep them as INR" detail="Do not relabel" icon="lock" onPress={() => void keepLegacyInr()} /><Menu title="Mark them as PKR" detail="Same numbers, no conversion" icon="edit" onPress={() => void markLegacyAsPkr()} /></View> : null}
    <View style={{ marginTop: 22, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}><SectionTitle>Senders</SectionTitle><Pressable accessibilityRole="button" accessibilityLabel="Add a sender" onPress={() => router.push('/sender')}><Icon name="plus" color={p.ink} size={21} /></Pressable></View>
    {senders.length ? senders.map(sender => <Pressable key={sender.address} accessibilityRole="button" onPress={() => router.push({ pathname: '/sender', params: { address: sender.address } })} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.line }}><Text style={{ fontFamily: fonts.bodyMedium, color: p.ink }}>{sender.label}</Text><Caption>{sender.address} · {sender.enabled ? 'On' : 'Paused'}</Caption></Pressable>) : <Caption>No sender IDs yet. Add one you have seen on your own phone. Cashweft does not ship guessed bank IDs.</Caption>}
    <View style={{ marginTop: 22 }}><SectionTitle>Ledger</SectionTitle></View>
    <Menu title="Accounts" detail="Banks, wallets, and cash you own" icon="you" onPress={() => router.push('/accounts')} />
    <Menu title="Cash Bridge" detail="Estimated cash, not a bank balance" icon="budgets" onPress={() => router.push('/cash')} />
    <Menu title="Money Threads" detail="See where money moved, and what was spent" icon="edit" onPress={() => router.push('/threads')} />
    <Menu title="Paste a message" detail="Works without SMS permission" icon="sms" onPress={() => router.push('/import')} />
    <Menu title="Encrypted backup" detail="Optional ciphertext on your API" icon="cloud" onPress={() => router.push('/backup')} />
    <Menu title="Export and import" detail="A JSON copy of this ledger" icon="share" onPress={() => router.push('/data')} />
    <Menu title="About" detail="Version, privacy, and what is not verified" icon="lock" onPress={() => router.push('/about')} />
    {Platform.OS === 'web' ? <Caption>Web data lives in this browser only.</Caption> : null}
  </Screen>;
}

function Setting({ title, detail, value, onChange }: { title: string; detail: string; value: boolean; onChange: (value: boolean) => void }) {
  const p = usePalette();
  return <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: p.line, flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><Body>{title}</Body><Caption>{detail}</Caption></View><Switch accessibilityLabel={title} value={value} onValueChange={onChange} trackColor={{ false: p.line, true: p.leaf }} thumbColor={value ? p.onLeaf : p.muted} /></View>;
}
function Menu({ title, detail, icon, onPress }: { title: string; detail: string; icon: IconName; onPress: () => void }) {
  const p = usePalette();
  return <Pressable accessibilityRole="button" onPress={onPress} style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: p.line, flexDirection: 'row', alignItems: 'center', gap: 12 }}><Icon name={icon} color={p.ink} size={20} /><View style={{ flex: 1 }}><Body>{title}</Body><Caption>{detail}</Caption></View></Pressable>;
}
