import { parseBankSms } from '../parser';
import { PROVIDERS } from '../parser/providers';
import { normalizeSender, type SmsRow } from './page';
import { redactPreview } from './preview';

export interface SenderCandidate {
  sender: string;
  normalized: string;
  count: number;
  latestDate: number;
  preview: string;
  recognised: boolean;
}

export function discoverFinancialSenders(rows: SmsRow[], since: number, until: number): SenderCandidate[] {
  const grouped = new Map<string, SenderCandidate>();
  const ordered = [...rows].sort((left, right) => right.receivedAt - left.receivedAt || right.id - left.id);
  for (const row of ordered) {
    if (row.receivedAt < since || row.receivedAt > until) continue;
    if (!parseBankSms(row.body)) continue;
    const normalized = normalizeSender(row.sender);
    if (!normalized) continue;
    const current = grouped.get(normalized);
    if (!current) {
      grouped.set(normalized, {
        sender: row.sender,
        normalized,
        count: 1,
        latestDate: row.receivedAt,
        preview: redactPreview(row.body),
        recognised: recognisedSender(row.sender, row.body),
      });
      continue;
    }
    current.count += 1;
  }
  return [...grouped.values()].sort((left, right) => right.count - left.count || right.latestDate - left.latestDate);
}

function recognisedSender(sender: string, body: string): boolean {
  const hay = `${sender} ${body}`.toLowerCase();
  return PROVIDERS.some(provider => provider.kind !== 'rail' && provider.aliases.some(alias => hay.includes(alias.toLowerCase())));
}

export function senderIsRecognised(sender: string, evidence: string[] = []): boolean {
  const ids = new Set(PROVIDERS.filter(provider => provider.kind !== 'rail').map(provider => provider.id));
  if (evidence.some(tag => ids.has(tag))) return true;
  return recognisedSender(sender, '');
}
