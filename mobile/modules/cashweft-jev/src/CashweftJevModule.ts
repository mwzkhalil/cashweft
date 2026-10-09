import { NativeModule, requireNativeModule } from 'expo';

declare class CashweftJevModule extends NativeModule<{}> {
  isAvailable(): boolean;
  getModelStatus(): { available: boolean; state: string; bytes: number; reason: string };
  deviceRamMb(): number;
  downloadModel(): Promise<{ accepted: boolean; reason: string }>;
  deleteModel(): Promise<boolean>;
  warmup(): Promise<boolean>;
  scoreHypotheses(state: string, hypotheses: string[]): Promise<number[]>;
  cancel(): boolean;
}

export default requireNativeModule<CashweftJevModule>('CashweftJev');
