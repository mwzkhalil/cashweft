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
import { usePalette } from '@/ui/theme';

export default function RootLayout() {
  const [loaded] = useFonts({ BricolageGrotesque_600SemiBold, BricolageGrotesque_700Bold,
    HankenGrotesk_400Regular, HankenGrotesk_600SemiBold, IBMPlexMono_400Regular, IBMPlexMono_500Medium,
    Inter_700Bold: require('../../assets/brand/fonts/Inter-Bold.ttf'),
    Inter_500Medium: require('../../assets/brand/fonts/Inter-Medium.ttf') });
  if (!loaded) return <LoadingScreen />;
  return <SafeAreaProvider><LedgerProvider><Frame /></LedgerProvider></SafeAreaProvider>;
}

function Frame() {
  const p = usePalette();
  const { preferences } = useLedger();
  const stack = <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: p.bg } }} />;
  const frame = <View style={{ flex: 1, direction: preferences.language === 'ur' ? 'rtl' : 'ltr', backgroundColor: p.bg }}>{stack}</View>;
  return <>
    <StatusBar style={p.bg === '#071F16' ? 'light' : 'dark'} />
    {Platform.OS === 'web' ? <View style={{ flex: 1, alignSelf: 'center', width: '100%', maxWidth: 520 }}>{frame}</View> : frame}
  </>;
}
