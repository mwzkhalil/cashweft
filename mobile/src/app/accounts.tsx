import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { Action, Body, Caption, Screen, ScreenHead } from '@/ui/Kit';
import { Field } from '@/ui/Forms';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import type { AccountKind } from '@/lib/model';
import { PROVIDERS } from '@/finance/parser/providers';
import { showMessage } from '@/ui/dialog';

export default function Accounts() {
  const p = usePalette();
  const { accounts, setAccount, removeAccount } = useLedger();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<AccountKind>('bank');
  const [providerId, setProviderId] = useState<string | null>(null);
  const [masked, setMasked] = useState('');
  const [isOwn, setIsOwn] = useState(true);
  async function save() {
    if (!name.trim()) { showMessage('Name the account', 'Use a label you will recognize.'); return; }
    try {
      await setAccount({ id: randomUUID(), name, kind, providerId, maskedId: masked.trim() || null, isOwn, createdAt: Date.now() });
      setName(''); setMasked('');
    } catch (e) { showMessage('Could not save', e instanceof Error ? e.message : 'Try again.'); }
  }
  return <Screen><ScreenHead title="Accounts" back />
    <Body muted>Mark accounts as yours before Cashweft will treat a pair as your own transfer. Ownership is never guessed.</Body>
    <View style={{ gap: 12, marginTop: 16 }}>
      {accounts.map(account => <View key={account.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: p.line, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}><Text style={{ fontFamily: fonts.bodyMedium, color: p.ink }}>{account.name}</Text><Caption>{account.kind} · {account.isOwn ? 'Yours' : 'Not yours'}{account.maskedId ? ` · ··${account.maskedId}` : ''}</Caption></View>
        {account.id !== 'cash-wallet' ? <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${account.name}`} onPress={() => void removeAccount(account.id)}><Text style={{ color: p.debit }}>Remove</Text></Pressable> : null}
      </View>)}
      <Field label="Name" value={name} onChangeText={setName} placeholder="HBL current" />
      <View style={{ flexDirection: 'row', gap: 8 }}>{(['bank', 'wallet', 'cash'] as const).map(value => <Pressable key={value} accessibilityRole="radio" onPress={() => setKind(value)} style={{ minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10, backgroundColor: kind === value ? p.leaf : p.surface }}><Text style={{ color: kind === value ? p.onLeaf : p.ink }}>{value}</Text></Pressable>)}</View>
      <Field label="Last 4, optional" value={masked} onChangeText={setMasked} placeholder="3381" />
      <View style={{ flexDirection: 'row', alignItems: 'center' }}><View style={{ flex: 1 }}><Body>This account is mine</Body></View><Switch accessibilityLabel="This account is mine" value={isOwn} onValueChange={setIsOwn} /></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PROVIDERS.filter(item => item.kind !== 'rail').slice(0, 8).map(item => <Pressable key={item.id} onPress={() => setProviderId(item.id)} style={{ paddingHorizontal: 10, minHeight: 40, justifyContent: 'center', borderRadius: 8, backgroundColor: providerId === item.id ? p.marigoldSoft : p.surface }}><Text style={{ color: p.ink }}>{item.name}</Text></Pressable>)}
      </View>
      <Caption>Names help you label an account. They are not a connection to the bank.</Caption>
      <Action title="Save account" onPress={() => void save()} />
    </View>
  </Screen>;
}
