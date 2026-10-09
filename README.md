<p align="center"><img src="mobile/assets/brand/cashweft-lockup-light.svg" alt="Cashweft. Your Money. Your Patterns. Your Privacy." width="420"></p>

# Cashweft

**Your Money. Your Patterns. Your Privacy.**

Cashweft is a Pakistan-first spending ledger that runs on the phone. It parses bank and wallet messages you paste, or allowlisted SMS on Android, and keeps the ledger in SQLite. Optional backup encrypts the snapshot on the device and stores only ciphertext.

The app works without an account, a GPU, or a cloud model. It does not log in to a bank.

## Install the Android test APK

The installable package is a signed release build. It embeds the Hermes bytecode bundle, so the phone does not need Metro, a USB cable, or a network connection to open the ledger.

| | |
| --- | --- |
| File | [release/cashweft-1.0.0.apk](release/cashweft-1.0.0.apk) |
| Package | `app.cashweft.mobile` |
| Label | Cashweft |
| Signature | Local test certificate `CN=Cashweft Local Test`. This is not a Play Store upload key. |

Install it on an ARM phone (`armeabi-v7a` or `arm64-v8a`). It does not install on an x86-only emulator. The JavaScript bundle is inside the APK, so the phone does not need a packager.

## What you can do

| Feature | Android | iOS | Web |
| --- | --- | --- | --- |
| Entries, categories, budgets, insights | Yes | Yes | Yes |
| Paste a message | Yes | Yes | Yes |
| Read allowlisted SMS | SMS build only | No | No |
| Cash Bridge, transfer suggestions, Ask Cashweft | Yes | Yes | Yes |
| Encrypted backup | Yes | Yes | No |

Institution names in the parser are not verified live integrations. See [docs/PAKISTAN_PARSER.md](docs/PAKISTAN_PARSER.md).

## Repository

```
mobile/     Expo app, SQLite ledger, CashweftSms module
api/        Optional Fastify backup API (ciphertext only)
docs/       Architecture, privacy, migrations, Android build
```

The native `mobile/android` and `mobile/ios` trees are generated and gitignored. Application id, scheme, and display name come from `mobile/app.json`.

## Run from source

Node.js 22.13 or newer.

```bash
cd mobile
npm ci
cp .env.example .env
npm start
```

Press `w` for web, or open Expo Go for manual entry. Inbox reading needs a native build because Expo Go does not load `CashweftSms`:

```bash
npx expo run:android
```

On Windows, set `GRADLE_USER_HOME` to a short path such as `D:\g` before Gradle. Build profiles and the release APK are in [docs/ANDROID_BUILD.md](docs/ANDROID_BUILD.md).

## Optional backup

From the repo root, with Docker:

```bash
docker compose up -d db
cd api
npm ci
```

PowerShell:

```powershell
$env:DATABASE_URL='postgres://cashweft:cashweft@localhost:5433/cashweft'
npm run dev
```

`http://localhost:4000/healthz` returns `{"ok":true}`. Point `EXPO_PUBLIC_BACKUP_API_URL` at an HTTPS deployment of `api/` when you want the phone to upload. Never put the database password in that variable. Render uses [render.yaml](render.yaml). Review the database cost before deploying. The local Compose password is for development only. An existing volume created under the previous database name is not reused; see [docs/MIGRATION_BRANDING.md](docs/MIGRATION_BRANDING.md).

## Checks

```bash
cd mobile
npm test
npm run typecheck
npm run lint
cd ../api
npm test
npm run typecheck
```

## Docs

- [Brand guidelines](docs/BRAND_GUIDELINES.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Rebranding audit](docs/REBRANDING_AUDIT.md)
- [Branding migration](docs/MIGRATION_BRANDING.md)
- [Data migrations](docs/MIGRATIONS.md)
- [Parser and provider evidence](docs/PAKISTAN_PARSER.md)
- [Rules behind insights and Ask Cashweft](docs/FINANCIAL_INTELLIGENCE.md)
- [Privacy](docs/PRIVACY.md)
- [Android builds](docs/ANDROID_BUILD.md)
- [Play SMS policy](docs/GOOGLE_PLAY_SMS_POLICY.md)
- [Test report](docs/TEST_REPORT.md)
- [Limitations](docs/LIMITATIONS.md)

## License

[MIT](LICENSE).
