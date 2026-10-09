import React, { useState } from 'react';
import { View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Action, Body, Screen, ScreenHead } from '@/ui/Kit';
import { Field, Note } from '@/ui/Forms';
import { exportSnapshot, useLedger } from '@/state/LedgerProvider';
import { migrateSnapshot } from '@/lib/snapshot';
import type { Snapshot } from '@/lib/snapshot';
import { confirmAction, showMessage } from '@/ui/dialog';

export default function DataPort() {
  const { restore } = useLedger();
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  return <Screen><ScreenHead title="Export and import" back />
    <Body muted>The copy is plain JSON on this phone. It is not the encrypted backup.</Body>
    <View style={{ gap: 14, marginTop: 16 }}>
      <Action title={busy ? 'Working…' : 'Copy ledger JSON'} disabled={busy} onPress={() => void (async () => {
        setBusy(true);
        try { await Clipboard.setStringAsync(JSON.stringify(await exportSnapshot())); showMessage('Copied', 'The JSON is on the clipboard.'); }
        catch (e) { showMessage('Could not export', e instanceof Error ? e.message : 'Try again.'); }
        finally { setBusy(false); }
      })()} />
      <Field label="Paste JSON" value={raw} onChangeText={setRaw} multiline placeholder="{ ... }" autoCapitalize="none" />
      <Note>Import replaces this ledger only after the file validates.</Note>
      <Action title="Import JSON" variant="secondary" onPress={() => {
        let parsed: Snapshot;
        try { parsed = migrateSnapshot(JSON.parse(raw)); }
        catch (e) { showMessage('Cannot import', e instanceof Error ? e.message : 'Invalid file.'); return; }
        confirmAction('Replace this ledger?', 'The pasted file passed validation. Import replaces entries on this phone.', 'Import', () => void restore(parsed).then(() => showMessage('Imported', 'The ledger was replaced.')).catch(e => showMessage('Could not import', e instanceof Error ? e.message : 'Try again.')));
      }} />
    </View>
  </Screen>;
}
