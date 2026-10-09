import type { ConfigContext, ExpoConfig } from 'expo/config';
import appJson from './app.json';

export default ({ config }: ConfigContext): ExpoConfig => {
  const sms = process.env.CASHWEFT_SMS_READER !== '0';
  const base = appJson.expo;
  return {
    ...config,
    ...base,
    name: 'Cashweft',
    orientation: 'portrait',
    android: {
      ...base.android,
      permissions: sms ? ['android.permission.READ_SMS'] : [],
      blockedPermissions: sms ? [] : ['android.permission.READ_SMS'],
    },
    extra: {
      ...base.extra,
      smsReader: sms,
    },
  } as ExpoConfig;
};
