# UX and AI privacy review (1.1.0-rc.2)

Reviewed on 11 October 2026 by reading the source in `mobile/src` and the dependency list in `mobile/package.json`. This is a source review, not a penetration test or a network capture from a phone.

## AI

| Question | Answer | Evidence |
|----------|--------|----------|
| Does rc.2 ship a machine-learning model? | No. | SmartSort v1 failed three of seven pre-registered gates ([TINY_AI_EVALUATION.md](../research/TINY_AI_EVALUATION.md)). No model file is in `mobile/assets` and no ML runtime is in the dependencies. |
| Can the app download a model later? | No. | There is no download code. `finance/smartsort` returns `isModelAvailable() === false` and `source: 'rules'` for every result. |
| Is OpenJev or any chat LLM present? | No. | Not in dependencies, assets, or source. |
| Is any transaction text sent to an AI service? | No. | The only `fetch` calls in `mobile/src` are in `lib/backup.ts`, and they send AES-encrypted ciphertext to the user's backup endpoint. |
| Does Ask Cashweft use a model? | No. | `finance/assistant/ask.ts` matches question patterns and computes answers from the local ledger. The screen says "Answered on this phone." |
| What can suggestions change on their own? | Nothing. | Category suggestions, transfer suggestions, and Money Paths suggestions are shown as suggestions. The amount, success or failure, OTP rejection, account ownership, transfer and refund treatment, deletion, backup, authentication, and balances are all decided by deterministic rules or by the user. |

## Interface honesty

- Suggested Money Paths use a dashed border, a "Suggested" label, and two buttons ("Not related", "Connect"). Confirmed paths use a solid accent border, a check glyph, and Undo. They differ by line, glyph, and label, so colour is not the only cue.
- Nothing in the interface uses the words "AI", "smart", or a robot symbol.
- About says: "The ledger file itself is not encrypted by Cashweft." The SMS privacy screen says the same. Both are true: `lib/database.ts` opens a plain `expo-sqlite` database. Android's app sandbox and device encryption still apply, but Cashweft adds no encryption at rest.
- The backup screen says the phone encrypts before upload. `lib/backup.ts` uses `expo-crypto` AES with a key that is generated on the phone and stored in the recovery code. The API stores ciphertext only.
- Export says the copy is plain JSON and not the encrypted backup.

## SMS

- OTP and verification messages are rejected by the parser before anything is stored (`classify.ts`, covered by `redesign.test.mjs` and `parser.test.mjs`).
- "Keep message text" is a switch under You → Preferences. When it is off, only parsed fields are kept.
- The SMS-permission-free build (`CASHWEFT_SMS_READER=0`) has no `READ_SMS` or `RECEIVE_SMS` permission. Bank SMS rows and switches are hidden in that build, and Paste a message still works.

## Telemetry

There is no analytics, crash reporting, or telemetry SDK in the dependencies, and no code sends usage data.

## Repository

- The synthetic SmartSort JSONL splits include made-up OTP-style negatives, so they are git-ignored and regenerated from the seed. They are not published as a dataset.
- The experimental model weights are git-ignored.
- No real SMS, account numbers, keystores, or recovery codes are in the repository.

## Open risks

- SQLite is not encrypted at rest. Anyone with a rooted phone or an unlocked device backup could read the ledger.
- Clipboard: Paste a message reads the clipboard only when the user taps it. Android may show its clipboard access notice.
- No independent security audit has been done.
