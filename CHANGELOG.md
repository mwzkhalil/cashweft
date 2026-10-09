# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/mwzkhalil/cashweft/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/mwzkhalil/cashweft/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/mwzkhalil/cashweft/releases/tag/v1.0.0
