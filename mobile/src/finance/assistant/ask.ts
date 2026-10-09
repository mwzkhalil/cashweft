import type { Transaction } from '../../lib/model';
import { countsAsExpense, incomeTotal, netSpend } from '../accounting/ledger';
import { formatMoney } from '../../lib/money';
import { foldRomanUrdu, normalizeMessage } from '../parser/normalize';

export interface AssistantAnswer {
  intent: string;
  text: string;
  confident: boolean;
}

interface Range { from: number; to: number; label: string }

function monthRange(anchor: Date, shift: number): Range {
  const start = new Date(anchor.getFullYear(), anchor.getMonth() + shift, 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + shift + 1, 1);
  const label = shift === 0 ? 'this month' : 'last month';
  return { from: start.getTime(), to: end.getTime(), label };
}

function detectRange(text: string, now: number): Range | null {
  const folded = foldRomanUrdu(text);
  const anchor = new Date(now);
  if (/اس مہینے|is mahine|is mahina|this month/.test(folded) || /اس مہینے/.test(text)) return monthRange(anchor, 0);
  if (/پچھلے مہینے|pichle mahine|pichle mahina|last month/.test(folded) || /پچھلے مہینے/.test(text)) return monthRange(anchor, -1);
  if (/this week|is hafta|اس ہفتے/.test(folded) || /اس ہفتے/.test(text)) {
    const day = (anchor.getDay() + 6) % 7;
    const start = new Date(anchor);
    start.setDate(anchor.getDate() - day);
    start.setHours(0, 0, 0, 0);
    return { from: start.getTime(), to: now + 1, label: 'this week' };
  }
  if (/\bmonth\s+(\d{1,2})\b/.test(folded)) return null;
  return monthRange(anchor, 0);
}

function inRange(transactions: Transaction[], range: Range): Transaction[] {
  return transactions.filter(item => item.occurredAt >= range.from && item.occurredAt < range.to && item.status !== 'ignored');
}

const CATEGORIES = [
  'groceries', 'food', 'transport', 'fuel', 'utilities', 'healthcare', 'shopping', 'rent', 'entertainment',
];

export function buildSpendQuery(filter: { from: number; to: number; category?: string }): { sql: string; params: (string | number)[] } {
  const params: (string | number)[] = [filter.from, filter.to];
  let sql = `SELECT COALESCE(SUM(amount_minor), 0) AS total FROM transactions
    WHERE occurred_at >= ? AND occurred_at < ? AND status != 'ignored'
    AND transaction_type IN ('expense', 'fee')`;
  if (filter.category) {
    sql += ' AND category = ?';
    params.push(filter.category);
  }
  return { sql, params };
}

export function answerQuestion(query: string, transactions: Transaction[], now = Date.now()): AssistantAnswer {
  const text = normalizeMessage(query);
  const folded = foldRomanUrdu(text);
  if (!text || /drop\s+table|union\s+select|;\s*delete/i.test(text)) {
    return { intent: 'rejected', text: 'I can only answer questions about your ledger. I do not run commands from the question.', confident: false };
  }
  if (/\bmonth\s+(\d{1,2})\b/.test(folded)) {
    const month = Number(folded.match(/\bmonth\s+(\d{1,2})\b/)?.[1]);
    if (month < 1 || month > 12) return { intent: 'invalid_date', text: 'That month is not valid.', confident: false };
  }
  const spendish = /spend|spent|kharcha|خرچ|expense|kitna|کتنا|compare|biggest|jazzcash|grocery|groceries/.test(folded) || /خرچ|کتنا/.test(text);
  if (!spendish) {
    return { intent: 'unsupported', text: 'I can answer spending, income, category, merchant, and month comparisons from this phone. I cannot answer that yet.', confident: false };
  }
  const range = detectRange(text, now);
  if (!range) return { intent: 'invalid_date', text: 'I could not find a reliable date range in that question.', confident: false };
  const rows = inRange(transactions, range);
  if (!transactions.length) return { intent: 'empty', text: 'There is no ledger history on this phone yet, so this answer is not reliable.', confident: false };
  if (/compare|موازنہ|muwazana|vs last/.test(folded)) {
    const current = netSpend(inRange(transactions, monthRange(new Date(now), 0)));
    const previous = netSpend(inRange(transactions, monthRange(new Date(now), -1)));
    return {
      intent: 'compare_months',
      text: `Spending ${formatMoney(current)} this month and ${formatMoney(previous)} last month. Transfers and cash withdrawals are excluded.`,
      confident: previous > 0 || current > 0,
    };
  }
  if (/biggest|سب سے بڑا/.test(folded) || /سب سے بڑا/.test(text)) {
    const expenses = rows.filter(countsAsExpense);
    if (!expenses.length) return { intent: 'biggest', text: `No expenses in ${range.label}.`, confident: true };
    const top = expenses.reduce((best, item) => item.amountMinor > best.amountMinor ? item : best);
    return { intent: 'biggest', text: `Biggest expense ${range.label} is ${top.merchant}, ${formatMoney(top.amountMinor, top.currency)}.`, confident: true };
  }
  if (/income|salary|تنخواہ|amdani/.test(folded)) {
    return { intent: 'income', text: `Income ${range.label}: ${formatMoney(incomeTotal(rows))}. Refunds and linked transfers are not included.`, confident: true };
  }
  const category = CATEGORIES.find(name => folded.includes(name));
  const merchant = /jazzcash|jazz cash|easypaisa|sadapay/.exec(folded)?.[0];
  let subset = rows.filter(countsAsExpense);
  if (category === 'food') subset = subset.filter(item => item.category === 'Food and Restaurants');
  else if (category) subset = subset.filter(item => item.category.toLowerCase().includes(category));
  if (merchant) subset = rows.filter(item => `${item.merchant} ${item.sender ?? ''} ${item.providerId ?? ''}`.toLowerCase().includes(merchant.replace(' ', '')));
  const total = merchant ? subset.reduce((sum, item) => sum + item.amountMinor, 0) : netSpend(subset);
  if (!subset.length) return { intent: 'spend_total', text: `I found no matching expenses for ${range.label}.`, confident: true };
  const label = merchant ?? category ?? 'spending';
  return { intent: 'spend_total', text: `${label} ${range.label}: ${formatMoney(total)}. This uses expense and fee entries only.`, confident: true };
}
