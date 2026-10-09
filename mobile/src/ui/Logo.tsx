import React from 'react';
import { Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { MARK_MONO_SVG, MARK_SVG } from './brandMark';
import { fonts, usePalette } from './theme';

export function Logo({ size = 48, variant = 'color' }: { size?: number; variant?: 'color' | 'mono' }) {
  const xml = variant === 'mono' ? MARK_MONO_SVG : MARK_SVG;
  return <SvgXml xml={xml} width={size} height={size} accessibilityElementsHidden />;
}

export function BrandLockup({ size = 72, showTagline = true }: { size?: number; showTagline?: boolean }) {
  const p = usePalette();
  return <View style={{ alignItems: 'center' }}>
    <Logo size={size} />
    <Text style={{ fontFamily: fonts.wordmark, fontSize: size * 0.42, color: p.ink, marginTop: 12 }}>Cashweft</Text>
    {showTagline ? <Text style={{ fontFamily: fonts.wordmarkMedium, fontSize: 13, color: p.muted, marginTop: 6, textAlign: 'center' }}>Your Money. Your Patterns. Your Privacy.</Text> : null}
  </View>;
}
