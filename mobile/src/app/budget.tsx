import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Action, Screen, ScreenHead } from '@/ui/Kit';
import { CategoryPicker, Field, Note } from '@/ui/Forms';
import { useLedger } from '@/state/LedgerProvider';
import { formatMinor, textToMinor } from '@/lib/money';
import { confirmAction, showMessage } from '@/ui/dialog';

export default function BudgetEditor() {
  const params = useLocalSearchParams<{ category?: string }>();
  const { budgets, categories, setBudget, removeBudget } = useLedger();
  const existing = budgets.find(item => item.category === params.category);
  const [category, setCategory] = useState(existing?.category ?? params.category ?? categories[0] ?? 'Groceries');
  const [amount, setAmount] = useState(existing ? formatMinor(existing.amountMinor) : '');
  const [busy, setBusy] = useState(false);
  async function save() {
    const minor = textToMinor(amount);
    if (minor === null) { showMessage('Check the budget', 'Enter an amount above zero.'); return; }
    setBusy(true);
    try { await setBudget(category, minor); if (existing && category !== existing.category) await removeBudget(existing.category); router.back(); }
    catch (e) { showMessage('Check the budget', e instanceof Error ? e.message : 'Try again.'); }
    finally { setBusy(false); }
  }
  return <Screen><ScreenHead title={existing ? 'Edit budget' : 'Set a budget'} back /><View style={{ gap: 18, marginTop: 8 }}>
    <CategoryPicker value={category} onChange={value => { setCategory(value); const other = budgets.find(item => item.category === value); setAmount(other ? String(other.amountMinor / 100) : amount); }} />
    <Field label="Monthly amount in rupees" value={amount} onChangeText={setAmount} numeric placeholder="5000" />
    <Note>Resets with the calendar month. Past entries stay in the ledger.</Note>
    <Action title={busy ? 'Saving…' : 'Save budget'} disabled={busy} onPress={() => void save()} />
    {existing ? <Action title="Remove budget" variant="ghost" onPress={() => confirmAction('Remove budget?', 'Transactions stay as they are.', 'Remove', () => void removeBudget(existing.category).then(() => router.back()).catch(() => showMessage('Could not remove budget', 'Try again.')))} /> : null}
  </View></Screen>;
}
