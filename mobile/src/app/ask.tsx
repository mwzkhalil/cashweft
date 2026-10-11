import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Action, Caption, Chip, Screen, ScreenHead } from '@/ui/Kit';
import { fonts, usePalette } from '@/ui/theme';
import { useLedger } from '@/state/LedgerProvider';
import { answerQuestion } from '@/finance/assistant/ask';
import { copy } from '@/i18n/copy';

const ASK_CHIPS: { key: 'askSpent' | 'askBiggest' | 'askFood' | 'askCompare' | 'askIncome'; query: string }[] = [
  { key: 'askSpent', query: 'How much did I spend this month?' },
  { key: 'askBiggest', query: 'Biggest expense this month' },
  { key: 'askFood', query: 'How much did I spend on food this month?' },
  { key: 'askCompare', query: 'Compare this month with last month' },
  { key: 'askIncome', query: 'Income this month' },
];

export default function Ask() {
  const p = usePalette();
  const { transactions, preferences } = useLedger();
  const t = copy(preferences.language);
  const [query, setQuery] = useState('');
  const [asked, setAsked] = useState('');
  const [answer, setAnswer] = useState<{ text: string; confident: boolean } | null>(null);
  function ask(text: string, label = text) {
    setAsked(label);
    setAnswer(answerQuestion(text, transactions));
  }
  return <Screen><ScreenHead title={t.ask} back />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: 8 }}>
      {ASK_CHIPS.map(chip => <Chip key={chip.key} label={t[chip.key]} selected={asked === t[chip.key]} onPress={() => ask(chip.query, t[chip.key])} />)}
      {preferences.language === 'en' ? <Chip label="اس مہینے کتنا خرچ ہوا؟" selected={asked === 'اس مہینے کتنا خرچ ہوا؟'} onPress={() => ask('اس مہینے کتنا خرچ ہوا؟')} /> : null}
    </View>
    {answer ? <View accessibilityLiveRegion="polite" style={{ marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: p.surface, gap: 6 }}>
      <Caption>{asked}</Caption>
      <Text style={{ fontFamily: fonts.body, fontSize: 17, lineHeight: 25, color: answer.confident ? p.ink : p.muted }}>{answer.text}</Text>
    </View> : null}
    <View style={{ marginTop: 20, gap: 10 }}>
      <TextInput accessibilityLabel={t.askPlaceholder} value={query} onChangeText={setQuery} placeholder={t.askPlaceholder} placeholderTextColor={p.muted} returnKeyType="search" onSubmitEditing={() => query.trim() && ask(query.trim())}
        style={{ minHeight: 48, borderWidth: 1, borderColor: p.strongLine, borderRadius: 12, paddingHorizontal: 14, color: p.ink, backgroundColor: p.surface, fontFamily: fonts.body, fontSize: 15 }} />
      <Action title={t.answer} variant="secondary" disabled={!query.trim()} onPress={() => ask(query.trim())} />
      <Caption>{t.answeredHere}</Caption>
    </View>
  </Screen>;
}
