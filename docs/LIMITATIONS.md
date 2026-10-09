# Limitations

- No institution in this build is verified against a live SMS or wallet notification. Name detection is not a bank or wallet integration.
- The parser misses formats it has not been shown and can misread one it has. Bank and wallet records stay the source of truth.
- Rows imported from a schema 1 snapshot stay INR until the user chooses. There is no exchange-rate conversion.
- Unlinked incoming transfers count as income. They drop out of income only after the user confirms a link or changes the type.
- Cash Bridge is an estimate. It does not see cash the user never entered.
- Ask Cashweft answers a fixed set of questions. Anything else gets an unsupported reply.
- Category memory needs two corrections of the same merchant and uses exact normalized text.
- Pattern alerts need the history described in `docs/FINANCIAL_INTELLIGENCE.md`. They are not forecasts from a model.
- The local database is not encrypted by the app.
- Web has no SMS reader and no encrypted backup.
- iOS has no inbox reader.
- OS budget notifications are not implemented. Pace is shown inside the app.
- A release APK is not signed in this workspace because there is no release keystore.
- This change was not smoke-tested on a physical phone.
