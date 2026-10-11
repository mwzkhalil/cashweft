import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { categoryFor, parseBankSms } from '../../mobile/src/finance/parser/index.ts';
import { extractMerchant } from '../../mobile/src/finance/parser/merchants.ts';
import { normalizeMessage } from '../../mobile/src/finance/parser/normalize.ts';
import { categoryForV2 } from './rulesV2.ts';

const root = resolve(import.meta.dirname, '../../eval/smartsort/v1');

for (const split of ['train', 'val', 'test']) {
  const rows = readFileSync(resolve(root, `${split}.jsonl`), 'utf8').trim().split('\n').map(line => JSON.parse(line));
  const out = rows.map(row => {
    const parsed = parseBankSms(row.text);
    const text = normalizeMessage(row.text);
    const merchant = extractMerchant(text);
    return {
      id: row.id,
      parsed: Boolean(parsed),
      merchant,
      r1: parsed?.category ?? null,
      r2: parsed ? categoryForV2(merchant, text) : null,
      r1_any: categoryFor(merchant, text),
      r2_any: categoryForV2(merchant, text),
    };
  });
  writeFileSync(resolve(root, `rules_${split}.json`), JSON.stringify(out));
  console.log(split, out.length, 'parsed', out.filter(item => item.parsed).length);
}
