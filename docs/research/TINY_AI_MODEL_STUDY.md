# Tiny AI model study

Question: can a tiny on-device model improve Cashweft beyond deterministic rules, under these constraints?

- Under 1 MB preferred (5 MB acceptable).
- Offline, lazily loaded, abstains on low confidence.
- The app works fully without it.
- No cloud, no hidden download, no telemetry.

**Decision: do not ship a model in 1.1.0-rc.2.** A model passed size and speed but failed the pre-registered accuracy gates. A revised deterministic rule set beat the shipped rules by a wide margin and ships instead.

## Where AI is allowed and where it is not

The model may only *suggest*. It never decides:

- the amount;
- success or failure;
- OTP retention;
- account ownership;
- transfer or refund accounting;
- deletion, backup, or authentication;
- the balance.

OTP rows are removed before any model sees them, and the deterministic OTP rule in `finance/parser/classify.ts` decides alone.

Two narrow tasks were studied:

1. **Category suggestion.** For a parsed debit, propose a spending category when the rules say "Other".
2. **Missed-message flag.** When the rules reject a message, flag it for Review if it looks like a real transaction. It never adds the entry by itself.

## Candidates

| ID | Candidate | Status |
|----|-----------|--------|
| R1 | Shipped `categoryFor()` and `parseBankSms()` | Measured |
| R2 | Revised rules: a Pakistan brand lexicon built only from train and validation merchants, generic shop words, India-only brands removed, and merchant matched before message body | Measured |
| M | Hashed character 2–4-gram plus word uni/bigram features, multinomial logistic regression, int8 weights, pure TypeScript inference | Measured |
| FT | fastText supervised with quantisation ([FAQ](https://fasttext.cc/docs/en/faqs.html)) | **Not measured.** No prebuilt Python 3.13 Windows wheel; source build of `fasttext-wheel 0.9.2` failed. On Android it would also need a native JNI library. |
| TF | TFLite through MediaPipe Text Classifier ([guide](https://ai.google.dev/edge/mediapipe/solutions/text/text_classifier)) | **Not measured.** Needs TensorFlow (a several-hundred-MB install) and the `tasks-text` native dependency. Google publishes 0.14 ms CPU latency on a Pixel 6 for its average-word-embedding model. That is a vendor figure for a different model, not ours. |

M was chosen as the learned candidate because it has no runtime dependency: weights are a base64 string and inference is about 40 lines of TypeScript, so it adds no native code to the APK.

## Results (held-out test split, scored once)

The full numbers are in [TINY_AI_EVALUATION.md](TINY_AI_EVALUATION.md).

| System | Accuracy | Suggestion precision | Coverage |
|--------|----------|---------------------|----------|
| R1 shipped rules | 50.0% | 70.7% | 66.0% |
| R2 revised rules | 78.4% | 88.6% | 86.8% |
| M model alone | 69.4% | 92.1% | 72.7% |
| R2 + M fallback | 83.3% | 88.9% | 92.6% |

Gate: R2+M needed at least +10 points of coverage over R2 and at least 90% precision. It reached +5.8 points and 88.9%. **Fail.**

Missed-message flag: it caught 25.6% of rule-missed transactions with 0% false flags; the gate needed 50%. **Fail.**

Engineering measurements for M (Node 26.1.0, Windows x64 desktop; not a phone):

| Measure | Value |
|---------|-------|
| File size (JSON with base64 int8 weights) | 153,848 bytes |
| Raw weight bytes | 114,688 |
| Load time | 1.04 ms |
| Warm latency p50 / p95 | 0.126 / 0.256 ms |
| Parity with Python float model | 199/200 same top label, max probability delta 0.01 |

## Why rules won

- Most of the category signal is in the merchant name, and merchant names are a short, auditable list. A Pakistani brand lexicon plus generic shop words ("Medical Store", "Filling Station", "Karyana") covers most cases with transparent behaviour.
- The model's extra coverage came from character patterns in unseen names, but at about 88–92% precision. A wrong category is a visible error the user must fix.
- The app already learns personal categories from corrections (`categoryFromMemory`, two-hit minimum). That covers the "my local shop" case better than a global model can.

## What the study found that matters more than AI

Deterministic bugs found on the test split:

1. "Auto-debit … scheduled on" and "… under process" were recorded as spending (25/25 each). They will be fixed in rules.
2. Raast QR merchant payments fell back to "Transfers" because the rail name was treated as a category. They will be fixed by never using rail words as a spending category when a merchant is known.
3. Terse "POS Rs… MERCHANT" alerts were dropped. The fix is to treat `POS` as debit evidence; verbless "Txn …" alerts stay dropped because direction is unknown.

These fixes were designed after the test split was seen. The test numbers above are pre-fix; post-fix numbers on this split are reported separately and labelled as not held-out.

## Interface reserved for a future model

`finance/smartsort/index.ts` exposes the interface the brief requires. It always returns the deterministic answer and reports that no model is available:

- `classifyFinancialText(text)`
- `suggestCategory(merchant, body)`
- `getModelInfo()`
- `isModelAvailable()`

A future model can sit behind it without UI changes, but only after it passes a fresh evaluation on new template families and real, consented data.
