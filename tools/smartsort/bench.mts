import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const root = resolve(import.meta.dirname, '../../eval/smartsort/v1');
const DIGITS = /[0-9\u0660-\u0669\u06F0-\u06F9]+/g;
const WORDS = /[a-z0-9\u0600-\u06ff]+/g;

function fnv1a(text: string): number {
  let value = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(text)) {
    value ^= byte;
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

function grams(text: string, prefix: string): string[] {
  const words = text.normalize('NFKC').toLowerCase().replace(DIGITS, '0').match(WORDS) ?? [];
  const out: string[] = [];
  words.forEach((word, index) => {
    out.push(`${prefix}w:${word}`);
    if (index) out.push(`${prefix}b:${words[index - 1]} ${word}`);
    const padded = `<${word}>`;
    for (const size of [2, 3, 4]) for (let start = 0; start <= Math.max(0, padded.length - size); start += 1) out.push(`${prefix}c:${padded.slice(start, start + size)}`);
  });
  return out;
}

function load(path: string) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const weights = new Int8Array(Buffer.from(raw.weights, 'base64'));
  return { ...raw, weights } as { dim: number; classes: string[]; scale: number[]; bias: number[]; weights: Int8Array };
}

function classify(model: ReturnType<typeof load>, body: string, merchant: string) {
  const counts = new Map<number, number>();
  for (const item of [...grams(body, ''), ...grams(merchant, 'm')]) {
    const key = fnv1a(item) % model.dim;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const norm = Math.sqrt([...counts.values()].reduce((sum, value) => sum + value * value, 0)) || 1;
  const logits = model.bias.map((bias, row) => {
    let total = 0;
    for (const [key, value] of counts) total += model.weights[row * model.dim + key] * value;
    return bias + total * model.scale[row] / norm;
  });
  const top = Math.max(...logits);
  const exp = logits.map(value => Math.exp(value - top));
  const sum = exp.reduce((a, b) => a + b, 0);
  const index = exp.indexOf(Math.max(...exp));
  return { label: model.classes[index], p: exp[index] / sum };
}

const path = resolve(root, 'model/category.json');
const started = performance.now();
const model = load(path);
const loadMs = performance.now() - started;
const sample = JSON.parse(readFileSync(resolve(root, 'parity_sample.json'), 'utf8')) as { text: string; merchant: string; top: string; p: number }[];
let same = 0;
let maxDelta = 0;
for (const row of sample) {
  const result = classify(model, row.text, row.merchant);
  if (result.label === row.top) same += 1;
  maxDelta = Math.max(maxDelta, Math.abs(result.p - row.p));
}
const timings: number[] = [];
for (let round = 0; round < 5; round += 1) for (const row of sample) {
  const t = performance.now();
  classify(model, row.text, row.merchant);
  timings.push(performance.now() - t);
}
timings.sort((a, b) => a - b);
const pick = (q: number) => timings[Math.floor(q * (timings.length - 1))];
const heapMb = process.memoryUsage().heapUsed / 1048576;
console.log(JSON.stringify({
  file_bytes: statSync(path).size,
  weight_bytes: model.weights.byteLength,
  load_ms: Number(loadMs.toFixed(2)),
  parity_top_label: `${same}/${sample.length}`,
  parity_max_probability_delta: Number(maxDelta.toFixed(4)),
  warm_p50_ms: Number(pick(0.5).toFixed(3)),
  warm_p95_ms: Number(pick(0.95).toFixed(3)),
  heap_used_mb: Number(heapMb.toFixed(1)),
  runtime: `node ${process.version} ${process.platform} ${process.arch}`,
}, null, 1));
