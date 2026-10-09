import { PermissionsAndroid, Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { parseBankSms } from './parser';
import { retainedBody } from '../finance/parser/privacy';
import type { SenderRule, Transaction } from './model';

export function smsBuildEnabled(): boolean {
  return Constants.expoConfig?.extra?.smsReader !== false;
}

export function canReadSms(): boolean {
  return Platform.OS === 'android' && smsBuildEnabled();
}

export async function requestSmsPermission(): Promise<boolean> {
  if (!canReadSms()) return false;
  return (await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_SMS, {
    title: 'Read bank transaction SMS',
    message: 'Cashweft reads messages only from the sender IDs you turn on. OTPs and personal chats are not added to your ledger.',
    buttonPositive: 'Allow', buttonNegative: 'Not now',
  })) === PermissionsAndroid.RESULTS.GRANTED;
}

export async function readBankSms(senders: SenderRule[], since: number, autoAdd: boolean, retainRaw = false): Promise<Transaction[]> {
  if (!canReadSms()) return [];
  const allowed = senders.filter(sender => sender.enabled).map(sender => sender.address);
  if (!allowed.length) return [];
  const native = (await import('../../modules/cashweft-sms/src/CashweftSmsModule')).default;
  const messages = await native.listMessages(allowed, since);
  const result: Transaction[] = [];
  for (const sms of messages) {
    const parsed = parseBankSms(sms.body);
    if (!parsed) continue;
    const sourceHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${sms.sender}\n${sms.receivedAt}\n${sms.body}`);
    const now = Date.now();
    result.push({
      id: Crypto.randomUUID(), sourceHash, sender: sms.sender, rawBody: retainedBody(sms.body, retainRaw),
      occurredAt: parsed.occurredAt ?? sms.receivedAt, merchant: parsed.merchant, amountMinor: parsed.amountMinor,
      currency: parsed.currency, direction: parsed.direction, transactionType: parsed.transactionType,
      category: parsed.category, status: autoAdd && parsed.confidence >= 0.9 ? 'auto' : 'review',
      accountLast4: parsed.accountLast4, reference: parsed.reference, confidence: parsed.confidence,
      providerId: parsed.providerId, accountId: null, counterpartyAccountId: null, rail: parsed.rail,
      createdAt: now, updatedAt: now,
    });
  }
  return result;
}
