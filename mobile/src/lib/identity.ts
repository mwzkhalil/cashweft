export const DATABASE_FILE = 'cashweft.db';
export const LEGACY_DATABASE_FILE = 'kharcha.db';
export const BROWSER_LEDGER_KEY = 'cashweft.browser-ledger.v1';
export const LEGACY_BROWSER_LEDGER_KEY = 'kharcha.browser-ledger.v1';
export const BACKUP_CREDENTIALS_KEY = 'cashweft.backup.credentials.v1';
export const LEGACY_BACKUP_CREDENTIALS_KEY = 'kharcha.backup.credentials.v1';
export const APPLICATION_ID = 'app.cashweft.mobile';

export function chooseStoredValue(current: string | null, legacy: string | null): { value: string | null; copiedFromLegacy: boolean } {
  if (current) return { value: current, copiedFromLegacy: false };
  if (legacy) return { value: legacy, copiedFromLegacy: true };
  return { value: null, copiedFromLegacy: false };
}

export function shouldCopyLegacyDatabase(currentHasLedger: boolean, legacyHasLedger: boolean): boolean {
  return !currentHasLedger && legacyHasLedger;
}
