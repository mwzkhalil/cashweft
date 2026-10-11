import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { categoryFor, parseBankSms } from '../../mobile/src/finance/parser/index.ts';
import { extractMerchant } from '../../mobile/src/finance/parser/merchants.ts';
import { normalizeMessage } from '../../mobile/src/finance/parser/normalize.ts';

const root = resolve(import.meta.dirname, '../../eval/smartsort/v1');

type Row = { id: string; family: string; label: string; financial: boolean; text: string };
type Before = { id: string; parsed: boolean; r1_any: string };

function category(rows: Row[], predict: (row: Row) => string) {
  const money = rows.filter(row => row.financial);
  const guesses = money.map(row => ({ row, guess: predict(row) }));
  const suggested = guesses.filter(item => item.guess !== 'Other');
  const right = (item: { row: Row; guess: string }) => item.guess === item.row.label;
  return {
    rows: money.length,
    accuracy: +(guesses.filter(right).length / money.length).toFixed(4),
    suggestion_precision: +(suggested.filter(right).length / Math.max(1, suggested.length)).toFixed(4),
    coverage: +(suggested.length / money.length).toFixed(4),
  };
}

function gate(rows: Row[], accepted: (row: Row) => boolean) {
  const money = rows.filter(row => row.financial);
  const other = rows.filter(row => !row.financial);
  const falseAccepts: Record<string, number> = {};
  for (const row of other.filter(accepted)) falseAccepts[row.family] = (falseAccepts[row.family] ?? 0) + 1;
  return {
    transactions: money.length,
    missed: money.filter(row => !accepted(row)).length,
    negatives: other.length,
    false_accepts: Object.values(falseAccepts).reduce((sum, value) => sum + value, 0),
    false_accepts_by_family: falseAccepts,
  };
}

const report: Record<string, unknown> = {
  note: 'Post-fix rules were changed after the test split was seen. These numbers are NOT held-out and must not be compared as an unbiased estimate.',
};
for (const split of ['val', 'test']) {
  const rows: Row[] = readFileSync(resolve(root, `${split}.jsonl`), 'utf8').trim().split('\n').map(line => JSON.parse(line));
  const before = new Map((JSON.parse(readFileSync(resolve(root, `rules_${split}.json`), 'utf8')) as Before[]).map(item => [item.id, item]));
  const after = (row: Row) => categoryFor(extractMerchant(normalizeMessage(row.text)), normalizeMessage(row.text));
  report[split] = {
    category_before: category(rows, row => before.get(row.id)?.r1_any ?? 'Other'),
    category_after: category(rows, after),
    gate_before: gate(rows, row => Boolean(before.get(row.id)?.parsed)),
    gate_after: gate(rows, row => Boolean(parseBankSms(row.text))),
  };
}
writeFileSync(resolve(root, 'postfix_rules.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
