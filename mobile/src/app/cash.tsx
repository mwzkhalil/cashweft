import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Body, Caption, Screen, ScreenHead } from '@/ui/Kit';
import { CategoryPicker, Field } from '@/ui/Forms';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { CASH_ACCOUNT_ID } from '@/lib/model';
import { money } from '@/lib/format';
import { cashEstimate } from '@/finance/accounting/ledger';
import { textToMinor } from '@/lib/money';
import { showMessage } from '@/ui/dialog';

export default function Cash() {
  const p = usePalette();
  const { transactions, adjustments, preferences, setPreference, addManual, addAdjustment } = useLedger();
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [note, setNote] = useState('');
  const [adjust, setAdjust] = useState('');
  const estimate = cashEstimate(transactions.filter(item => item.currency === 'PKR'), adjustments);
  async function spend() {
    try { await addManual(merchant, amount, 'debit', category, Date.now(), 'expense', CASH_ACCOUNT_ID); setMerchant(''); setAmount(''); }
    catch (e) { showMessage('Check the cash entry', e instanceof Error ? e.message : 'Try again.'); }
  }
  async function reconcile() {
    const counted = textToMinor(adjust);
    if (counted === null) { showMessage('Check the count', 'Enter the cash you counted.'); return; }
    const delta = counted - estimate;
    try { await addAdjustment(delta, note.trim() || 'Counted cash'); setAdjust(''); setNote(''); }
    catch (e) { showMessage('Could not adjust', e instanceof Error ? e.message : 'Try again.'); }
  }
  return <Screen><ScreenHead title="Cash Bridge" back />
    <Body muted>ATM withdrawals add to this estimate. Cash expenses reduce it. This is not a balance from your bank.</Body>
    <Text style={{ fontFamily: fonts.mono, fontSize: 32, color: p.ink, marginTop: 16, writingDirection: 'ltr' }}>{money(estimate, 'PKR', preferences.grouping)}</Text>
    <Caption>Estimated cash remaining</Caption>
    {!preferences.cashBridge ? <View style={{ marginTop: 16 }}><Action title="Turn on Cash Bridge" onPress={() => void setPreference('cashBridge', true)} /></View> : null}
    <View style={{ gap: 14, marginTop: 24 }}>
      <Field label="Cash spent at" value={merchant} onChangeText={setMerchant} placeholder="Shop or rickshaw" />
      <Field label="Amount" value={amount} onChangeText={setAmount} numeric placeholder="0.00" />
      <CategoryPicker value={category} onChange={setCategory} />
      <Action title="Save cash expense" onPress={() => void spend()} />
      <Field label="Cash you counted" value={adjust} onChangeText={setAdjust} numeric placeholder="0.00" />
      <Field label="Note" value={note} onChangeText={setNote} placeholder="Evening count" />
      <Action title="Set estimate from count" variant="secondary" onPress={() => void reconcile()} />
    </View>
  </Screen>;
}
