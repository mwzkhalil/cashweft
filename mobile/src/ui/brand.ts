export const brand = {
  emerald: '#0F5132',
  mint: '#6EE7B7',
  charcoal: '#1F2937',
  offWhite: '#F8FAF7',
} as const;

export const semantic = {
  light: {
    background: brand.offWhite,
    surface: '#FFFFFF',
    textPrimary: brand.charcoal,
    textSecondary: '#4B5563',
    accent: brand.emerald,
    onAccent: brand.offWhite,
    border: '#E5E7EB',
    positive: '#0F5132',
    negative: '#B42318',
    warning: '#B45309',
  },
  dark: {
    background: '#071F16',
    surface: '#0F5132',
    textPrimary: brand.offWhite,
    textSecondary: '#C9E8D8',
    accent: brand.mint,
    onAccent: '#052E1C',
    border: '#1B5C42',
    positive: brand.mint,
    negative: '#F2B8B5',
    warning: '#F6D48B',
  },
} as const;
