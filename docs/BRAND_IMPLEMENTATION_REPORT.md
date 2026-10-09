# Brand implementation report

Source visual reference: `Cashweft Fintech Brand System Board.png` at the repository root.

The board was inspected and the woven C was traced into vector paths. The board PNG is not shipped as an icon, splash, or screen.

## Assets created

- `mobile/assets/brand/cashweft-mark.svg`
- `mobile/assets/brand/cashweft-monochrome.svg`
- `mobile/assets/brand/cashweft-wordmark.svg`
- `mobile/assets/brand/cashweft-lockup.svg`
- `mobile/assets/brand/cashweft-lockup-light.svg`
- `mobile/assets/brand/cashweft-lockup-dark.svg`
- `mobile/assets/brand/fonts/Inter-Bold.ttf`
- `mobile/assets/brand/fonts/Inter-Medium.ttf`
- `mobile/assets/icons/icon.png`
- `mobile/assets/icons/icon-light.png`
- `mobile/assets/icons/icon-dark.png`
- `mobile/assets/icons/adaptive-icon-foreground.png`
- `mobile/assets/icons/adaptive-icon-background.png`
- `mobile/assets/icons/monochrome-icon.png`
- `mobile/assets/splash/splash-logo.png`
- `mobile/assets/splash/splash-logo@2x.png`
- `mobile/assets/splash/splash-logo@3x.png`
- `mobile/assets/favicon.png` replaced from the new icon

## Assets removed from active use

- `mobile/assets/logo.svg` (temporary wave mark)
- `mobile/assets/icon.png`
- `mobile/assets/splash-icon.png`
- `mobile/assets/android-icon-foreground.png`
- `mobile/assets/android-icon-background.png`
- `mobile/assets/android-icon-monochrome.png`

`docs/brand/generate.py` now refuses to run, so it cannot write the older mark back over these files.

## App and Android configuration

`npx expo config --type public` resolves to:

- name Cashweft
- icon `./assets/icons/icon.png`
- scheme `cashweft`
- package `app.cashweft.mobile`
- adaptive icon background `#0F5132` and the new foreground, background, and monochrome files
- splash `./assets/splash/splash-logo.png` on `#0F5132`, resize mode contain

The generated Android project was updated in place: launcher webp densities, `splashscreen_brand.png`, `drawable/splashscreen_logo.xml` (emerald field, centered lockup), and splash color `#0F5132`. Application id stayed `app.cashweft.mobile`.

## UI

- `mobile/src/ui/brand.ts` holds emerald, mint, charcoal, and off white, plus light and dark semantic tokens.
- `mobile/src/ui/theme.ts` maps the existing screen palette onto those tokens.
- `mobile/src/ui/Logo.tsx` draws the woven mark. `BrandLockup` is used on onboarding and About only.
- Onboarding heading is "Welcome to Cashweft". About shows the lockup, version 1.0.0, the tagline, and the privacy principles. Mock names and balances from the board were not copied.
- Wordmark and tagline use Inter. Ledger titles stay in Bricolage Grotesque, body copy stays in Hanken Grotesk, and amounts stay in IBM Plex Mono.

## Checks

Mobile tests: 31 passed. Typecheck passed. Lint passed.

`assembleRelease` succeeded with `GRADLE_USER_HOME=D:\g`. The APK is signed with `CN=Cashweft Local Test` (local test certificate, not a Play upload key). Package `app.cashweft.mobile`, label Cashweft. `assets/index.android.bundle` is Hermes bytecode (`C6 1F BC 03`), 2,702,220 bytes. No device or emulator was attached, so launcher, splash, and About were not opened on a phone. The icon and splash images were inspected as files against the board.

Final APK: `cashweft-final.apk` (63,747,571 bytes, SHA-256 `70B146661B143F9F1CF712B0BBB9D926B3742907B9DA753CFC4F8CE147986647`).

## Kharcha strings that remain

Required for migration: `kharcha.db`, `kharcha.browser-ledger.v1`, `kharcha.backup.credentials.v1`, and the `kharcha1` recovery prefix. The Ask Cashweft matcher still treats the Roman Urdu word "kharcha" as "expense". Documentation and the GitHub repository path `cneuralnetwork/kharcha` still name the earlier project where that is the published location or the migration story. None of those appear on onboarding, Home, or About.
