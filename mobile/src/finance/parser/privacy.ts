export function retainedBody(body: string, retainRaw: boolean): string | null {
  if (!retainRaw) return null;
  const trimmed = body.trim();
  if (!trimmed || trimmed.length > 4000) return null;
  return trimmed;
}
