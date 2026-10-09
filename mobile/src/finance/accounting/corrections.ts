import type { MerchantCorrection } from '../../lib/model';

export function merchantKey(merchant: string): string | null {
  const key = merchant.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
  if (key.length < 4 || key === 'unknown merchant') return null;
  return key;
}

export function rememberCorrection(existing: MerchantCorrection[], merchant: string, category: string, now: number): MerchantCorrection[] {
  const key = merchantKey(merchant);
  if (!key) return existing;
  const current = existing.find(item => item.merchantKey === key);
  if (!current) return [...existing, { merchantKey: key, category, hits: 1, updatedAt: now }];
  return existing.map(item => item.merchantKey === key ? { ...item, category, hits: item.hits + 1, updatedAt: now } : item);
}

export function categoryFromMemory(merchant: string, fallback: string, corrections: MerchantCorrection[]): string {
  const key = merchantKey(merchant);
  const match = key ? corrections.find(item => item.merchantKey === key && item.hits >= 2) : undefined;
  return match?.category ?? fallback;
}
