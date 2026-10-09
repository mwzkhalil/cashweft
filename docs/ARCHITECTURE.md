# Architecture

Cashweft is a Pakistan-first ledger. The phone owns the data. A Fastify API is optional storage for one AES-GCM ciphertext per backup.

## App

Expo SDK 57, React 19.2.3, React Native 0.86.3, Expo Router, TypeScript strict. Routes live in `mobile/src/app`. `LedgerProvider` is the only client state store. Native builds use `expo-sqlite` file `cashweft.db`. Web uses `localStorage` key `cashweft.browser-ledger.v1`. The Android application id is `app.cashweft.mobile`. The SMS module is `CashweftSms`.

Money is an integer minor unit. PKR 2,480.50 is `248050`. The display formatter is `formatMoney` in `mobile/src/lib/money.ts`. It does not use binary floating point to parse an amount.

## Compatibility reads

New installs write Cashweft names. The same sandbox still reads `kharcha.db`, `kharcha.browser-ledger.v1`, and `kharcha.backup.credentials.v1` when the new location is empty. `kharcha1` recovery codes still decode. A different Android application id cannot open the old app's private files. The path is documented in [MIGRATION_BRANDING.md](MIGRATION_BRANDING.md) and [REBRANDING_AUDIT.md](REBRANDING_AUDIT.md).

New recovery codes use `cashweft1` with the same token and key shape. The backup HTTP API is unchanged.

## Local modules

- `mobile/src/finance/parser` turns a message into fields or `null`.
- `mobile/src/finance/accounting` decides what counts as spending, suggests transfer pairs, and remembers merchant corrections.
- `mobile/src/finance/intelligence` finds recurring payments, unusual amounts, duplicate hints, and budget pace.
- `mobile/src/finance/assistant` maps a question to a fixed query shape. It does not build SQL from the question text.

None of these call a network or a model runtime. Keyword and interval rules are not described as a trained model.

## Screens

Tabs: Home, Activity (`inbox` route), Insights, Budgets, You. Ask Cashweft, accounts, cash, backup, paste, and export are stack screens.
