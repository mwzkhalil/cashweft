# Branding migration

Cashweft is the active product name. A new install uses Cashweft file names, storage keys, and the Android application id `app.cashweft.mobile`. Older Cashweft builds that still used Kharcha identifiers can be read when they live in the same app sandbox. Android will not let this package open the private files of `dev.kharcha.app`.

## Same phone, same application id

These fallbacks run only inside one installed app:

| Active name | Legacy name still read | What happens |
| --- | --- | --- |
| `cashweft.db` | `kharcha.db` | If `cashweft.db` has no `transactions` table and `kharcha.db` does, the legacy file is copied with SQLite's backup API after a WAL checkpoint. The legacy file is left in place. |
| `cashweft.browser-ledger.v1` | `kharcha.browser-ledger.v1` | Web reads the legacy `localStorage` value when the new key is empty, then writes the migrated snapshot to the new key. |
| `cashweft.backup.credentials.v1` | `kharcha.backup.credentials.v1` | SecureStore reads the legacy item when the new key is empty, then copies it to the new key. |
| `cashweft1` recovery codes | `kharcha1` recovery codes | Both prefixes decode. New codes are created as `cashweft1`. A stored credential with no prefix still displays as `kharcha1`, which is the string older builds showed. |

Deleting a remote backup removes both SecureStore keys.

## New Android package

`app.cashweft.mobile` is a different Android application from `dev.kharcha.app`. The new app cannot see the old app's SQLite file or SecureStore. Installing this APK does not replace or uninstall the older package, and it does not delete that package's data.

To move a ledger across that boundary:

1. In the older app, create or copy the recovery code and upload the encrypted backup, or export the JSON snapshot.
2. Install Cashweft (`app.cashweft.mobile`).
3. Restore with the same recovery code, or import the JSON file.

A `kharcha1` code restores in the new app. The backup API does not care about the prefix. It checks the backup id and bearer token inside the code.

## What a new install does

- Opens `cashweft.db`.
- If that file is empty, it looks for `kharcha.db` in the same sandbox. A missing legacy file is not kept.
- Writes new backup credentials under `cashweft.backup.credentials.v1` with prefix `cashweft1`.
- Uses the deep link scheme `cashweft`. Links that used `kharcha://` do not open this build.

## Local development services

Compose and the Render blueprint now use Cashweft names (`cashweft` / `cashweft-postgres`, `cashweft-backup-api`, `cashweft-backups`). An existing Docker volume named `kharcha-postgres`, or an already provisioned Render database named `kharcha`, is not renamed by these files. Recreate the local database or point `DATABASE_URL` at the database you already have. The phone backup protocol is unchanged.
