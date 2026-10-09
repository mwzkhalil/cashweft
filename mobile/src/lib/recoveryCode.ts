export type RecoveryPrefix = 'kharcha1' | 'cashweft1';

export interface RecoveryParts {
  prefix: RecoveryPrefix;
  id: string;
  token: string;
  key: string;
}

export function displayRecoveryPrefix(prefix: RecoveryPrefix | undefined): RecoveryPrefix {
  return prefix ?? 'kharcha1';
}

export function formatRecoveryCode(prefix: RecoveryPrefix, id: string, token: string, key: string): string {
  return `${prefix}.${id}.${token}.${key.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')}`;
}

export function decodeRecoveryCode(code: string): RecoveryParts {
  const parts = code.trim().split('.');
  if (parts.length !== 4 || (parts[0] !== 'kharcha1' && parts[0] !== 'cashweft1') || !/^[0-9a-f-]{36}$/i.test(parts[1]) ||
      !/^[A-Za-z0-9_-]{43}$/.test(parts[2]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[3])) {
    throw new Error('That recovery code is not valid.');
  }
  return { prefix: parts[0], id: parts[1], token: parts[2], key: parts[3].replaceAll('-', '+').replaceAll('_', '/') + '=' };
}
