import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync, getRandomBytesAsync, randomUUID } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { migrateSnapshot } from './snapshot';
import type { Snapshot } from './snapshot';
import { decodeRecoveryCode, displayRecoveryPrefix, formatRecoveryCode } from './recoveryCode';
import type { RecoveryPrefix } from './recoveryCode';
import { BACKUP_CREDENTIALS_KEY, LEGACY_BACKUP_CREDENTIALS_KEY, chooseStoredValue } from './identity';
const apiUrl = process.env.EXPO_PUBLIC_BACKUP_API_URL?.replace(/\/$/, '');

interface Credentials { id: string; token: string; key: string; prefix?: RecoveryPrefix }

function toBase64Url(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, value => String.fromCharCode(value)).join(''))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function endpoint(id: string): string {
  if (!apiUrl || !apiUrl.startsWith('https://')) throw new Error('Set EXPO_PUBLIC_BACKUP_API_URL to your HTTPS backup API URL.');
  return `${apiUrl}/v1/backups/${id}`;
}

async function getCredentials(): Promise<Credentials | null> {
  const current = await SecureStore.getItemAsync(BACKUP_CREDENTIALS_KEY);
  const legacy = current ? null : await SecureStore.getItemAsync(LEGACY_BACKUP_CREDENTIALS_KEY);
  const chosen = chooseStoredValue(current, legacy);
  if (!chosen.value) return null;
  if (chosen.copiedFromLegacy) await SecureStore.setItemAsync(BACKUP_CREDENTIALS_KEY, chosen.value);
  return JSON.parse(chosen.value) as Credentials;
}

export async function getRecoveryCode(): Promise<string | null> {
  const credentials = await getCredentials();
  return credentials ? formatRecoveryCode(displayRecoveryPrefix(credentials.prefix), credentials.id, credentials.token, credentials.key) : null;
}

export async function enableBackup(): Promise<string> {
  let credentials = await getCredentials();
  if (!credentials) {
    const key = await AESEncryptionKey.generate();
    credentials = { id: randomUUID(), token: toBase64Url(await getRandomBytesAsync(32)), key: await key.encoded('base64'), prefix: 'cashweft1' };
    await SecureStore.setItemAsync(BACKUP_CREDENTIALS_KEY, JSON.stringify(credentials));
  }
  return formatRecoveryCode(displayRecoveryPrefix(credentials.prefix), credentials.id, credentials.token, credentials.key);
}

export async function uploadBackup(snapshot: Snapshot): Promise<void> {
  const credentials = await getCredentials();
  if (!credentials) throw new Error('Turn on backup first.');
  const key = await AESEncryptionKey.import(credentials.key, 'base64');
  const sealed = await aesEncryptAsync(new TextEncoder().encode(JSON.stringify(snapshot)), key);
  const ciphertext = await sealed.combined('base64') as string;
  const headers = { Authorization: `Bearer ${credentials.token}`, 'Content-Type': 'application/json' };
  const current = await fetch(endpoint(credentials.id), { headers });
  if (!current.ok && current.status !== 404) throw new Error('Could not check the current backup. Try again.');
  const version = current.ok ? (await current.json() as { version: number }).version : 0;
  const response = await fetch(endpoint(credentials.id), { method: 'PUT', headers, body: JSON.stringify({ version, ciphertext }) });
  if (response.status === 409) throw new Error('The backup changed on another device. Restore it before uploading again.');
  if (!response.ok) throw new Error('Backup could not be saved. Try again.');
}

export async function downloadBackup(code: string): Promise<Snapshot> {
  const parts = decodeRecoveryCode(code);
  const response = await fetch(endpoint(parts.id), { headers: { Authorization: `Bearer ${parts.token}` } });
  if (!response.ok) throw new Error('Backup not found. Check the recovery code.');
  const { ciphertext } = await response.json() as { ciphertext: string };
  const key = await AESEncryptionKey.import(parts.key, 'base64');
  let snapshot: Snapshot;
  try {
    const clear = await aesDecryptAsync(AESSealedData.fromCombined(ciphertext), key) as Uint8Array;
    snapshot = migrateSnapshot(JSON.parse(new TextDecoder().decode(clear)));
  } catch {
    throw new Error('Could not decrypt this backup. Check the recovery code.');
  }
  await SecureStore.setItemAsync(BACKUP_CREDENTIALS_KEY, JSON.stringify({ id: parts.id, token: parts.token, key: parts.key, prefix: parts.prefix }));
  return snapshot;
}

export async function deleteRemoteBackup(): Promise<void> {
  const credentials = await getCredentials();
  if (!credentials) return;
  const response = await fetch(endpoint(credentials.id), { method: 'DELETE', headers: { Authorization: `Bearer ${credentials.token}` } });
  if (!response.ok && response.status !== 404) throw new Error('Could not delete the remote backup. Try again.');
  await SecureStore.deleteItemAsync(BACKUP_CREDENTIALS_KEY);
  await SecureStore.deleteItemAsync(LEGACY_BACKUP_CREDENTIALS_KEY);
}
