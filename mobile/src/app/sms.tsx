import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Action, Body, Caption, Screen, ScreenHead, SectionTitle } from '@/ui/Kit';
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
  return <Screen>
    <ScreenHead title="SMS & Import" back />
    {sms ? <View style={{ marginTop: 4, padding: 16, borderRadius: 16, backgroundColor: p.surface, gap: 12 }}>
      <SectionTitle>Bank SMS History</SectionTitle>
      <Action title="Import history" onPress={() => router.push('/sms-history')} />
    </View> : <Caption>Paste a message or add an entry. This build has no SMS reader.</Caption>}
    <View style={{ marginTop: 22 }}><SectionTitle>Bank SMS</SectionTitle></View>
    <Stat label="Last check" value={preferences.lastScanAt ? checkLabel(preferences.lastScanAt) : 'Not yet'} />
    <Stat label="History" value={historyLabel} />
    <Stat label="Senders" value={String(senders.filter(item => item.enabled).length)} />
    {job ? <View style={{ marginTop: 16, gap: 8 }}>
      <Body>History import paused</Body>
      <Action title="Continue" accessibilityLabel="Continue history import" onPress={() => router.push({ pathname: '/sms-history', params: { resume: '1' } })} />
    </View> : null}
    <View style={{ marginTop: 18, gap: 10 }}>
      {sms && preferences.readSms ? <Action title="Import older" variant="secondary" onPress={() => router.push('/sms-history')} /> : null}
      {sms && preferences.readSms ? <Action title={busy ? 'Reading messages…' : 'Read new'} variant="secondary" disabled={busy} onPress={() => void scan()} /> : null}
      <Action title="Manage senders" variant="secondary" onPress={() => router.push('/(tabs)/you')} />
      <Action title="Paste a message" variant="ghost" onPress={() => router.push('/import')} />
      <Pressable accessibilityRole="button" onPress={() => router.push('/sms-privacy')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ fontFamily: fonts.bodyMedium, color: p.leaf }}>Processed on this phone.</Text></Pressable>
    </View>
  </Screen>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View style={{ marginTop: 12 }}>
    <Caption>{label}</Caption>
    <Body><Text style={{ writingDirection: 'ltr' }}>{value}</Text></Body>
  </View>;
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
