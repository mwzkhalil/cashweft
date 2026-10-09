# Migrations

SQLite `user_version` moves to 2. A database that already has `transactions` keeps every row.

Added columns include `amount_minor`, `currency`, `transaction_type`, provider, account, and rail. `amount_minor` is copied from `amount_paise`. Both columns are written with the same integer afterwards. Existing rows are marked `INR`. New rows default to `PKR`. Credit rows that were only "credit" become `income`. Old category names such as `Food & dining` and `Travel` are renamed once. If the migrated database has any transaction, `legacyCurrency` becomes `pending` until the user keeps INR or relabels those rows as PKR. Relabel does not convert the numbers.

Snapshot schema 1 restores through `migrateSnapshot` and is treated as INR. Schema 2 requires an explicit `PKR` or `INR` on each transaction. Invalid schema, missing currency on schema 2, or a non-positive amount throws before the restore transaction deletes local rows. After insert, the restore counts rows and throws, which rolls the SQLite transaction back, if the count does not match.

Browser storage uses the same function. A schema 1 blob is rewritten as schema 2 on read.

Recovery codes `kharcha1` and `cashweft1` both decode. A code created before the prefix was stored has no prefix in SecureStore and still displays as `kharcha1`. New codes use `cashweft1`. File and key moves are in [MIGRATION_BRANDING.md](MIGRATION_BRANDING.md).
