# Test report

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
