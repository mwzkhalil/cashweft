# Cashweft 1.0.2

Installable Android build for ARM phones (`armeabi-v7a`, `arm64-v8a`).

| | |
| --- | --- |
| File | [cashweft-1.0.2.apk](cashweft-1.0.2.apk) |
| Package | `app.cashweft.mobile` |
| Label | Cashweft |
| Version | 1.0.2 |
| versionCode | 3 |
| Minimum Android | API 24 |
| Target Android | API 36 |
| SMS | `READ_SMS` is declared |
| Bundle | Hermes bytecode at `assets/index.android.bundle` |
| SHA-256 | `18856274EFE14808D7C6EFB772FF6E11DD5CEE6BAEAD7AF9A62FD9D1D83E94EF` |
| Signature | Local test certificate `CN=Cashweft Local Test` |

This is a signed release APK with the JavaScript bundle inside it. It does not need a development server. It is not a Play Store upload key. It does not contain an on-device model.

Copy the file to the phone and install it, or run:

```bash
adb install -r release/cashweft-1.0.2.apk
```

This replaces 1.0.1 on the same application id and keeps the existing ledger.

## 1.1.0-rc.1

Pre-release for device testing. v1.0.2 above remains the stable build. The release-candidate APK is attached to the GitHub pre-release and is not stored in git.

| | |
| --- | --- |
| File | cashweft-1.1.0-rc.1.apk |
| Package | `app.cashweft.mobile` |
| Label | Cashweft |
| Version | 1.1.0-rc.1 |
| versionCode | 4 |
| Minimum Android | API 24 |
| Target Android | API 36 |
| ABIs | `armeabi-v7a`, `arm64-v8a` |
| SMS | `READ_SMS` is declared |
| Bundle | Hermes bytecode at `assets/index.android.bundle` |
| Bytes | 63,847,843 |
| SHA-256 | `4b36f5b693a84c6104f2bdeb5118f24d2dd9a234652477d797214da5f84e994f` |
| Signature | Local test certificate `CN=Cashweft Local Test` |

Physical-device inbox validation has not been done. The build does not need Metro. It does not contain an on-device model.
