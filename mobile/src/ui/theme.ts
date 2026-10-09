import { useColorScheme } from 'react-native';
import { brand, semantic } from './brand';

const dark = semantic.dark;
const light = semantic.light;

export const palettes = {
  dark: {
    bg: dark.background, surface: '#0C3D28', sunk: '#052117', line: dark.border, strongLine: '#6EE7B7',
    ink: dark.textPrimary, muted: dark.textSecondary, marigold: dark.accent, marigoldSoft: '#123D2C',
    onMarigold: dark.onAccent, leaf: brand.emerald, onLeaf: brand.offWhite,
    debit: dark.negative, debitSoft: '#3A221C', credit: dark.positive, creditSoft: '#123D2C',
    review: dark.warning, focus: dark.accent,
  },
  light: {
    bg: light.background, surface: light.surface, sunk: '#E7F6EF', line: light.border, strongLine: '#9CA3AF',
    ink: light.textPrimary, muted: light.textSecondary, marigold: light.accent, marigoldSoft: '#D1FAE5',
    onMarigold: light.onAccent, leaf: brand.emerald, onLeaf: brand.offWhite,
    debit: light.negative, debitSoft: '#FEE4E2', credit: light.positive, creditSoft: '#D1FAE5',
    review: light.warning, focus: light.accent,
  },
} as const;

export type Palette = typeof palettes.dark | typeof palettes.light;

export function usePalette(): Palette {
  return useColorScheme() === 'light' ? palettes.light : palettes.dark;
}

export const categoryColors: Record<string, string> = {
  Groceries: '#6EAF62', 'Food and Restaurants': '#E08A4F', Transport: '#6AA8D6', Fuel: '#D2A24C',
  Utilities: '#8E86C9', 'Mobile and Internet': '#5C8FDB', Education: '#6F8F72', Healthcare: '#4EBEB0',
  Shopping: '#D96B93', Rent: '#C47B5A', Housing: '#A98462', Entertainment: '#D4B44A', Family: '#D9897A',
  'Charity and Zakat': '#3E9B78', 'Government Fees and Taxes': '#7E8B99', Subscriptions: '#8B78C4',
  'Cash Withdrawals': '#8A8175', Transfers: '#7D8F88', Savings: '#2F8F6B', Income: '#1F7A5A', Other: '#8E8A80',
  'Food & dining': '#E08A4F', Travel: '#6AA8D6', Bills: '#8E86C9', Health: '#4EBEB0',
};

export function colorForCategory(category: string): string {
  return categoryColors[category] ?? '#7D8F88';
}

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displayMedium: 'BricolageGrotesque_600SemiBold',
  wordmark: 'Inter_700Bold',
  wordmarkMedium: 'Inter_500Medium',
  body: 'HankenGrotesk_400Regular',
  bodyMedium: 'HankenGrotesk_600SemiBold',
  mono: 'IBMPlexMono_500Medium',
  monoRegular: 'IBMPlexMono_400Regular',
};
