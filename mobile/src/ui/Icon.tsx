import React, { useContext } from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';
import { DirectionContext } from './theme';

export type IconName = 'home' | 'inbox' | 'insights' | 'budgets' | 'you' | 'threads' | 'sms' | 'search' | 'plus' | 'edit' | 'refresh' | 'back' | 'check' | 'close' | 'lock' | 'cloud' | 'chevron' | 'filter' | 'share'
  | 'wallet' | 'cash' | 'download' | 'info' | 'arrowDown' | 'theme' | 'globe' | 'shield' | 'alert';

type IconArtProps = {
  color: string;
  common: ReturnType<typeof strokeStyle>;
};

function strokeStyle(color: string) {
  return { stroke: color, strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
}

const directional = new Set<IconName>(['back', 'chevron']);

const artwork: Record<IconName, (props: IconArtProps) => React.ReactNode> = {
  home: ({ color }) => <Path fill={color} d="M11.3 2.7a1 1 0 0 1 1.4 0l8 7.4c.2.2.3.5.3.7V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.2c0-.2.1-.5.3-.7l8-7.4Z" />,
  inbox: ({ color }) => <><Path fill={color} opacity=".45" d="M5 2h14v4H5z" /><Path fill={color} d="M3 6h18v13l-2 2-2-2-2 2-3-2-3 2-2-2-2 2-2-2V6Zm4 4v2h10v-2H7Zm0 4v2h7v-2H7Z" /></>,
  insights: ({ color }) => <Path fill={color} d="M3 17h5v4H3v-4Zm7-7h5v11h-5V10Zm7-7h4v18h-4V3Zm-7 4h5v1h-5V7Zm7 8h4v2h-4v-2Z" />,
  budgets: ({ color }) => <><Path fill={color} d="M12 2a10 10 0 1 0 10 10H12V2Z" /><Path fill={color} opacity=".45" d="M14 2.2V10h7.8A10 10 0 0 0 14 2.2Z" /></>,
  you: ({ color }) => <><Circle fill={color} cx="12" cy="7.5" r="3.3" /><Path fill={color} d="M6.1 20.4c.5-3.7 2.9-5.8 5.9-5.8s5.4 2.1 5.9 5.8c.15.8-.45 1.4-1.2 1.4H7.3c-.75 0-1.35-.6-1.2-1.4Z" /></>,
  threads: ({ common }) => <><Circle {...common} cx="6" cy="6" r="2.6" /><Circle {...common} cx="18" cy="18" r="2.6" /><Path {...common} d="M8.6 6H14a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h5.4" /></>,
  sms: ({ common }) => <><Path {...common} d="M4 5.5h16v11H9l-4 3v-3H4z" /><Path {...common} d="M7.5 9h9m-9 3.5h6" /></>,
  search: ({ common }) => <><Circle {...common} cx="10.5" cy="10.5" r="6.3" /><Line {...common} x1="15.2" y1="15.2" x2="21" y2="21" /></>,
  plus: ({ common }) => <Path {...common} d="M12 4v16M4 12h16" />,
  edit: ({ common }) => <><Path {...common} d="m4 16 11-11 4 4-11 11-5 1z" /><Path {...common} d="m13 7 4 4" /></>,
  refresh: ({ common }) => <><Path {...common} d="M20 11a8 8 0 1 0 .2 3" /><Path {...common} d="M20 4v7h-7" /></>,
  back: ({ common }) => <Polyline {...common} points="15,4 7,12 15,20" />,
  check: ({ common }) => <Path {...common} d="m4.5 12.5 4.5 4.5L19.5 6.5" />,
  close: ({ common }) => <Path {...common} d="M5 5 19 19M19 5 5 19" />,
  lock: ({ common }) => <><Rect {...common} x="5" y="10" width="14" height="11" rx="2" /><Path {...common} d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  cloud: ({ common }) => <Path {...common} d="M7.5 18h10a4 4 0 0 0 .3-8 6 6 0 0 0-11.5 1.5A3.3 3.3 0 0 0 7.5 18z" />,
  chevron: ({ common }) => <Polyline {...common} points="9,5 16,12 9,19" />,
  filter: ({ common }) => <Path {...common} d="M4 6h16M7 12h10m-7 6h4" />,
  share: ({ common }) => <><Path {...common} d="M12 3v12m-4-8 4-4 4 4" /><Path {...common} d="M5 14v6h14v-6" /></>,
  wallet: ({ common }) => <><Path {...common} d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" /><Rect {...common} x="4" y="8" width="16" height="11" rx="2" /><Path {...common} d="M16 13.5h1.5" /></>,
  cash: ({ common }) => <><Rect {...common} x="3" y="6" width="18" height="12" rx="2" /><Circle {...common} cx="12" cy="12" r="2.5" /></>,
  download: ({ common }) => <><Path {...common} d="M12 4v11m-4-4 4 4 4-4" /><Path {...common} d="M5 20h14" /></>,
  info: ({ common }) => <><Circle {...common} cx="12" cy="12" r="8.5" /><Path {...common} d="M12 11v5m0-8.2v.2" /></>,
  arrowDown: ({ common }) => <Path {...common} d="M12 4v16m-5-5 5 5 5-5" />,
  theme: ({ common, color }) => <><Circle {...common} cx="12" cy="12" r="8" /><Path fill={color} d="M12 4a8 8 0 0 1 0 16z" /></>,
  globe: ({ common }) => <><Circle {...common} cx="12" cy="12" r="8.5" /><Path {...common} d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17m0-17c-2.5 2.6-2.5 14.4 0 17" /></>,
  shield: ({ common }) => <Path {...common} d="M12 3 5 6v5.5c0 4.3 3 7.7 7 9.5 4-1.8 7-5.2 7-9.5V6z" />,
  alert: ({ common }) => <><Circle {...common} cx="12" cy="12" r="8.5" /><Path {...common} d="M12 7.5v5.5m0 3.2v.2" /></>,
};

export function Icon({ name, size = 24, color }: { name: IconName; size?: number; color: string }) {
  const rtl = useContext(DirectionContext) === 'rtl';
  const art = artwork[name]({ color, common: strokeStyle(color) });
  return <Svg width={size} height={size} viewBox="0 0 24 24" style={rtl && directional.has(name) ? { transform: [{ scaleX: -1 }] } : undefined}>{art}</Svg>;
}
