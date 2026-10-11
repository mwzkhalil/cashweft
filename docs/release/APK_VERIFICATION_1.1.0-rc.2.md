# APK verification: 1.1.0-rc.2

Built and checked on 11 October 2026 on the Windows development machine. No phone or emulator was attached (`adb devices` listed none), so nothing here was run on Android.

## Build

From `mobile/android`, with `GRADLE_USER_HOME=D:\g`, `NODE_ENV=production`, and `CI=1`:

```powershell
.\gradlew.bat assembleRelease "-PreactNativeArchitectures=armeabi-v7a,arm64-v8a" --no-daemon
```

- SMS build: `CASHWEFT_SMS_READER=1`. Finished in 7m 24s.
- Permission-free build: `CASHWEFT_SMS_READER=0`, with the `READ_SMS` line in the generated `AndroidManifest.xml` temporarily marked `tools:node="remove"`. That matches what `app.config.ts` does during prebuild. The manifest was restored afterwards. Finished in 5m 15s.

`expo prebuild --clean` was not run. The existing signing configuration and the existing local test certificate were used. No new keystore was created.

## Results

| Check | SMS build | Permission-free build |
|-------|-----------|-----------------------|
| `aapt dump badging` package | `app.cashweft.mobile` | `app.cashweft.mobile` |
| versionCode / versionName | 5 / 1.1.0-rc.2 | 5 / 1.1.0-rc.2 |
| min / target SDK | 24 / 36 | 24 / 36 |
| Label | Cashweft | Cashweft |
| Native code | `arm64-v8a`, `armeabi-v7a` | `arm64-v8a`, `armeabi-v7a` |
| `READ_SMS` | Declared | Absent |
| Debuggable | No | No |
| `apksigner verify` | v2 verified, 1 signer | v2 verified, 1 signer |
| Signer DN | `CN=Cashweft Local Test, OU=Device Testing, O=Cashweft, C=PK` | Same |
| Certificate SHA-256 | `eec8d8e0…8e1f` | Same |
| `assets/index.android.bundle` | 2,823,560 bytes, magic `C6 1F BC 03` (Hermes) | Same |
| Embedded `app.config` | version 1.1.0-rc.2, versionCode 5, `smsReader: true` | version 1.1.0-rc.2, versionCode 5, `smsReader: false` |
| APK bytes | 63,885,327 | 63,885,291 |
| APK SHA-256 | `33fddf56b4fcd76bccb834a5916c391c6a2d68d7f6196013865b5d1b846c69a7` | `524a7f7d675e7ede88c06c1ff272f1fe2ef9da68238e3d2e4c9e95010780ecfa` |

The full certificate SHA-256 is `eec8d8e0c528e5f841137371403d98ae553d1a8b32d04226b15254bdb94a8e1f`. It matches the 1.1.0-rc.1 APK, so either build upgrades rc.1 in place.

The bundle contains the new strings "Left this month", "Money Paths", and "Answered on this phone". It does not contain "Kharcha", "tensorflow", or "onnx". No model file is in the APK.

## Not verified

- Installing over rc.1 on a phone and confirming the ledger survives the upgrade.
- Gesture navigation and three-button navigation insets on real hardware.
- Reading bank SMS on a phone.
- TalkBack, font scaling at 200%, and Android's Reduce motion setting on a device.
