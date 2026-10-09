# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Cashweft: Pakistan-first ledger on the existing local-first app, with PKR minor units, Urdu and Roman Urdu parsing, a provider registry, Cash Bridge, transfer suggestions, on-device pattern rules, and Ask Cashweft.
- Snapshot schema 2. Schema 1 restores as INR. `kharcha1` recovery codes still decode. New codes use `cashweft1`.
- SMS and permission-free Android profiles via `CASHWEFT_SMS_READER`.

### Changed

- User-facing name, copy, and colors.
- Application id `app.cashweft.mobile`, scheme `cashweft`, native module `CashweftSms`, and Cashweft storage keys for new installs. Same-sandbox legacy files and `kharcha1` recovery codes still open. See `docs/MIGRATION_BRANDING.md`.

## [1.0.0] - 2026-10-04

### Added

- Initial public release of Cashweft: manual entry, pasted-message
  parsing, budgets, and insights, backed by an on-device SQLite ledger.
- Android allowlisted SMS reader via the local `cashweft-sms` module.
- Optional encrypted backup to a Render-hosted Fastify API with Postgres
  storage, using AES-GCM encryption and a recovery-code flow.
- Downloadable Android APK release.

[Unreleased]: https://github.com/mwzkhalil/cashweft/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/mwzkhalil/cashweft/releases/tag/v1.0.0
