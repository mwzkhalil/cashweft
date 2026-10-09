const REFERENCE = /(?:UPI\s*Ref|Ref(?:erence)?\s*(?:no|number|id)?|RRN|UTR|TID|TRX(?:\s*ID)?|transaction\s+reference)\s*[:#.-]?\s*([A-Z0-9]{6,})/i;
const ACCOUNT = /(?:A\/c|A\/C|Acct|Account|Card|اکاؤنٹ)\s*(?:no\.?\s*)?(?:[Xx*·-]+)?\s*(\d{3,4})\b/i;
const STAMP = /\b(?:on\s+)?(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2}))?\b/;

export function extractReference(body: string): string | null {
  return body.match(REFERENCE)?.[1] ?? null;
}

export function extractAccountLast4(body: string): string | null {
  return body.match(ACCOUNT)?.[1] ?? null;
}

export function extractTimestamp(body: string): number | null {
  const match = body.match(STAMP);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const hour = match[4] ? Number(match[4]) : 12;
  const minute = match[5] ? Number(match[5]) : 0;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date.getTime();
}

export function extractRail(body: string): string | null {
  if (/\braast\b/i.test(body)) return 'raast';
  if (/\bibft\b/i.test(body)) return 'ibft';
  if (/\b1\s*link\b/i.test(body)) return '1link';
  if (/\bupi\b/i.test(body)) return 'upi';
  if (/\bcard\b/i.test(body)) return 'card';
  if (/\bwallet\b/i.test(body)) return 'wallet';
  return null;
}
