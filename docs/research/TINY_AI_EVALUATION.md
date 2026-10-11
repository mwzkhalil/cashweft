# Tiny AI evaluation (SmartSort v1)

## Protocol

1. The pre-registration ([`eval/smartsort/v1/preregistration.json`](../../eval/smartsort/v1/preregistration.json)) was written before the test split was scored.
2. Model settings (hash dimension, regularisation C, threshold) were tuned on validation only ([`tuning_val.json`](../../eval/smartsort/v1/tuning_val.json)). R2's validation scores are 100% because its lexicon includes validation merchants. Validation was used only to choose M's settings.
3. The final model was fit on train plus validation and scored on test once. Results are in [`results_test.json`](../../eval/smartsort/v1/results_test.json).
4. TypeScript parity and timing: [`tools/smartsort/bench.mts`](../../tools/smartsort/bench.mts).

Reproduce:

```
cd mobile
node --import tsx ../tools/smartsort/baseline.mts
cd ../tools/smartsort
python generate.py
python train.py tune
python train.py final 8192 16 0.4 8192 1 0.95
cd ../../mobile
node --import tsx ../tools/smartsort/bench.mts
```

## Metrics

- **Suggestion:** any output other than "Other".
- **Suggestion precision:** correct suggestions divided by all suggestions.
- **Coverage:** rows whose true category is not "Other" that received any suggestion.
- **Accuracy:** abstaining counts as predicting "Other".

## Category suggestion: test split, 468 transaction rows

| System | Accuracy | Macro F1 | Precision | Coverage | Suggestions |
|--------|----------|----------|-----------|----------|-------------|
| R1 shipped | 0.500 | 0.541 | 0.707 | 0.660 | 297 |
| R2 revised rules | 0.784 | 0.804 | 0.886 | 0.868 | 387 |
| M (threshold 0.4) | 0.694 | 0.659 | 0.921 | 0.727 | 316 |
| R2 + M | 0.833 | 0.871 | 0.889 | 0.926 | 414 |

Per test family (precision / coverage):

| Family | R1 | R2 | R2 + M |
|--------|----|----|--------|
| Raast QR | 0.442 / 1.000 | 0.718 / 1.000 | 0.718 / 1.000 |
| Wallet merchant | 1.000 / 0.486 | 1.000 / 0.792 | 1.000 / 0.882 |
| Terse card alert | 1.000 / 0.493 | 1.000 / 0.813 | 0.985 / 0.896 |

End to end, counting only messages the parser accepts (273 of 468), category precision rises from 0.578 (R1) to 0.821 (R2).

## Missed-message flag: test split

| Measure | Value |
|---------|-------|
| Transactions rejected by rules | 195 of 468 |
| Flagged by model at threshold 0.95 | 25.6% |
| False flags on 175 non-OTP negatives | 0.0% |
| Negatives wrongly *accepted* by rules | 50 (scheduled auto-debit 25, "under process" 25) |

## Gate decision

| Gate | Required | Measured | Result |
|------|----------|----------|--------|
| Coverage gain of R2+M over R2 | ≥ 10.0 points | 5.8 | Fail |
| R2+M suggestion precision | ≥ 0.90 | 0.889 | Fail |
| Precision drop vs R2 | ≤ 2 points | −0.3 (improved) | Pass |
| Model size | ≤ 1 MB | 153,848 bytes | Pass |
| Warm p95 (Node) | ≤ 5 ms | 0.256 ms | Pass |
| Flag recall of rule-missed messages | ≥ 0.50 | 0.256 | Fail |
| False-flag rate | ≤ 0.02 | 0.000 | Pass |

**Result: model not shipped.** R2 beats R1 on every metric and ships as the deterministic category rules.

## Post-fix rule check (not held-out)

After the test split exposed the scheduled-debit, "under process", Raast-rail, and POS issues, the rules were fixed. Numbers measured after the fix on the same split are optimistic, because the fixes were written knowing the failures. They are reported in the release test report, not as evidence of generalisation. A v2 set with new families is needed for a clean measure.

Source: [`postfix_rules.json`](../../eval/smartsort/v1/postfix_rules.json), produced by [`tools/smartsort/postfix.mts`](../../tools/smartsort/postfix.mts).

| Test split, 468 rows (not held-out) | Before fix (R1) | After fix (shipped rules) |
|------|------|------|
| Category accuracy | 0.500 | 0.810 |
| Suggestion precision | 0.707 | 1.000 |
| Coverage | 0.635 | 0.733 |
| Transactions missed by the gate | 195 | 78 |
| Negatives wrongly accepted | 50 | 0 |

All 78 remaining misses are terse card alerts with no direction word, such as "Txn PKR 30,550 Kausar Grocers card9300". The rules do not guess a direction for these, because a wrong debit or credit changes the balance. They stay unparsed and can be added by hand or pasted.

The shipped `finance/smartsort` module is a rules-only interface. `isModelAvailable()` returns `false`, and every result has `source: 'rules'`. No model file is bundled or downloaded.
