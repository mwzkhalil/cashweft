# Google Play SMS policy

`READ_SMS` is a restricted permission. Google’s [SMS and Call Log policy](https://support.google.com/googleplay/android-developer/answer/10208820) allows a narrow exception for SMS-based financial management, and only after the developer submits the permissions declaration and Google approves it. Approval is not guaranteed. This repository does not claim that approval.

The SMS build must:

- ask for the permission in context, before the first scan
- read only sender IDs the user enabled
- keep processing on the device
- explain that OTPs and other chats are not stored

The permission-free build must not ship `READ_SMS` in the merged manifest. Use `CASHWEFT_SMS_READER=0` or the `permission-free` EAS profile. That build still supports manual entry, pasted messages, budgets, insights, Cash Bridge, and optional encrypted backup.

Do not use an accessibility service or notification listener to work around the SMS restriction.

Play Console also needs a privacy policy URL that matches the build you ship, including whether SMS is read and whether the optional backup host is yours.
