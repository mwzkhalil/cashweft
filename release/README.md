# Cashweft 1.0.0

Installable Android build for ARM phones (`armeabi-v7a`, `arm64-v8a`).

| | |
| --- | --- |
| File | [cashweft-1.0.0.apk](cashweft-1.0.0.apk) |
| Package | `app.cashweft.mobile` |
| Version | 1.0.0 |
| Signature | Local test certificate `CN=Cashweft Local Test` |

This is a signed release APK with the JavaScript bundle inside it. It does not need a development server. It is not a Play Store upload key.

Copy the file to the phone and install it, or run:

```bash
adb install -r release/cashweft-1.0.0.apk
```

If an older package is already installed under a different application id, Android will keep that app separate. This install does not remove it.
