# Tiny AI dataset (SmartSort v1)

All data is **synthetic**. No real SMS, account numbers, phone numbers, or user data were used. OTP rows exist only to check that they are excluded; they are never used to train a model.

Generator: [`tools/smartsort/generate.py`](../../tools/smartsort/generate.py), seed `20261011`. Output: `eval/smartsort/v1/{train,val,test}.jsonl`, with `summary.json` and `lexicon_train_val.json`. Only `summary.json`, the lexicon, and the result files are committed. The JSONL splits contain synthetic OTP-style negatives, so they are regenerated locally from the fixed seed and never published as a downloadable dataset. The experimental model weights are not committed either.

## Design

- **Template families.** There are 12 transaction wording families, and each split gets different families:
  - train: bank POS, wallet payment, IBFT, bill payment, Roman Urdu, bank debit narrative;
  - val: short purchase, online card, Urdu;
  - test: Raast QR, wallet merchant, terse card alert.
- **Merchants.** About 220 public Pakistani brand and organisation names across 13 spending categories plus "Other" (ambiguous trading names). There are also composed names: a city or family name plus a generic shop word ("Madina Medical Store"). Brands and name prefixes are assigned to one split by SHA-256 bucket, so test merchants never appear in training. Generic shop words are shared across splits, as they are in real life.
- **Hard negatives.** Eight families, each with three wordings, one wording per split:
  - OTP;
  - promo containing a credit word;
  - failed;
  - pending;
  - balance information;
  - upcoming debit;
  - statement ready;
  - money request.
- **Masking.** Amounts, balances, card digits, and references are random. Model features replace all digits with `0`.

## Size

| Split | Rows | Transaction rows | Negative rows | Distinct merchants |
|-------|------|------------------|---------------|--------------------|
| train | 2,672 | 2,352 | 320 | 608 |
| val | 704 | 504 | 200 | 193 |
| test | 668 | 468 | 200 | 158 |

The test split has no Entertainment rows because every Entertainment brand bucketed into train or val. This is a known gap in v1.

## Known limitations

- Templates were written by the same team that wrote the rules. Real bank wording is more varied.
- Each family has only two transaction wordings.
- Brand lists are short; real merchant strings include branch names, truncation, and typos.
- The labels encode one opinion: a Raast QR payment to a shop is spending in the shop's category, not a transfer.

## Rights

The generator, templates, and output are original work released under the repository's MIT licence. Brand names appear only as merchant strings in synthetic text.
