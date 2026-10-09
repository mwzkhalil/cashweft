# Cashweft transformation plan

This note records the starting point of the rewrite. The current product is Cashweft. Active names and the compatibility list are in [REBRANDING_AUDIT.md](REBRANDING_AUDIT.md).

The app began as a local-first Expo ledger. Android read allowlisted SMS through a native module. Parsing, review, budgets, and insights run on device. An optional Fastify API stores one AES-GCM ciphertext per backup id. The phone keeps the key.

Cashweft keeps that split. The server stays optional encrypted storage. New behaviour is local rules over the same ledger, not a cloud model and not a bank integration.

## What stays compatible

- SQLite file `kharcha.db`, browser key `kharcha.browser-ledger.v1`, SecureStore key `kharcha.backup.credentials.v1`
- Android package `dev.kharcha.app`, URL scheme `kharcha`, native module name `KharchaSms`
- Recovery codes that start with `kharcha1`
- Backup HTTP API, token hash, AES-GCM combined payload, optimistic version
- Snapshot schema 1 restores as an INR ledger. Schema 2 is the new export.
- Existing rows are not deleted. `amount_paise` remains written with the same integer as `amount_minor` so a downgrade can still read amounts.

## What changes

- User-facing name, copy, colors, and logo become Cashweft. Tagline: Your Money. Your Patterns. Your Privacy.
- New installs default to Pakistan, PKR, English, and an empty sender allowlist. No invented bank sender IDs.
- Legacy Kharcha rows are marked INR until the user chooses to keep INR or relabel them as PKR. Numbers are not converted.
- Money is integer minor units (`amountMinor`). PKR 2,480.50 is 248050.
- Parser becomes modular under `mobile/src/finance/`, with a generic Pakistani template plus institution name detection. Support levels are implemented, tested, or verified. Nothing is verified against live bank traffic in this repository.
- Debit is not always an expense. Confirmed self-transfers and cash withdrawals stay out of spending. Refunds reduce spend and are not income.
- Cash Bridge, transfer suggestions, recurring and unusual-spend rules, budget pace, and Ask Cashweft are on-device rules. They are not a trained model.
- Raw SMS retention is off by default. Rejected OTP and promo messages are never inserted.
- SMS and permission-free Android profiles are selected with `CASHWEFT_SMS_READER`.

## Order

P0 is currency, migration, parser, accounting, and backup compatibility. P1 adds accounts, cash, transfers, category memory, pattern rules, and Ask Cashweft. P2 updates the screens, docs, and build profiles.
