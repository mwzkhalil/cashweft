import { NativeModule, requireNativeModule } from 'expo';

export interface SmsPage {
  examined: number;
  messages: Array<{ id: number; sender: string; body: string; receivedAt: number }>;
  next: { date: number; id: number } | null;
}

export interface DiscoveryPage {
  examined: number;
  senders: Array<{ sender: string; count: number; latestDate: number; preview: string; evidence: string[] }>;
  next: { date: number; id: number } | null;
}

declare class CashweftSmsModule extends NativeModule<{}> {
  listMessages(senders: string[], since: number): Promise<Array<{ sender: string; body: string; receivedAt: number }>>;
  listMessagesPage(options: {
    senders: string[];
    since: number;
    until: number;
    beforeDate?: number | null;
    beforeId?: number | null;
    limit: number;
  }): Promise<SmsPage>;
  discoverFinancialSenders(options: {
    since: number;
    until: number;
    beforeDate?: number | null;
    beforeId?: number | null;
    limit: number;
  }): Promise<DiscoveryPage>;
}

export default requireNativeModule<CashweftSmsModule>('CashweftSms');
