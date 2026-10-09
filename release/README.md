# Cashweft 1.0.1

Installable Android build for ARM phones (`armeabi-v7a`, `arm64-v8a`).

| | |
| --- | --- |
| File | [cashweft-1.0.1.apk](cashweft-1.0.1.apk) |
| Package | `app.cashweft.mobile` |
| Label | Cashweft |
| Version | 1.0.1 |
| versionCode | 2 |
| Minimum Android | API 24 |
| Target Android | API 36 |
| SMS | `READ_SMS` is declared |
| Bundle | Hermes bytecode at `assets/index.android.bundle` |
| SHA-256 | `C4CCE8F7DDB0F3244A2F6C0719A4BA3F9601C9271AD25840D479E5B16E9BA6BC` |
| Signature | Local test certificate `CN=Cashweft Local Test` |

This is a signed release APK with the JavaScript bundle inside it. It does not need a development server. It is not a Play Store upload key. It does not contain an on-device model.

Copy the file to the phone and install it, or run:

```bash
adb install -r release/cashweft-1.0.1.apk
```

If an older package is already installed under a different application id, Android will keep that app separate. This install does not remove it. The same application id as 1.0.0 can be updated in place.
