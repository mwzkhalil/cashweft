import React from 'react';
import { View } from 'react-native';
import { Body, Caption, Screen, ScreenHead, SectionTitle } from '@/ui/Kit';

const points = [
  'Selected financial messages are read on this phone.',
  'Other SMS are not stored.',
  'OTP messages are rejected.',
  'Nothing is uploaded for SMS parsing.',
  'Optional backup is a separate encrypted copy.',
  'The ledger file on the phone is not encrypted by Cashweft.',
  'Keep message text off stores the parsed entry, not the original SMS. Deduping still uses the message read from the phone.',
];

export default function SmsPrivacy() {
  return <Screen>
    <ScreenHead title="On this phone" back />
    <SectionTitle>Processed on this phone.</SectionTitle>
    <View style={{ marginTop: 16, gap: 12 }}>
      {points.map(point => <Body key={point}>{point}</Body>)}
    </View>
    <Caption style={{ marginTop: 18 }}>All available means messages Android still has. Deleted messages are not recovered.</Caption>
  </Screen>;
}
