# Rebranding audit

Active product identity is Cashweft. Tagline: Your Money. Your Patterns. Your Privacy. This audit lists the Kharcha identifiers that were in the tree and what happened to each.

## Renamed

| Identifier | Where it lived | Now |
| --- | --- | --- |
| Display name Kharcha | App label, onboarding, about, README | Cashweft. `strings.xml` was already Cashweft. |
| `dev.kharcha.app` | `mobile/app.json`, iOS bundle id, `android/app/build.gradle` namespace and `applicationId`, `MainActivity` / `MainApplication` | `app.cashweft.mobile` |
| URL scheme `kharcha` | `app.json`, `AndroidManifest.xml` | `cashweft` |
| Expo slug `kharcha` | `app.json` | `cashweft`. The EAS `projectId` is unchanged. |
| `KharchaSms` / `kharcha-sms` / `dev.kharcha.sms` | `mobile/modules/kharcha-sms` | `CashweftSms` in `mobile/modules/cashweft-sms`, package `app.cashweft.sms` |
| `kharcha-mobile` | `mobile/package.json` and lockfile name | `cashweft-mobile` |
| `kharcha-backup-api` | `api/package.json`, lockfile name, `render.yaml` service name | `cashweft-backup-api` |
| `kharcha.db` as the file new installs open | `mobile/src/lib/database.ts` | `cashweft.db`, with a same-sandbox copy from `kharcha.db` |
| `kharcha.browser-ledger.v1` as the key new installs write | `database.web.ts` | `cashweft.browser-ledger.v1`, read-through from the old key |
| `kharcha.backup.credentials.v1` as the key new installs write | `backup.ts` | `cashweft.backup.credentials.v1`, read-through from the old key |
| New recovery prefix shown as the only format | backup screen placeholder | New codes use `cashweft1`. The screen no longer prints the old prefix. |
| App icon letter "k" | `docs/brand/generate.py` and `mobile/assets` | Weave mark on `#143D32` |
| Compose Postgres user, database, and volume `kharcha` | `compose.yaml`, `api/.env.example` | `cashweft` |
| Render database name `kharcha` | `render.yaml` | `cashweft` |
| npm repository display and docs that described Kharcha as the current app | README, CONTRIBUTING, SECURITY, LICENSE line, architecture docs | Cashweft |

## Preserved on purpose

| Identifier | Where it remains | Why |
| --- | --- | --- |
| `kharcha.db` | `LEGACY_DATABASE_FILE` in `mobile/src/lib/identity.ts` | Same-sandbox installs still have the ledger in this file. It is copied once into `cashweft.db`. |
| `kharcha.browser-ledger.v1` | `LEGACY_BROWSER_LEDGER_KEY` | Existing browser ledgers. Read when the new key is empty, then copied. |
| `kharcha.backup.credentials.v1` | `LEGACY_BACKUP_CREDENTIALS_KEY` | Existing SecureStore credentials. Read when the new key is empty, then copied. Deleted together with the new key. |
| `kharcha1` | `recoveryCode.ts`, `displayRecoveryPrefix` | Recovery codes already written down still decode. Stored credentials that have no prefix still display this prefix so the string matches the code the person saved. |
| Roman Urdu `kharcha` | `mobile/src/finance/assistant/ask.ts` keyword list | The word means "expense" in Urdu and Hindi. Ask Cashweft still understands questions phrased that way. It is not shown as the product name. |
| Public repository | `https://github.com/mwzkhalil/cashweft` | This is the published Cashweft repository. |
| Changelog section `[1.0.0]` | `CHANGELOG.md` | Historical release notes for the name the app shipped under on that date. |
| `docs/TRANSFORMATION_PLAN.md` body | planning history | It records the starting point of the rewrite. Current behavior is this file and `MIGRATION_BRANDING.md`. |

## Not a data migration

Changing `applicationId` creates a new Android app. `app.cashweft.mobile` cannot read `/data/data/dev.kharcha.app`. The older app, if it is still installed, keeps its database. Move the ledger with an encrypted backup or a JSON export. See `MIGRATION_BRANDING.md`.

## User-visible check

`mobile/test/branding.test.mjs` fails if `mobile/src/app`, `mobile/src/ui`, or `mobile/src/i18n/copy.ts` contains the previous product name. The recovery-code prefix and the Roman Urdu keyword stay outside those screens.
