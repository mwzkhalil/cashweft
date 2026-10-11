# Test report

## 1.1.0-rc.2 (11 October 2026)

Run from this workspace on Windows with Node v26.1.0. No phone or emulator was attached.

| Check | Result |
|-------|--------|
| `mobile`: `npm test` | 70 passed, 0 failed |
| `mobile`: `npx tsc --noEmit -p .` | Passed |
| `mobile`: `npm run lint` | Exit 0, no problems |
| `api`: `npm test` | 3 passed |
| `api`: `npm run typecheck`, `npm run build` | Passed |
| Release APKs | Both built and verified; see [APK verification](release/APK_VERIFICATION_1.1.0-rc.2.md) |

New in `test/redesign.test.mjs` (18 tests):

- Navigation: four tabs and no Budgets route, inset-aware tab bar height, tab screen padding, the wide rail, and no K path or emoji glyphs.
- Language: English and Urdu catalogs have the same keys and placeholders, `fill()` adds bidi isolates, and tab files avoid left and right margins.
- Theme: preference resolution and snapshot migration.
- Labels: plain type labels and direction-specific type lists.
- Money: `periodSummary`, `matchesView`, and `groupByDay`.
- SmartSort: the interface reports no model and returns rule results.
- Parser: OTP rejection; "scheduled" and "under process" rejection, while "has been paid … next bill due" still parses; POS debits; processing fees; trailing balance; and rail-only Transfers.

One existing parser test was changed. It expected the India-only "zomato" rule, which was removed, and now expects "Other".

Rule quality after the parser fixes, measured on the synthetic SmartSort test split (not held-out, because the fixes were written after seeing that split):

| Measure | Before | After |
|---------|--------|-------|
| Category accuracy | 0.500 | 0.810 |
| Suggestion precision | 0.707 | 1.000 |
| Coverage | 0.635 | 0.733 |
| Transactions missed | 195 of 468 | 78 of 468 |
| Negatives wrongly accepted | 50 of 200 | 0 of 200 |

The interface was checked in the Expo web build with an invented ledger; see [USABILITY_VALIDATION.md](design/USABILITY_VALIDATION.md). That is not a usability study and not a phone test.

## 1.0.x

Run on 7 October 2026 from this workspace. Node is v26.1.0. These are the commands that were executed, not a device lab.

## Mobile (`mobile`)

`npm test` — 31 passed, 0 failed, on 8 October 2026.

Covered: existing debit/credit fixtures, PKR amounts, Urdu digits, Roman Urdu, balance versus transaction amount, refunds, ATM cash, failed and pending rejection, OTP and promo rejection, provider evidence levels, transfer suggestions, cash estimate, merchant memory, recurring payments, budget pace, duplicate hints, Ask Cashweft in English, Urdu, and Roman Urdu, unsafe question text, schema 1 INR migration, tampered snapshots, both recovery-code prefixes, storage-key fallback, and the absence of the previous product name on primary screens.

The batch test parses 2,000 synthetic messages and fails if that loop takes 3 seconds or more. In the passing run the test completed in about 126ms on this Windows Node process. That number is not a phone benchmark.

`npm run typecheck` — passed after the app config cast.

`npm run lint` — 0 errors. Duplicate-import and array-type warnings from the first lint pass were removed.

## API (`api`)

`npm ci`, then `npm test` — 3 passed: bearer token required, stale version rejected, token stored only as a hash, malformed bodies rejected.

`npm run typecheck` — passed.

`npm run lint` after the warning fix — exit 0, no reported problems.

## Android

`gradlew assembleRelease` for `app.cashweft.mobile` succeeded on 8 October 2026 with `GRADLE_USER_HOME=D:\g`. `CashweftSms` compiled. The APK at `D:\cashweft-final.apk` is 63,467,642 bytes, signed with the local test certificate `CN=Cashweft Local Test`, and contains a Hermes `assets/index.android.bundle` (2,687,528 bytes). It is not debuggable. ABIs are `armeabi-v7a` and `arm64-v8a`.

A debug APK from 7 October 2026 does not embed the JavaScript bundle. Do not install that one.

No emulator or physical device was attached, so launch on a phone was not executed.
