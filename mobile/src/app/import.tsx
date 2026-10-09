import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Action, Body, Caption, Screen, ScreenHead, SmsSlip } from '@/ui/Kit';
import { Field, Note } from '@/ui/Forms';
import { parseBankSms } from '@/lib/parser';
import { addTransaction } from '@/lib/database';
import { useLedger } from '@/state/LedgerProvider';
import type { Transaction } from '@/lib/model';
import { showMessage } from '@/ui/dialog';
import { categoryFromMemory } from '@/finance/accounting/corrections';
import { retainedBody } from '@/finance/parser/privacy';

export default function ImportSms() {
  const { refresh, preferences, corrections } = useLedger();
  const [body, setBody] = useState('');
  const [sender, setSender] = useState('');
  const [candidate, setCandidate] = useState<Transaction | null>(null);
  const [busy, setBusy] = useState(false);
  async function parse() {
    const parsed = parseBankSms(body);
    if (!parsed) { showMessage('No transaction found', 'Use a settled debit or credit with an amount. OTPs, failures, and promotions are skipped.'); return; }
    const now = Date.now();
    const sourceHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${sender.trim()}\n${body.trim()}`);
    setCandidate({
      id: Crypto.randomUUID(), sourceHash, sender: sender.trim() || 'Pasted SMS', rawBody: retainedBody(body, true),
      occurredAt: parsed.occurredAt ?? now, merchant: parsed.merchant, amountMinor: parsed.amountMinor, currency: parsed.currency,
      direction: parsed.direction, transactionType: parsed.transactionType,
      category: categoryFromMemory(parsed.merchant, parsed.category, corrections), status: 'review',
      accountLast4: parsed.accountLast4, reference: parsed.reference, confidence: parsed.confidence,
      providerId: parsed.providerId, accountId: null, counterpartyAccountId: null, rail: parsed.rail, createdAt: now, updatedAt: now,
    });
  }
  async function save() {
    if (!candidate) return;
    setBusy(true);
    try {
      const stored = preferences.retainRawSms ? candidate : { ...candidate, rawBody: null };
      const added = await addTransaction(stored);
      await refresh();
      if (!added) showMessage('Already in your ledger', 'This message was already imported.');
      router.replace('/(tabs)/inbox');
    } catch (e) { showMessage('Could not save', e instanceof Error ? e.message : 'Try again.'); }
    finally { setBusy(false); }
  }
  return <Screen><ScreenHead title="Paste a message" back /><Body muted>Only the text you paste is read. It works without SMS permission.</Body>
    <View style={{ gap: 16, marginTop: 18 }}>
      <Field label="Sender (optional)" value={sender} onChangeText={setSender} placeholder="Sender ID" autoCapitalize="characters" />
      <Field label="Message" value={body} onChangeText={value => { setBody(value); setCandidate(null); }} placeholder="Paste a debit or credit message" multiline />
      <Note>The preview keeps the text on screen. It is stored only if Keep message text is on.</Note>
      <Action title="Read this message" onPress={() => void parse()} />
      {candidate ? <View style={{ gap: 12 }}><Caption>Preview</Caption><SmsSlip transaction={candidate} /><Action title={busy ? 'Saving…' : 'Add for review'} disabled={busy} onPress={() => void save()} /></View> : null}
    </View>
  </Screen>;
}
