export interface SmsRow {
  id: number;
  sender: string;
  body: string;
  receivedAt: number;
}

export interface PageRequest {
  since: number;
  until: number;
  beforeDate?: number | null;
  beforeId?: number | null;
  limit: number;
  senders?: string[];
}

export interface PageResult {
  messages: SmsRow[];
  examined: number;
  next: { date: number; id: number } | null;
}

export function normalizeSender(value: string): string {
  return value.trim().toUpperCase().replace(/^[A-Z]{2}-/, '');
}

export function pageMessages(rows: SmsRow[], request: PageRequest): PageResult {
  const allowed = (request.senders ?? []).map(normalizeSender).filter(Boolean);
  const limit = Math.max(1, Math.min(500, Math.floor(request.limit)));
  const ordered = [...rows].sort((left, right) => right.receivedAt - left.receivedAt || right.id - left.id);
  const inWindow = ordered.filter(row => {
    if (row.receivedAt < request.since || row.receivedAt > request.until) return false;
    if (request.beforeDate != null && request.beforeId != null) {
      if (row.receivedAt > request.beforeDate) return false;
      if (row.receivedAt === request.beforeDate && row.id >= request.beforeId) return false;
    }
    return true;
  });
  const page = inWindow.slice(0, limit);
  const messages = allowed.length ? page.filter(row => allowed.includes(normalizeSender(row.sender))) : page;
  const last = page[page.length - 1];
  return {
    messages,
    examined: page.length,
    next: page.length === limit && last ? { date: last.receivedAt, id: last.id } : null,
  };
}
