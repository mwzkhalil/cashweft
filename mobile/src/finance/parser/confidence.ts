export function scoreConfidence(merchant: string, accountLast4: string | null, reference: string | null, contextual: boolean): number {
  let base = 0.45;
  if (merchant && accountLast4 && reference) base = 0.95;
  else if (merchant && accountLast4) base = 0.84;
  else if (merchant) base = 0.68;
  return contextual ? base : Math.min(base, 0.68);
}
