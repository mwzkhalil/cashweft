export function redactPreview(body: string): string {
  const hidden = body
    .replace(/\b(otp|pin|code)\b\s*[:#-]?\s*\d{3,8}/gi, '$1 ••••')
    .replace(/\d[\d,.]{2,}/g, '••••');
  const compact = hidden.replace(/\s+/g, ' ').trim();
  return compact.length > 90 ? `${compact.slice(0, 87)}...` : compact;
}
