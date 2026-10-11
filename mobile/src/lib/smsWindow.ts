export const SCAN_OVERLAP_MS = 120_000;

export function incrementalSince(lastScanAt: number): number | null {
  if (lastScanAt <= 0) return null;
  return lastScanAt - SCAN_OVERLAP_MS;
}
