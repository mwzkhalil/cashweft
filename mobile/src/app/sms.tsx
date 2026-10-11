import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Body, Caption, Group, ListRow, Screen, ScreenHead } from '@/ui/Kit';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { canReadSms } from '@/lib/sms';
import { dateLabel } from '@/lib/format';
import { listSenderHistories, loadHistoryJob } from '@/lib/database';
import type { HistoryJob, SenderHistory } from '@/lib/model';

export default function SmsSettings() {
  const { preferences, senders, scan, busy } = useLedger();
  const p = usePalette();
  const sms = canReadSms();
  const [histories, setHistories] = useState<SenderHistory[]>([]);
  const [job, setJob] = useState<HistoryJob | null>(null);
  useEffect(() => {
    void listSenderHistories().then(setHistories);
    void loadHistoryJob().then(setJob);
  }, [preferences.lastScanAt]);
  const oldest = histories.map(item => item.oldestImportedAt).filter((item): item is number => item !== null);
  const newest = histories.map(item => item.latestImportedAt).filter((item): item is number => item !== null);
  const historyLabel = oldest.length ? `${stamp(Math.min(...oldest))} → ${stamp(Math.max(...(newest.length ? newest : oldest)))}` : 'Not imported';
  const reading = sms && preferences.readSms;
  return <Screen>
    <ScreenHead title="Bank SMS" back />
    {!sms ? <Caption>This build has no SMS reader. Paste a message or add an entry.</Caption> : null}
    {job ? <View style={{ gap: 8, marginBottom: 8 }}>
      <Body>History import paused</Body>
      <Action title="Continue" accessibilityLabel="Continue history import" onPress={() => router.push({ pathname: '/sms-history', params: { resume: '1' } })} />
    </View> : reading ? <Action title={busy ? 'Reading messages…' : 'Read new messages'} disabled={busy} icon="refresh" onPress={() => void scan()} /> : null}
    <Group>
      <ListRow title="Last check" value={preferences.lastScanAt ? checkLabel(preferences.lastScanAt) : 'Not yet'} />
      <ListRow title="History" value={historyLabel} />
      {reading ? <ListRow icon="download" title="Import older messages" onPress={() => router.push('/sms-history')} /> : null}
      <ListRow icon="sms" title="Paste a message" onPress={() => router.push('/import')} last />
    </Group>
    <Group title="Senders">
      {senders.map(sender => <ListRow key={sender.address} title={sender.label} value={sender.enabled ? 'On' : 'Off'} onPress={() => router.push({ pathname: '/sender', params: { address: sender.address } })} />)}
      <ListRow icon="plus" title="Add a sender" onPress={() => router.push('/sender')} last />
    </Group>
    <Pressable accessibilityRole="link" onPress={() => router.push('/sms-privacy')} style={{ minHeight: 48, justifyContent: 'center', marginTop: 12 }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: p.marigold }}>How SMS reading works</Text>
    </Pressable>
  </Screen>;
}

function stamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  if (today) return 'Today';
  return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(date);
}

function checkLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  return today ? 'Today' : dateLabel(timestamp);
}
