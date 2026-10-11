import React, { useState } from 'react';
import { Switch, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, Body, Caption, Screen, ScreenHead } from '@/ui/Kit';
import { Field, Note } from '@/ui/Forms';
import { usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { confirmAction, showMessage } from '@/ui/dialog';
import { listSenderHistories, saveSenderHistory } from '@/lib/database';
import { canReadSms } from '@/lib/sms';

export default function SenderEditor() {
  const p = usePalette();
  const { address: paramAddress } = useLocalSearchParams<{ address?: string }>();
  const { senders, setSender, removeSender } = useLedger();
  const existing = senders.find(item => item.address === paramAddress);
  const [address, setAddress] = useState(existing?.address ?? '');
  const [label, setLabel] = useState(existing?.label ?? '');
  const [enabled, setEnabled] = useState(existing?.enabled ?? true);
  const [busy, setBusy] = useState(false);
  const [ask, setAsk] = useState(false);
  const [savedAddress, setSavedAddress] = useState('');
  async function save() {
    const clean = address.trim().toUpperCase();
    if (!/^[A-Z0-9-]{3,25}$/.test(clean) || !label.trim()) { showMessage('Check the sender', 'Enter the sender ID exactly as it appears to you, plus a name.'); return; }
    setBusy(true);
    try {
      await setSender({ address: clean, label: label.trim(), enabled });
      if (existing && existing.address !== clean) await removeSender(existing.address);
      const histories = await listSenderHistories();
      const prior = histories.find(item => item.address.toUpperCase() === clean);
      const needsChoice = enabled && !prior?.lastIncrementalScanAt;
      if (needsChoice && canReadSms()) { setSavedAddress(clean); setAsk(true); return; }
      router.back();
    }
    catch (e) { showMessage('Could not save sender', e instanceof Error ? e.message : 'Try again.'); }
    finally { setBusy(false); }
  }
  async function skipHistory() {
    await saveSenderHistory({ address: savedAddress, oldestImportedAt: null, latestImportedAt: null, historyComplete: false, lastIncrementalScanAt: Date.now() });
    router.back();
  }
  if (ask) return <Screen><ScreenHead title="Sender" back /><View style={{ gap: 10 }}>
    <Body>Import older messages from this sender?</Body>
    <Action title="All available" onPress={() => router.replace({ pathname: '/sms-history', params: { address: savedAddress, choice: 'all' } })} />
    <Action title="1 year" variant="secondary" onPress={() => router.replace({ pathname: '/sms-history', params: { address: savedAddress, choice: '1y' } })} />
    <Action title="90 days" variant="secondary" onPress={() => router.replace({ pathname: '/sms-history', params: { address: savedAddress, choice: '90d' } })} />
    <Action title="No" variant="ghost" onPress={() => void skipHistory()} />
  </View></Screen>;
  return <Screen><ScreenHead title={existing ? 'Sender' : 'Add a sender'} back /><View style={{ gap: 18, marginTop: 8 }}>
    <Field label="Sender ID from your SMS app" value={address} onChangeText={setAddress} autoCapitalize="characters" placeholder="Your bank's sender ID" />
    <Field label="Name" value={label} onChangeText={setLabel} placeholder="HBL" />
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><Body>Read this sender</Body><Caption>Only while SMS reading is on</Caption></View><Switch accessibilityLabel="Read this sender" value={enabled} onValueChange={setEnabled} trackColor={{ false: p.line, true: p.leaf }} /></View>
    <Note>Cashweft does not include verified sender IDs. Add an ID only after you have seen it on a message you trust. Two-letter routing prefixes are ignored when matching.</Note>
    <Action title={busy ? 'Saving…' : 'Save sender'} disabled={busy} onPress={() => void save()} />
    {existing ? <Action title="Remove sender" variant="ghost" onPress={() => confirmAction('Remove sender?', 'Existing entries stay in the ledger.', 'Remove', () => void removeSender(existing.address).then(() => router.back()).catch(() => showMessage('Could not remove sender', 'Try again.')))} /> : null}
  </View></Screen>;
}
