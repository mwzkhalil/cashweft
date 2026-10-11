import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold } from '@expo-google-fonts/bricolage-grotesque';
import { HankenGrotesk_400Regular, HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk';
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View } from 'react-native';
import { LedgerProvider, useLedger } from '@/state/LedgerProvider';
import { LoadingScreen } from '@/ui/Kit';
import { DirectionContext, palettes, ThemeChoiceContext, usePalette } from '@/ui/theme';

export default function RootLayout() {
  const [loaded] = useFonts({ BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold,
    HankenGrotesk_400Regular, HankenGrotesk_600SemiBold, IBMPlexMono_400Regular, IBMPlexMono_500Medium,
    Inter_700Bold: require('../../assets/brand/fonts/Inter-Bold.ttf'),
    Inter_500Medium: require('../../assets/brand/fonts/Inter-Medium.ttf') });
  if (!loaded) return <LoadingScreen />;
  return <SafeAreaProvider><LedgerProvider><Frame /></LedgerProvider></SafeAreaProvider>;
}

function Frame() {
  const { preferences } = useLedger();
  const rtl = preferences.language === 'ur';
  return <ThemeChoiceContext.Provider value={preferences.theme}><DirectionContext.Provider value={rtl ? 'rtl' : 'ltr'}><Themed rtl={rtl} /></DirectionContext.Provider></ThemeChoiceContext.Provider>;
}

function Themed({ rtl }: { rtl: boolean }) {
  const p = usePalette();
  const stack = <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg } }} />;
  const frame = <View style={{ flex: 1, direction: rtl ? 'rtl' : 'ltr', backgroundColor: p.bg }}>{stack}</View>;
  return <>
    <StatusBar style={p === palettes.dark ? 'light' : 'dark'} />
    {Platform.OS === 'web' ? <View style={{ flex: 1, alignSelf: 'center', width: '100%', maxWidth: 520 }}>{frame}</View> : frame}
  </>;
}
