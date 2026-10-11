# Current product audit

Audited build: `main` at `cce43ba` (Cashweft 1.1.0-rc.1), plus the uncommitted inset and icon fixes in the working tree on 2026-10-11.

Method: source reading of every route in `mobile/src/app`, the shared UI kit, theme, copy, parser and accounting modules; one user screenshot of the Home screen on a physical Android phone (supplied by the project owner, device model not recorded); deterministic evaluation of the parser on the synthetic set described in [TINY_AI_DATASET.md](TINY_AI_DATASET.md).

No usability sessions, analytics, or crash data exist. Nothing below is a measured user statistic.

## Status labels

- **Verified**: reproduced in source or in a measured run.
- **Reported**: seen in the owner's screenshot; root cause confirmed in source.
- **Suspected**: plausible from source, not yet observed on a device.

## Navigation and layout

| # | Finding | Status | Evidence |
|---|---------|--------|----------|
| N1 | Tab bar hid content and was partly covered by the Android navigation buttons. | Reported, root cause verified | `(tabs)/_layout.tsx` at `cce43ba` set `tabBarStyle: { height: 72, paddingTop: 8, paddingBottom: 8 }`. A fixed height overrides the inset-aware height React Navigation computes, so with edge-to-edge drawing the bottom system bar overlaps the tab bar. Fixed in the working tree using `useSafeAreaInsets()`. |
| N2 | The "You" tab icon was a letter K with a dot, the legacy Kharcha mark. | Verified | `ui/Icon.tsx` at `cce43ba`: `you` path `M5 3h4v9l5-6h5l-6 7 6 8h-5l-5-7v7H5V3Z` plus a circle. Replaced by a person glyph in the working tree. |
| N3 | Five tabs (Home, Activity, Insights, Budgets, You). Budgets is a whole destination for a feature most users touch monthly. | Verified | `items` array in `(tabs)/_layout.tsx`. Material 3 allows 3–5 destinations; five leaves 72dp per item at 360dp. |
| N4 | Tab labels were 10sp text inside the icon slot with `tabBarShowLabel: false`; the label is not the system label. | Verified | Same file. 10sp is below the 11–12sp used by Material 3 navigation labels. |
| N5 | Screen bottom padding did not include the system inset on stack screens. | Verified | `Kit.tsx` `Screen` used fixed bottom padding. Fixed in the working tree (`24 + insets.bottom`, tabs use 16 because the tab bar already owns the inset). |
| N6 | No layout adapts at 600dp+; content stretches edge to edge on tablets and foldables. | Verified | No width breakpoints anywhere in `src/ui` or `src/app`. |

## Information density

Counts below are components in each route file, used as a proxy for how much prose a screen shows.

| Screen | Caption | Body | Buttons | Notes |
|--------|---------|------|---------|-------|
| Money Threads | 10 | 4 | 2 | Opening paragraph, three-line totals, evidence lines, "Confidence" numbers. Heaviest text screen. |
| SMS history | 5 | 3 | 12 | Many states share one route; buttons are correct per state but the file holds 12. |
| Home (before fix) | 4 | 4 | 4 | Tagline, INR caption, three full-width buttons stacked under the list. |
| SMS | 2 | 2 | 6 | Five actions on one screen. |
| Sender | 1 | 2 | 6 | Six actions for one sender. |
| Backup | 1 | 2 | 4 | Recovery code shown as body text. |

| # | Finding | Status |
|---|---------|--------|
| D1 | Home "Latest" repeats what Activity already lists; Home has no single headline number besides the month slip. | Verified |
| D2 | Many screens open with a muted explanatory sentence before any content (Threads, Ask, Cash, Accounts, Import, Data). | Verified |
| D3 | Insights expresses "Cash and digital" as a sentence rather than a visual. | Verified |
| D4 | About lists every provider by name. Long list, no task value. | Verified |
| D5 | Categories have colour dots only; no glyphs, so colour is the only cue. Fails "do not rely on colour alone" for low-vision and colour-blind users. | Verified |

## Forms and wording

| # | Finding | Status | Evidence |
|---|---------|--------|----------|
| F1 | Add screen shows raw enum names: `cash withdrawal`, `adjustment`, `refund`, `fee` as chips produced by `value.replaceAll('_', ' ')`. | Verified | `manual.tsx` line 33. |
| F2 | Accounts screen shows `bank`, `wallet`, `cash` in lowercase enum form and only the first eight providers. | Verified | `accounts.tsx` lines 35, 39. |
| F3 | Category picker shows 21 chips at once with no grouping or recent-first ordering. | Verified | `Forms.tsx` `CategoryPicker`. |
| F4 | Cash screen is a dense form with several fields at once. | Verified | `cash.tsx`. |
| F5 | Ask is a blank text field; no suggested questions, answers are text only. | Verified | `ask.tsx`. NN/g recognition-over-recall applies. |
| F6 | Some chips and toggles are 36–44dp tall (Threads section chips 36dp, Insights period 44dp, language 44dp). | Verified | Below the 48dp Android recommendation. |

## Parsing and categorisation

Measured on the synthetic held-out split (`eval/smartsort/v1`, 468 transaction messages, 200 hard negatives). Synthetic text only; real-world rates are unknown.

| # | Finding | Status | Measurement |
|---|---------|--------|-------------|
| P1 | Category rules contain India-only brands (swiggy, zomato, blinkit, zepto, irctc, airtel, jio, flipkart, ola). They do not help Pakistani users and `ola` can collide with words. | Verified | `finance/parser/categories.ts`. |
| P2 | Category rules know few Pakistani brands. | Verified | Shipped rules: 50.0% accuracy, 71% suggestion precision, 66% coverage on unseen merchants. |
| P3 | `metro` maps to Transport, so "Metro Cash and Carry" is filed as Transport. | Verified | Rule order in `categories.ts`. |
| P4 | Any message containing `raast`, `ibft`, or `transfer` falls back to Transfers even when it pays a shop by Raast QR. Raast QR messages: 44% suggestion precision. | Verified | `per_family.raast_qr_en` in `results_test.json`. |
| P5 | "Auto-debit of Rs X for Y scheduled on DATE" is recorded as spending. | Verified | 25/25 test rows accepted by `parseBankSms`. Money-correctness bug. |
| P6 | "Raast transfer Rs X ... under process" is recorded as spending; only "in process" is treated as pending. | Verified | 25/25 test rows accepted. Money-correctness bug. |
| P7 | Terse card alerts without a verb ("POS Rs500 KFC *1234") are dropped. | Verified | 156/156 test rows rejected. Safe failure (nothing wrong is recorded) but a coverage gap. |

## Accessibility

| # | Finding | Status |
|---|---------|--------|
| A1 | Default theme is dark unless the system reports light; there is no explicit theme choice. | Verified (`usePalette`) |
| A2 | Tab items announce a label; icon-only buttons in the kit accept labels; some Pressables lack `accessibilityLabel` (Threads section chips). | Verified |
| A3 | No reduced-motion handling; `SummarySlip` animates progress unconditionally. | Verified |
| A4 | Urdu copy exists for tab labels and some strings, but layouts do not mirror and many screens are English only. | Verified |

## Privacy and trust

| # | Finding | Status |
|---|---------|--------|
| T1 | SMS privacy copy is accurate: processed on the phone, OTP rejected, no upload, backup separately encrypted, SQLite itself not encrypted by Cashweft. | Verified (`sms-privacy.tsx`) |
| T2 | No AI is shipped in 1.1.0-rc.1; README and docs no longer advertise OpenJev. | Verified |
| T3 | Suggested Money Threads and confirmed ones share the same visual style apart from text. | Verified (`threads.tsx` `Weave`) |

## Brand

| # | Finding | Status |
|---|---------|--------|
| B1 | `branding.test.mjs` already forbids "kharcha" in `src/app`, `src/ui`, and `i18n/copy.ts`, but did not check icon artwork, which is how the K survived. | Verified |
| B2 | Official woven C mark is used by `Logo.tsx` and `BrandLockup`. Palette in `theme.ts` matches the brand guide. | Verified |

## What works and should be kept

- Integer minor units, explicit transaction types, and `countsAsExpense` are sound.
- Bank SMS History: explicit ranges, unknown senders unchecked, resumable jobs, duplicate-safe hashing.
- Money Threads decisions are deterministic and explainable.
- Personal category memory (`categoryFromMemory`, two-hit minimum) already personalises categories without any model.
