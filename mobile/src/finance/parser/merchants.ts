const PATTERNS = [
  /\b(?:to\s+VPA|trf\s+to|paid\s+to|payment\s+to|sent\s+to)\s+([A-Za-z0-9._@\u0600-\u06FF -]{2,48}?)(?=\s*\(|\s+Ref|\s+on\s+\d|[.;]|$)/i,
  /\b(?:at|from)\s+([A-Z][A-Za-z0-9&._@\u0600-\u06FF -]{1,48}?)(?=\s+via\s+(?:UPI|IBFT|Raast|1LINK|card)\b|\s+on\s+\d|\s*\(|[.;]|$)/i,
  /\b(?:IBFT|NEFT)\s+(?:to|from)\s+([A-Za-z0-9 &._-]{2,48}?)(?=[.;]|$)/i,
];

export function titleCase(input: string): string {
  return input.trim().replace(/\s+/g, ' ').replace(/\b\p{L}/gu, char => char.toUpperCase())
    .replace(/([\p{L}])([\p{L}]+)/gu, (_, first: string, rest: string) => first + rest.toLowerCase());
}

export function extractMerchant(body: string): string {
  for (const pattern of PATTERNS) {
    const merchant = body.match(pattern)?.[1]?.trim() ?? '';
    if (merchant) return merchant.replace(/\s+(?:Ref|UPI|via|Raast|IBFT)$/i, '').trim();
  }
  return '';
}
