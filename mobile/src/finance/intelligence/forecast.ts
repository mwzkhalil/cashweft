export interface PaceForecast {
  status: 'insufficient' | 'on-track' | 'at-risk';
  projectedMinor: number | null;
  assumption: string;
}

export function budgetPace(spentMinor: number, budgetMinor: number, dayOfMonth: number, daysInMonth: number): PaceForecast {
  if (budgetMinor <= 0 || dayOfMonth < 7 || spentMinor <= 0) {
    return { status: 'insufficient', projectedMinor: null, assumption: 'Needs a budget, some spending, and at least 7 days in the month.' };
  }
  const projectedMinor = Math.round(spentMinor / dayOfMonth * daysInMonth);
  return {
    status: projectedMinor > budgetMinor ? 'at-risk' : 'on-track',
    projectedMinor,
    assumption: 'Assumes the rest of the month matches your average daily spend so far. It is not a bank forecast.',
  };
}

export function periodChange(current: number, previous: number): { text: string; comparable: boolean } {
  if (previous <= 0 || current < 0) return { text: 'Not enough earlier spending to compare as a percentage.', comparable: false };
  const ratio = Math.round((current - previous) / previous * 100);
  if (ratio === 0) return { text: 'Spending is level with the previous period.', comparable: true };
  const direction = ratio > 0 ? 'increased' : 'decreased';
  return { text: `Spending ${direction} ${Math.abs(ratio)}% compared with the previous period.`, comparable: true };
}
