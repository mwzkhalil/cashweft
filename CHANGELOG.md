# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.0-rc.2] - 2026-10-11

Release candidate for the redesigned interface. Not tested on a physical phone. v1.0.2 remains the stable release.

### Changed

- Four tabs: Home, Activity, Insights, You. Budgets moved into Insights as a Spending | Budgets switch.
- The tab bar height follows the phone's navigation inset, and screens pad for it, so content is no longer hidden behind the system buttons.
- At 600dp and wider the tabs become a side rail and content is centred.
- The You tab uses a person glyph. The legacy K mark is gone.
- Home shows one summary card: Spent this month (true spend), Received, Moved, and the cash estimate, with up to three items that need attention.
- Activity has filter chips (All, Spent, Received, Moved, Review), day groups, and one collapsible card for possible moves.
- Money Threads is now called Money Paths. Suggested paths have a dashed border and a "Suggested" label. Confirmed paths have a solid border and a check. Its totals match Home.
- Every category has its own glyph, so colour is not the only cue.
- Add an entry starts with the amount, shows recent categories first, and uses plain type names such as "Move between my accounts" and "ATM cash".
- Ask Cashweft offers suggested questions and answers in a card.
- Bank SMS settings and senders live on one Bank SMS screen.
- Theme choice (System, Light, Dark) under You.
- Urdu mirrors layout and chevrons; amounts stay left to right. Inserted values are wrapped in bidi isolates.
- Chips and icon buttons are at least 48dp. Progress animations respect Reduce motion.

### Fixed

- "Auto-debit ... scheduled on" and "will be debited" messages are no longer recorded as spending.
- "Under process" transfers are treated as pending.
- Card alerts that start with POS are read as debits.
- A trailing "Bal" or "Balance" figure is not taken as the amount.
- Shop payments made by Raast QR are no longer filed as Transfers when the shop name is known. India-only brand rules were removed and Pakistani brands added.

### Not included

- No on-device model. The SmartSort study did not pass its pre-registered gates, so categories use the revised rules only.

## [1.1.0-rc.1] - 2026-10-11

Release candidate. Physical-device inbox validation is still pending. No institution is marked verified from a real bank message.

### Bank SMS History

- Import older bank and wallet SMS already stored on Android
- 30-day, 90-day, 1-year, all-history and custom date ranges
- Discover financial senders locally
- Select which senders to import
- Backfill newly added senders independently
- Resume interrupted imports
- Skip duplicates
- Keep later scans incremental
- Reject OTP, promotional, failed and pending messages
- Optional original-message retention

## [1.0.2] - 2026-10-10

### Fixed

- Saving an entry. The ledger insert listed 22 columns and supplied 21 values, so a new expense was rejected.

## [1.0.1] - 2026-10-10

### Added

- Money Threads. Cashweft can suggest when money moved between your own accounts, came back as a refund, was lent and later returned, went to a committee, or left a bank as cash.
- True Spend, shown separately from the normal monthly total. Confirmed transfers, cash taken out, money lent, and committee money set aside are left out of True Spend. A confirmed refund reduces it.
- Review cards on Home. Nothing in the ledger changes until you confirm. Undo restores the earlier entry.
- Loan outstanding and committee threads, stored as extra metadata. The original rows stay in the ledger.
- A check for two very similar payments. Cashweft does not delete either one unless you choose to keep one.
- Local memory of connections you confirm or reject. That memory stays in SQLite on the phone.

### Removed

- The diary screen that asked a downloaded model to label each amount as spent, given, lent, or set aside.

### Not included

- No on-device model file, download, or inference. Suggestions in this release come from Cashweft’s own checks. See `docs/MODEL_PROVENANCE.md`.

## [1.0.0] - 2026-10-04

### Added

- Initial public release of Cashweft: manual entry, pasted-message
  parsing, budgets, and insights, backed by an on-device SQLite ledger.
- Android allowlisted SMS reader via the local `cashweft-sms` module.
- Optional encrypted backup to a Render-hosted Fastify API with Postgres
  storage, using AES-GCM encryption and a recovery-code flow.
- Downloadable Android APK release.

[Unreleased]: https://github.com/mwzkhalil/cashweft/compare/v1.1.0-rc.1...HEAD
[1.1.0-rc.1]: https://github.com/mwzkhalil/cashweft/compare/v1.0.2...v1.1.0-rc.1
[1.0.2]: https://github.com/mwzkhalil/cashweft/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/mwzkhalil/cashweft/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/mwzkhalil/cashweft/releases/tag/v1.0.0
