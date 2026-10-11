export const WIDE_MIN = 600;
export const CONTENT_MAX = 720;
export const TAB_BAR_CONTENT = 64;
export const TOUCH_MIN = 48;

export function tabBarHeight(bottomInset: number): number {
  return TAB_BAR_CONTENT + Math.max(bottomInset, 8);
}

export function screenBottomPadding(tab: boolean, bottomInset: number): number {
  return tab ? 16 : 24 + bottomInset;
}

export function isWide(width: number): boolean {
  return width >= WIDE_MIN;
}

export function resolveTheme(choice: string, system: string | null | undefined): 'light' | 'dark' {
  if (choice === 'light' || choice === 'dark') return choice;
  return system === 'light' ? 'light' : 'dark';
}
