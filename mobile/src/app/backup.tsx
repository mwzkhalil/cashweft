import React, { useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { Action, Body, Caption, Screen, ScreenHead, SectionTitle } from '@/ui/Kit';
import { Field, Note } from '@/ui/Forms';
import { exportSnapshot, useLedger } from '@/state/LedgerProvider';
import { deleteRemoteBackup, downloadBackup, enableBackup, getRecoveryCode, uploadBackup } from '@/lib/backup';
import { fonts, usePalette } from '@/ui/theme';
import { confirmAction, showMessage } from '@/ui/dialog';

export default function Backup() {
  const p = usePalette();
  const { restore } = useLedger();
  const [code, setCode] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { void getRecoveryCode().then(setCode).catch(() => {}); }, []);
  async function run(action: () => Promise<void>, done: string) {
    setBusy(true);
    try { await action(); showMessage('Done', done); }
    catch (e) { showMessage('Could not finish', e instanceof Error ? e.message : 'Try again.'); }
    finally { setBusy(false); }
  }
  if (Platform.OS === 'web') return <Screen><ScreenHead title="Encrypted backup" back /><Body muted>Backup runs in the installed iOS and Android apps. This browser keeps its own copy.</Body></Screen>;
  return <Screen><ScreenHead title="Encrypted backup" back /><Body muted>The phone encrypts the ledger before upload. The API stores ciphertext only. A recovery code from an earlier version of this app still restores.</Body>
    <View style={{ marginTop: 24, gap: 12 }}><SectionTitle>Recovery code</SectionTitle>
      {code ? <Pressable accessibilityRole="button" accessibilityLabel="Copy recovery code" onPress={() => void Clipboard.setStringAsync(code).then(() => showMessage('Copied', 'Store this code somewhere private.'))} style={{ backgroundColor: p.surface, padding: 14, borderRadius: 12 }}><Text selectable style={{ color: p.ink, fontFamily: fonts.monoRegular, fontSize: 12, lineHeight: 20, writingDirection: 'ltr' }}>{code}</Text><Caption>Tap to copy</Caption></Pressable> : <Action title="Create a recovery code" onPress={() => void run(async () => { setCode(await enableBackup()); }, 'Copy the code and store it privately.')} disabled={busy} />}
      <Note>Anyone with this code can restore the backup. A lost code cannot be recovered by the server. A new upload replaces the previous snapshot.</Note>
      {code ? <Action title={busy ? 'Working…' : 'Back up now'} onPress={() => void run(async () => { await uploadBackup(await exportSnapshot()); }, 'Encrypted backup saved.')} disabled={busy} /> : null}
    </View>
    <View style={{ marginTop: 28, gap: 12 }}><SectionTitle>Restore</SectionTitle>
      <Field label="Recovery code" value={input} onChangeText={setInput} placeholder="Paste your recovery code" autoCapitalize="none" />
      <Action title="Restore backup" variant="secondary" disabled={busy} onPress={() => confirmAction('Replace this ledger?', 'Restore replaces entries on this phone after the backup decrypts and passes validation.', 'Restore', () => void run(async () => { await restore(await downloadBackup(input)); router.back(); }, 'Ledger restored.'))} />
    </View>
    {code ? <View style={{ marginTop: 24 }}><Action title="Delete remote backup" variant="ghost" disabled={busy} onPress={() => confirmAction('Delete remote backup?', 'The ledger on this phone stays. The remote ciphertext is removed.', 'Delete', () => void run(async () => { await deleteRemoteBackup(); setCode(null); }, 'Remote backup deleted.'))} /></View> : null}
  </Screen>;
}
