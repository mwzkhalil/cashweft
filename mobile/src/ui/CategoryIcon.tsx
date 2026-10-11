import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { colorForCategory } from './theme';

type Stroke = { stroke: string; strokeWidth: number; strokeLinecap: 'round'; strokeLinejoin: 'round'; fill: 'none' };
type Glyph = (s: Stroke) => React.ReactNode;

const glyphs: Record<string, Glyph> = {
  basket: s => <><Path {...s} d="M4 10h16l-1.6 9H5.6z" /><Path {...s} d="m8 10 3-6m5 6-3-6" /></>,
  cup: s => <><Path {...s} d="M5 8h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z" /><Path {...s} d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v2m3-2v2" /></>,
  bus: s => <><Rect {...s} x="5" y="4" width="14" height="13" rx="2" /><Path {...s} d="M5 11h14M8 17v3m8-3v3" /><Circle {...s} cx="8.5" cy="14" r=".6" /><Circle {...s} cx="15.5" cy="14" r=".6" /></>,
  pump: s => <><Path {...s} d="M5 20V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v15M4 20h11M5 10h9" /><Path {...s} d="m14 8 3 3v6a1.5 1.5 0 0 0 3 0V9l-3-3" /></>,
  bolt: s => <Path {...s} d="M13 3 6 13h5l-1 8 7-10h-5z" />,
  phone: s => <><Rect {...s} x="7" y="3" width="10" height="18" rx="2" /><Line {...s} x1="11" y1="18" x2="13" y2="18" /></>,
  book: s => <><Path {...s} d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><Path {...s} d="M4 20.5A2.5 2.5 0 0 0 6.5 21H20" /></>,
  cross: s => <><Rect {...s} x="4" y="4" width="16" height="16" rx="3" /><Path {...s} d="M12 8v8M8 12h8" /></>,
  bag: s => <><Path {...s} d="M5 8h14l-1 12H6z" /><Path {...s} d="M9 8V6a3 3 0 0 1 6 0v2" /></>,
  house: s => <><Path {...s} d="M4 11 12 4l8 7" /><Path {...s} d="M6 10v10h12V10M10 20v-5h4v5" /></>,
  play: s => <><Circle {...s} cx="12" cy="12" r="8.5" /><Path {...s} d="m10 8.5 5 3.5-5 3.5z" /></>,
  people: s => <><Circle {...s} cx="9" cy="8" r="3" /><Path {...s} d="M3.5 19a5.5 5.5 0 0 1 11 0" /><Circle {...s} cx="17" cy="9" r="2.3" /><Path {...s} d="M16 14.2a4.5 4.5 0 0 1 5 4.8" /></>,
  heart: s => <Path {...s} d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  column: s => <><Path {...s} d="m3 9 9-5 9 5" /><Path {...s} d="M5 9v9m4.7-9v9m4.6-9v9M19 9v9M3 20h18" /></>,
  repeat: s => <><Path {...s} d="M4 11V9a3 3 0 0 1 3-3h12l-3-3m3 3-3 3" /><Path {...s} d="M20 13v2a3 3 0 0 1-3 3H5l3 3m-3-3 3-3" /></>,
  note: s => <><Rect {...s} x="3" y="6" width="18" height="12" rx="2" /><Circle {...s} cx="12" cy="12" r="2.5" /><Path {...s} d="M6.5 9.5v5m11-5v5" /></>,
  arrows: s => <><Path {...s} d="M4 8h14l-3-3m3 3-3 3" /><Path {...s} d="M20 16H6l3-3m-3 3 3 3" /></>,
  jar: s => <><Path {...s} d="M8 4h8M9 4v2.5C6.5 8 6 9.5 6 12v6a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-6c0-2.5-.5-4-3-5.5V4" /><Path {...s} d="M9 14h6" /></>,
  arrowIn: s => <><Path {...s} d="M12 4v11m-4-4 4 4 4-4" /><Path {...s} d="M5 20h14" /></>,
  dot: s => <Circle {...s} cx="12" cy="12" r="4" />,
};

const byCategory: Record<string, keyof typeof glyphs> = {
  Groceries: 'basket', 'Food and Restaurants': 'cup', Transport: 'bus', Fuel: 'pump', Utilities: 'bolt',
  'Mobile and Internet': 'phone', Education: 'book', Healthcare: 'cross', Shopping: 'bag', Rent: 'house', Housing: 'house',
  Entertainment: 'play', Family: 'people', 'Charity and Zakat': 'heart', 'Government Fees and Taxes': 'column',
  Subscriptions: 'repeat', 'Cash Withdrawals': 'note', Transfers: 'arrows', Savings: 'jar', Income: 'arrowIn', Other: 'dot',
  'Food & dining': 'cup', Travel: 'bus', Bills: 'bolt', Health: 'cross',
};

export function glyphFor(category: string): keyof typeof glyphs {
  return byCategory[category] ?? 'dot';
}

export function CategoryIcon({ category, size = 36 }: { category: string; size?: number }) {
  const color = colorForCategory(category);
  const glyph = glyphs[glyphFor(category)];
  const inner = Math.round(size * 0.56);
  return <View aria-hidden style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}2E`, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={inner} height={inner} viewBox="0 0 24 24">{glyph({ stroke: color, strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' })}</Svg>
  </View>;
}
