import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Body, Screen, ScreenHead } from '@/ui/Kit';
import { Field } from '@/ui/Forms';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { answerQuestion } from '@/finance/assistant/ask';

export default function Ask() {
  const p = usePalette();
  const { transactions } = useLedger();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  return <Screen><ScreenHead title="Ask Cashweft" back />
    <Body muted>Questions are answered on this phone from your ledger. Nothing is sent to a model or a server.</Body>
    <View style={{ gap: 14, marginTop: 18 }}>
      <Field label="Question" value={query} onChangeText={setQuery} placeholder="How much did I spend this month?" />
      <Action title="Answer" onPress={() => setAnswer(answerQuestion(query, transactions).text)} />
      {answer ? <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: p.ink }}>{answer}</Text> : null}
      <Body muted>Try “How much did I spend this month?” or “اس مہینے میرا کتنا خرچ ہوا؟”</Body>
    </View>
  </Screen>;
}
