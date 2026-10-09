# Android build

Requirements found on the development machine used for this change: Microsoft OpenJDK 17.0.20.1, `JAVA_HOME` set, Android SDK at `C:\Users\HP\AppData\Local\Android\Sdk`, and `sdkmanager` on `PATH`. Node is 22 or newer (`package.json` engines).

From `mobile`:

```bash
npm ci
npm test
npm run typecheck
npm run lint
```

SMS-enabled debug project:

```bash
set CI=1
set CASHWEFT_SMS_READER=1
npx expo prebuild --platform android --no-install
cd android
gradlew.bat assembleDebug
```

The debug APK is `android/app/build/outputs/apk/debug/app-debug.apk`. `android/` is generated and gitignored.

On 7 October 2026 a debug build succeeded in this workspace:

```powershell
$env:CI='1'
$env:GRADLE_USER_HOME='D:\g'
npx expo prebuild --platform android --no-install
cd android
.\gradlew.bat assembleDebug --no-daemon
```

`CashweftSms` compiles with the app. Debug APKs do not embed the JavaScript bundle and will not start without Metro. Ship `assembleRelease`. The committed identity is `app.cashweft.mobile` in `mobile/app.json`. The generated `mobile/android` tree is gitignored.

The first attempt failed because a long Gradle cache path made `libreactnative.so` exceed Windows' 260-character limit. `GRADLE_USER_HOME=D:\g` avoided that. A release APK was not built: this repo has no upload keystore.

Permission-free build:

```bash
set CASHWEFT_SMS_READER=0
npx expo prebuild --platform android --no-install --clean
cd android
gradlew.bat assembleDebug
```

`app.config.ts` omits `READ_SMS` and sets `blockedPermissions` when `CASHWEFT_SMS_READER` is `0`. The JS client also hides the reader. Paste and manual entry stay available.

EAS profiles in `mobile/eas.json`: `preview` (SMS APK) and `permission-free`. A release APK needs a signing keystore or EAS credentials. This repository does not contain a release keystore, so a locally signed release APK is not produced here.

```bash
npx eas-cli@latest build --platform android --profile preview
npx eas-cli@latest build --platform android --profile permission-free
```

Expo Go cannot load `CashweftSms`. Use a dev build or an APK for inbox reading.
