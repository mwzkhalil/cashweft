import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Linking, PermissionsAndroid, Pressable, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Action, Body, Caption, Screen, ScreenHead, SectionTitle } from '@/ui/Kit';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { canReadSms } from '@/lib/sms';
import { addTransactions, listSenders, listSourceHashes, loadHistoryJob, saveHistoryJob, saveSender, saveSenderHistory } from '@/lib/database';
import type { HistoryChoice } from '@/finance/sms/ranges';
import { historyBounds, parseDay } from '@/finance/sms/ranges';
import { importHistory } from '@/finance/sms/importHistory';
import type { ImportCounters } from '@/finance/sms/importHistory';
import { normalizeSender } from '@/finance/sms/page';
import { senderIsRecognised } from '@/finance/sms/discover';
import type { SenderCandidate } from '@/finance/sms/discover';
import { parseBankSms } from '@/lib/parser';
import { retainedBody } from '@/finance/parser/privacy';
import { categoryFromMemory } from '@/finance/accounting/corrections';
import type { HistoryJob, HistoryRange } from '@/lib/model';

const choices: { id: HistoryRange; label: string }[] = [
  { id: '30d', label: '30d' },
  { id: '90d', label: '90d' },
  { id: '1y', label: '1y' },
  { id: 'all', label: 'All' },
];

export default function SmsHistory() {
  const p = usePalette();
  const params = useLocalSearchParams<{ address?: string; choice?: string; resume?: string }>();
  const { preferences, corrections, setPreference, refresh } = useLedger();
  const [step, setStep] = useState<'range' | 'custom' | 'discover' | 'choose' | 'import' | 'done' | 'denied'>('range');
  const [picked, setPicked] = useState<HistoryChoice>(preferences.historyRange);
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [scannedDiscover, setScannedDiscover] = useState(0);
  const [candidates, setCandidates] = useState<SenderCandidate[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<ImportCounters | null>(null);
  const [bounds, setBounds] = useState<{ since: number; until: number } | null>(null);
  const [oldestAt, setOldestAt] = useState<number | null>(null);
  const cancelRef = useRef(false);
  const started = useRef(false);

  const runImport = useCallback(async (addresses: string[], since: number, until: number, choice: HistoryChoice, resume: HistoryJob | null) => {
    cancelRef.current = false;
    setStep('import');
    const native = (await import('../../modules/cashweft-sms/src/CashweftSmsModule')).default;
    const hashes = new Set(await listSourceHashes());
    const spans = new Map<string, { oldest: number; latest: number }>();
    const marked = { index: resume?.senderIndex ?? 0 };
    const result = await importHistory({
      addresses,
      since,
      until,
      pageSize: 400,
      senderIndex: resume?.senderIndex ?? 0,
      cursor: resume?.cursorDate != null && resume.cursorId != null ? { date: resume.cursorDate, id: resume.cursorId } : null,
      scanned: resume?.scanned ?? 0,
      added: resume?.added ?? 0,
      review: resume?.review ?? 0,
      duplicates: resume?.duplicates ?? 0,
      knownHashes: hashes,
      autoAdd: preferences.autoAdd,
      cancelled: () => cancelRef.current,
      parse: parseBankSms,
      digest: value => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value),
      readPage: async request => {
        const page = await native.listMessagesPage({ ...request, senders: request.senders ?? [] });
        const sender = request.senders?.[0];
        if (sender) {
          for (const message of page.messages) {
            const span = spans.get(sender) ?? { oldest: message.receivedAt, latest: message.receivedAt };
            span.oldest = Math.min(span.oldest, message.receivedAt);
            span.latest = Math.max(span.latest, message.receivedAt);
            spans.set(sender, span);
            setOldestAt(current => current === null ? span.oldest : Math.min(current, span.oldest));
          }
        }
        return page;
      },
      insertBatch: async rows => {
        const now = Date.now();
        return addTransactions(rows.map(row => ({
          id: Crypto.randomUUID(),
          sourceHash: row.sourceHash,
          sender: row.sender,
          rawBody: retainedBody(row.body, preferences.retainRawSms),
          occurredAt: row.parsed.occurredAt ?? row.receivedAt,
          merchant: row.parsed.merchant,
          amountMinor: row.parsed.amountMinor,
          currency: row.parsed.currency,
          direction: row.parsed.direction,
          transactionType: row.parsed.transactionType,
          category: categoryFromMemory(row.parsed.merchant, row.parsed.category, corrections),
          status: row.status,
          accountLast4: row.parsed.accountLast4,
          reference: row.parsed.reference,
          confidence: row.parsed.confidence,
          providerId: row.parsed.providerId,
          accountId: null,
          counterpartyAccountId: null,
          rail: row.parsed.rail,
          createdAt: now,
          updatedAt: now,
        })));
      },
      onPage: async state => {
        setProgress({ ...state });
        const job: HistoryJob = {
          addresses, since, until, choice,
          senderIndex: state.senderIndex,
          cursorDate: state.cursor?.date ?? null,
          cursorId: state.cursor?.id ?? null,
          scanned: state.scanned,
          added: state.added,
          review: state.review,
          duplicates: state.duplicates,
        };
        await saveHistoryJob(state.cancelled || state.done ? (state.done ? null : job) : job);
        while (marked.index < state.senderIndex) {
          const address = addresses[marked.index];
          const span = spans.get(address);
          const known = await listSenders();
          if (!known.some(item => item.address.toUpperCase() === address.toUpperCase())) {
            await saveSender({ address, label: address, enabled: true });
          }
          await saveSenderHistory({
            address,
            oldestImportedAt: span?.oldest ?? null,
            latestImportedAt: span?.latest ?? null,
            historyComplete: choice === 'all' && !state.cancelled,
            lastIncrementalScanAt: state.cancelled ? null : until,
          });
          marked.index += 1;
        }
      },
    });
    if (result.done) await saveHistoryJob(null);
    await refresh();
    setProgress(result);
    setStep('done');
  }, [corrections, preferences.autoAdd, preferences.retainRawSms, refresh]);

  useEffect(() => {
    if (!canReadSms()) return;
    if (started.current) return;
    started.current = true;
    void (async () => {
      const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
      if (!granted) { setStep('denied'); return; }
      if (params.resume === '1') {
        const job = await loadHistoryJob();
        if (job) {
          setBounds({ since: job.since, until: job.until });
          setStep('import');
          await runImport(job.addresses, job.since, job.until, job.choice, job);
          return;
        }
      }
      if (params.address && params.choice) {
        const choice = validChoice(params.choice);
        const range = historyBounds(choice, Date.now());
        setPicked(choice);
        setBounds(range);
        setStep('import');
        await runImport([params.address], range.since, range.until, choice, null);
      }
    })();
  }, [params.address, params.choice, params.resume, runImport]);

  async function discover(choice: HistoryChoice, since: number, until: number) {
    setStep('discover');
    setScannedDiscover(0);
    const native = (await import('../../modules/cashweft-sms/src/CashweftSmsModule')).default;
    const grouped = new Map<string, SenderCandidate>();
    let cursor: { date: number; id: number } | null = null;
    let seen = 0;
    do {
      if (cancelRef.current) break;
      const page = await native.discoverFinancialSenders({
        since, until, beforeDate: cursor?.date ?? null, beforeId: cursor?.id ?? null, limit: 400,
      });
      seen += page.examined;
      setScannedDiscover(seen);
      for (const row of page.senders) {
        const key = normalizeSender(row.sender);
        const current = grouped.get(key);
        if (!current) {
          grouped.set(key, {
            sender: row.sender,
            normalized: key,
            count: row.count,
            latestDate: row.latestDate,
            preview: row.preview,
            recognised: senderIsRecognised(row.sender, row.evidence),
          });
        } else current.count += row.count;
      }
      cursor = page.next;
    } while (cursor);
    const found = [...grouped.values()].sort((left, right) => right.count - left.count);
    setCandidates(found);
    setSelected(Object.fromEntries(found.map(item => [item.normalized, item.recognised])));
    setStep('choose');
  }

  function begin(choice: HistoryChoice, custom?: { from: number; to: number }) {
    const range = historyBounds(choice, Date.now(), custom);
    setBounds(range);
    setPicked(choice);
    if (choice !== 'custom') void setPreference('historyRange', choice);
    void setPreference('historyPromptSeen', true);
    cancelRef.current = false;
    void discover(choice, range.since, range.until);
  }

  const chosen = candidates.filter(item => selected[item.normalized]);
  const messageCount = chosen.reduce((sum, item) => sum + item.count, 0);
  const handled = (progress?.added ?? 0) + (progress?.duplicates ?? 0) + (progress?.skipped ?? 0);
  const percent = messageCount > 0 ? Math.min(100, Math.round((handled / messageCount) * 100)) : null;
  const ratio = progress?.done ? 1 : percent !== null ? percent / 100 : 0.2;

  if (!canReadSms()) return <Screen>
    <ScreenHead title="Bank SMS History" back />
    <Body>Android SMS build only.</Body>
    <View style={{ marginTop: 14 }}><Action title="Paste a message" onPress={() => router.push('/import')} /></View>
  </Screen>;

  return <Screen>
    <ScreenHead title="Bank SMS History" back />
    {step === 'denied' ? <View style={{ gap: 12 }}>
      <SectionTitle>SMS access off</SectionTitle>
      <Action title="Open settings" onPress={() => void Linking.openSettings()} />
    </View> : null}
    {step === 'range' ? <View style={{ gap: 12 }}>
      <Caption>Import from</Caption>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {choices.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: picked === item.id }} accessibilityLabel={`Import from ${item.label}`} onPress={() => setPicked(item.id)} style={{ flexGrow: 1, flexBasis: 72, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: picked === item.id ? p.leaf : p.surface }}>
          <Text style={{ fontFamily: fonts.bodyMedium, color: picked === item.id ? p.onLeaf : p.ink, writingDirection: 'ltr' }}>{item.label}</Text>
        </Pressable>)}
      </View>
      <Action title="Custom" variant="secondary" onPress={() => setStep('custom')} />
      <Action title="Continue" onPress={() => begin(picked)} />
    </View> : null}
    {step === 'custom' ? <View style={{ gap: 12 }}>
      <Caption>From</Caption>
      <TextInput accessibilityLabel="From date" value={fromText} onChangeText={setFromText} placeholder="2022-01-01" placeholderTextColor={p.muted} autoCapitalize="none" style={{ minHeight: 48, borderWidth: 1, borderColor: p.line, borderRadius: 12, paddingHorizontal: 14, color: p.ink, fontFamily: fonts.body, writingDirection: 'ltr' }} />
      <Caption>To</Caption>
      <TextInput accessibilityLabel="To date" value={toText} onChangeText={setToText} placeholder="2023-12-31" placeholderTextColor={p.muted} autoCapitalize="none" style={{ minHeight: 48, borderWidth: 1, borderColor: p.line, borderRadius: 12, paddingHorizontal: 14, color: p.ink, fontFamily: fonts.body, writingDirection: 'ltr' }} />
      <Action title="Use these dates" onPress={() => {
        const from = parseDay(fromText, false);
        const to = parseDay(toText, true);
        if (from === null || to === null) return;
        begin('custom', { from, to });
      }} />
    </View> : null}
    {step === 'discover' ? <View style={{ gap: 8 }}>
      <SectionTitle>Finding senders</SectionTitle>
      <Count value={scannedDiscover} label="scanned" />
      <Action title="Cancel" accessibilityLabel="Cancel sender search" variant="secondary" onPress={() => { cancelRef.current = true; router.back(); }} />
    </View> : null}
    {step === 'choose' ? <View style={{ gap: 10 }}>
      <SectionTitle>Found senders</SectionTitle>
      {candidates.length ? candidates.map(item => {
        const on = !!selected[item.normalized];
        return <Pressable key={item.normalized} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`${item.sender}, ${item.count} candidate financial messages, ${on ? 'selected' : 'not selected'}`} onPress={() => setSelected(current => ({ ...current, [item.normalized]: !current[item.normalized] }))} style={{ minHeight: 64, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: p.surface, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: p.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: fonts.bodyMedium, color: p.ink, writingDirection: 'ltr' }}>{initials(item.sender)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ fontFamily: fonts.bodyMedium, color: p.ink, writingDirection: 'ltr' }}>{item.sender}</Text>
            {!item.recognised ? <Caption>Unknown</Caption> : null}
          </View>
          <Text style={{ fontFamily: fonts.mono, color: p.ink, writingDirection: 'ltr' }}>{item.count.toLocaleString('en')}</Text>
          <Text style={{ fontFamily: fonts.bodyMedium, color: on ? p.leaf : p.muted, width: 18 }}>{on ? '✓' : '○'}</Text>
        </Pressable>;
      }) : <Body>No financial messages in this range.</Body>}
      {candidates.some(item => item.recognised) ? <Action title="Select recognised" variant="secondary" onPress={() => setSelected(Object.fromEntries(candidates.map(item => [item.normalized, item.recognised])))} /> : null}
      <Action title={`Import ${messageCount.toLocaleString('en')}`} accessibilityLabel={`Import ${messageCount} messages`} disabled={!chosen.length} onPress={() => {
        if (!bounds) return;
        void runImport(chosen.map(item => item.sender), bounds.since, bounds.until, picked, null);
      }} />
    </View> : null}
    {step === 'import' ? <View style={{ gap: 12 }}>
      <SectionTitle>Importing</SectionTitle>
      <View accessibilityRole="progressbar" accessibilityLabel="History import progress" accessibilityValue={{ min: 0, max: 100, now: percent ?? 0 }} style={{ height: 10, borderRadius: 5, backgroundColor: p.line, overflow: 'hidden', flexDirection: 'row' }}>
        <View style={{ flex: Math.max(ratio, 0.04), backgroundColor: p.leaf }} />
      </View>
      {percent !== null ? <Text style={{ fontFamily: fonts.mono, color: p.ink, writingDirection: 'ltr' }}>{percent}%</Text> : null}
      <Count value={progress?.scanned ?? 0} label="scanned" />
      <Count value={progress?.added ?? 0} label="added" />
      <Count value={progress?.review ?? 0} label="review" />
      {progress?.sender ? <Text style={{ fontFamily: fonts.bodyMedium, color: p.ink, writingDirection: 'ltr' }}>{progress.sender}</Text> : null}
      <Action title="Cancel" accessibilityLabel="Cancel history import" variant="secondary" onPress={() => { cancelRef.current = true; }} />
    </View> : null}
    {step === 'done' && progress ? <View style={{ gap: 10 }}>
      <SectionTitle>{progress.cancelled ? 'Paused' : 'Done ✓'}</SectionTitle>
      <Count value={progress.added} label="added" />
      <Count value={progress.review} label="review" />
      <Count value={progress.skipped} label="skipped" />
      {oldestAt ? <View><Caption>Oldest</Caption><Body><Text style={{ writingDirection: 'ltr' }}>{new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(oldestAt))}</Text></Body></View> : null}
      {progress.review ? <Action title={`Review ${progress.review}`} accessibilityLabel={`Review ${progress.review} transactions`} onPress={() => router.push({ pathname: '/(tabs)/inbox', params: { status: 'review' } })} /> : null}
      {progress.cancelled ? <Action title="Continue" accessibilityLabel="Continue history import" onPress={() => router.replace({ pathname: '/sms-history', params: { resume: '1' } })} /> : <Action title="Done" accessibilityLabel="Close history import" variant="secondary" onPress={() => router.back()} />}
    </View> : null}
  </Screen>;
}

function Count({ value, label }: { value: number; label: string }) {
  const p = usePalette();
  return <Text accessibilityLabel={`${value} ${label}`} style={{ fontFamily: fonts.mono, fontSize: 22, color: p.ink, writingDirection: 'ltr' }}>{value.toLocaleString('en')} <Text style={{ fontFamily: fonts.body, fontSize: 15, color: p.muted }}>{label}</Text></Text>;
}

function initials(name: string): string {
  const letters = name.replace(/[^A-Za-z0-9]/g, '');
  return (letters.slice(0, 2) || '•').toUpperCase();
}

function validChoice(value: string): HistoryChoice {
  if (value === '30d' || value === '90d' || value === '1y' || value === 'all' || value === 'custom') return value;
  return '90d';
}
