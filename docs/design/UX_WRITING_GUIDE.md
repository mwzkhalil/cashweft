# UX writing guide

Voice: **quiet, plain, exact.** Cashweft talks like a careful friend who is good with numbers: short sentences, no hype, no blame.

## Rules

1. **Lead with the number or the action.** Write "Rs 4,200 spent", not "You have spent a total of Rs 4,200".
2. **Buttons are verbs, 1–3 words, sentence case.** Examples: "Import history", "Save", "Connect".
3. **One idea per sentence.** Explanations go behind an info link, not at the top of a screen.
4. **No jargon or code names.** Never show enum names (`cash_withdrawal`), rails as categories, or internal feature names. Use "ATM cash", "Correction", and "Money Paths".
5. **Be exact about privacy.** Say what happens: "Read on this phone. Not uploaded." Do not say "bank-grade". Never imply SQLite is encrypted. The backup file is encrypted; the local database is protected by Android app storage only.
6. **No exclamation marks, no emoji, no robot or AI language.** Do not write "smart", "AI-powered", or "magic". Suggestions are "Suggested".
7. **Uncertainty is stated, not hidden.** Write "Suggested", "Needs review", "Estimate".
8. **Errors say what happened and what to do.** "Could not read SMS. Try again." Never show a stack trace.
9. **Numbers:** `Rs 1,250`. Use South Asian grouping (`Rs 1,25,000`) when the user picks it. Amounts never wrap.
10. **Dates:** "Today", "Yesterday", then "3 Oct". Show the year only when it differs from now.

## Urdu

- Every user-facing key has an Urdu string in `i18n/copy.ts`.
- Use common Urdu money words: خرچ (spent), آمدن (received), منتقل (moved), جائزہ (review).
- Amounts stay in Latin digits inside an LTR span, so they match bank SMS.
- Urdu strings in this release were written without a native-speaker review. That is recorded as an open item in [USABILITY_VALIDATION.md](../research/USABILITY_VALIDATION.md).

## Word list

| Use | Avoid |
|-----|-------|
| Spent | Debit, outflow |
| Received | Credit, inflow |
| Moved | Transfer (as a total), internal transfer |
| Needs review | Low confidence, uncertain parse |
| Suggested | AI pick, auto-detected |
| Money Paths | Money Threads, weave graph |
| Bank SMS | SMS reader, parser |
| ATM cash | cash_withdrawal |
| Correction | adjustment |
| Estimate | Balance (for cash) |
