import type { ParsedSms } from '../parser';
import { smsIdentity } from './identity';
import type { PageRequest, PageResult, SmsRow } from './page';

export interface ImportCounters {
  scanned: number;
  added: number;
  review: number;
  duplicates: number;
  skipped: number;
  cancelled: boolean;
  done: boolean;
  sender: string;
  senderIndex: number;
  cursor: { date: number; id: number } | null;
}

export interface BuiltTransaction {
  sourceHash: string;
  sender: string;
  body: string;
  receivedAt: number;
  parsed: ParsedSms;
  status: 'auto' | 'review';
}

interface ImportOptions {
  addresses: string[];
  since: number;
  until: number;
  pageSize: number;
  senderIndex?: number;
  cursor?: { date: number; id: number } | null;
  scanned?: number;
  added?: number;
  review?: number;
  duplicates?: number;
  knownHashes: Set<string>;
  autoAdd: boolean;
  cancelled: () => boolean;
  readPage: (request: PageRequest) => Promise<PageResult>;
  parse: (body: string) => ParsedSms | null;
  digest: (value: string) => Promise<string>;
  insertBatch: (rows: BuiltTransaction[]) => Promise<number>;
  onPage: (state: ImportCounters) => Promise<void>;
}

export async function importHistory(options: ImportOptions): Promise<ImportCounters> {
  let senderIndex = options.senderIndex ?? 0;
  let cursor = options.cursor ?? null;
  const state: ImportCounters = {
    scanned: options.scanned ?? 0,
    added: options.added ?? 0,
    review: options.review ?? 0,
    duplicates: options.duplicates ?? 0,
    skipped: 0,
    cancelled: false,
    done: false,
    sender: options.addresses[senderIndex] ?? '',
    senderIndex,
    cursor,
  };
  while (senderIndex < options.addresses.length) {
    if (options.cancelled()) {
      state.cancelled = true;
      state.senderIndex = senderIndex;
      state.cursor = cursor;
      state.sender = options.addresses[senderIndex] ?? '';
      await options.onPage(state);
      return state;
    }
    const sender = options.addresses[senderIndex];
    state.sender = sender;
    const page = await options.readPage({
      senders: [sender],
      since: options.since,
      until: options.until,
      beforeDate: cursor?.date ?? null,
      beforeId: cursor?.id ?? null,
      limit: options.pageSize,
    });
    state.scanned += page.examined;
    const batch: BuiltTransaction[] = [];
    for (const sms of page.messages) {
      const parsed = options.parse(sms.body);
      if (!parsed) {
        state.skipped += 1;
        continue;
      }
      const hash = await options.digest(smsIdentity(sms.sender, sms.receivedAt, sms.body));
      if (options.knownHashes.has(hash)) {
        state.duplicates += 1;
        continue;
      }
      options.knownHashes.add(hash);
      const status = options.autoAdd && parsed.confidence >= 0.9 ? 'auto' as const : 'review' as const;
      if (status === 'review') state.review += 1;
      batch.push({ sourceHash: hash, sender: sms.sender, body: sms.body, receivedAt: sms.receivedAt, parsed, status });
    }
    if (batch.length) {
      const inserted = await options.insertBatch(batch);
      state.added += inserted;
      state.duplicates += Math.max(0, batch.length - inserted);
    }
    const nextCursor = page.next;
    const nextSender = nextCursor ? senderIndex : senderIndex + 1;
    state.senderIndex = nextSender;
    state.cursor = nextCursor;
    await options.onPage({ ...state });
    cursor = nextCursor;
    senderIndex = nextSender;
  }
  state.done = true;
  state.sender = '';
  state.cursor = null;
  return state;
}

export function spanOf(messages: SmsRow[]): { oldest: number | null; latest: number | null } {
  if (!messages.length) return { oldest: null, latest: null };
  const times = messages.map(item => item.receivedAt);
  return { oldest: Math.min(...times), latest: Math.max(...times) };
}
