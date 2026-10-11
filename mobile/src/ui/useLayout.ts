import { useWindowDimensions } from 'react-native';
import { isWide } from './layout';

export function useLayout(): { width: number; wide: boolean } {
  const { width } = useWindowDimensions();
  return { width, wide: isWide(width) };
}
