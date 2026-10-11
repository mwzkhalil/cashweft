import React from 'react';
import { Platform, View } from 'react-native';
import { router } from 'expo-router';
import { Caption, Group, ListRow, Screen, ScreenHead, Segmented, SwitchRow } from '@/ui/Kit';
import { useLedger } from '@/state/LedgerProvider';
import { showMessage } from '@/ui/dialog';
import { canReadSms } from '@/lib/sms';
import { APP_VERSION } from '@/lib/version';
import type { ThemeChoice } from '@/lib/model';
import { copy } from '@/i18n/copy';

export default function You() {
  const { preferences, setPreference, enableSms, markLegacyAsPkr, keepLegacyInr } = useLedger();
  const t = copy(preferences.language);
  const sms = canReadSms();
  async function toggleRead(value: boolean) {
    try {
      if (value) { const granted = await enableSms(); if (!granted) showMessage(t.readSms, 'Android needs SMS permission for this.'); }
      else await setPreference('readSms', false);
    } catch (e) { showMessage(t.readSms, e instanceof Error ? e.message : 'Try again.'); }
  }
  return <Screen tab>
    <ScreenHead title={t.you} />
    {preferences.legacyCurrency === 'pending' ? <Group title={t.inrPending}>
      <ListRow icon="lock" title={t.keepInr} onPress={() => void keepLegacyInr()} />
      <ListRow icon="edit" title={t.markPkr} onPress={() => void markLegacyAsPkr()} last />
    </Group> : null}
    <Group title={t.money}>
      <ListRow icon="wallet" title={t.accounts} onPress={() => router.push('/accounts')} />
      <ListRow icon="cash" title={t.cashInHand} onPress={() => router.push('/cash')} />
      <ListRow icon="threads" title={t.moneyPaths} onPress={() => router.push('/threads')} last={!sms} />
      {sms ? <ListRow icon="sms" title={t.bankSms} onPress={() => router.push('/sms')} last /> : null}
    </Group>
    <Group title={t.data}>
      <ListRow icon="cloud" title={t.backup} onPress={() => router.push('/backup')} />
      <ListRow icon="share" title={t.export} onPress={() => router.push('/data')} />
      <ListRow icon="sms" title={t.pasteSms} onPress={() => router.push('/import')} last />
    </Group>
    <Group title={t.preferences}>
      <View style={{ padding: 12, gap: 8 }}>
        <Caption>{t.language}</Caption>
        <Segmented value={preferences.language} onChange={value => void setPreference('language', value)} options={[{ value: 'en', label: t.english }, { value: 'ur', label: t.urdu }]} />
        <Caption style={{ marginTop: 6 }}>{t.theme}</Caption>
        <Segmented<ThemeChoice> value={preferences.theme} onChange={value => void setPreference('theme', value)} options={[{ value: 'system', label: t.system }, { value: 'light', label: t.light }, { value: 'dark', label: t.dark }]} />
      </View>
      <SwitchRow title={t.southAsian} value={preferences.grouping === 'southAsian'} onChange={value => void setPreference('grouping', value ? 'southAsian' : 'international')} />
      <SwitchRow title={t.cashEstimate} value={preferences.cashBridge} onChange={value => void setPreference('cashBridge', value)} />
      <SwitchRow title={t.keepText} value={preferences.retainRawSms} onChange={value => void setPreference('retainRawSms', value)} last={!sms} />
      {sms ? <SwitchRow title={t.readSms} value={preferences.readSms} onChange={value => void toggleRead(value)} /> : null}
      {sms ? <SwitchRow title={t.autoAdd} value={preferences.autoAdd} onChange={value => void setPreference('autoAdd', value)} last /> : null}
    </Group>
    <Group>
      <ListRow icon="info" title={t.about} value={APP_VERSION} onPress={() => router.push('/about')} last />
    </Group>
    {Platform.OS === 'web' ? <Caption style={{ marginTop: 12 }}>{t.webOnly}</Caption> : null}
  </Screen>;
}
