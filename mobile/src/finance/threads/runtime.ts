import { Platform } from 'react-native';
import { deviceTier } from './decide';

export interface ModelStatus {
  available: boolean;
  state: 'rules' | 'lite' | 'roomy';
  bytes: number;
  reason: string;
}

export async function readModelStatus(): Promise<ModelStatus> {
  if (Platform.OS !== 'android') return { available: false, state: 'rules', bytes: 0, reason: 'phone pack not published' };
  try {
    const native = (await import('../../../modules/cashweft-jev/src/CashweftJevModule')).default;
    const status = native.getModelStatus();
    const ram = native.deviceRamMb();
    const tier = deviceTier(ram > 0 ? ram : null);
    return { available: false, state: tier === 'roomy' ? 'roomy' : tier, bytes: status.bytes, reason: status.reason };
  } catch {
    return { available: false, state: 'lite', bytes: 0, reason: 'phone pack not published' };
  }
}
