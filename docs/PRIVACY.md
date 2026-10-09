# Privacy

Cashweft is local-first. There is no account, no analytics SDK, no advertising SDK, and no cloud model.

## On the phone

Transactions, budgets, sender rules, accounts, and preferences sit in SQLite (`cashweft.db`) or, on web, in `localStorage` (`cashweft.browser-ledger.v1`). The operating system sandbox protects the app files. Cashweft does not encrypt the SQLite file. Do not describe the local database as encrypted.

SMS is off until the user turns it on. The native module returns only allowlisted senders, at most 1,500 messages, bodies no longer than 4,000 characters. The parser drops OTP, promo, failed, and pending texts before insert, so those bodies are not stored. Parsed fields are kept either way. The original message is stored only if **Keep message text** is on.

## Backup

Backup runs only after the user creates a recovery code and taps backup. AES-GCM runs on the device. The API stores ciphertext, a SHA-256 hash of the bearer token, a backup id, a version, and timestamps. It does not receive the key or the plaintext. `cashweft1` codes, and older `kharcha1` codes, both carry the id, token, and key. Whoever has the code can restore the snapshot. Losing it means the server cannot decrypt the backup.

Restore validates the snapshot and asks for confirmation before replacing the local ledger.

## Network

Ordinary screens do not use the network. The installed app contacts the configured HTTPS API only for backup, restore, and delete. Development builds may still talk to Expo’s tooling under Expo’s own terms.
