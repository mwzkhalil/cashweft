# Pakistani message parser

`parseBankSms` in `mobile/src/finance/parser` is a deterministic template. It normalizes digits and Urdu letter variants, rejects OTP, promo, failed, and pending text, then looks for one transaction amount, a direction, and optional merchant, account, reference, rail, and date.

A balance or limit near an amount is not the transaction amount. Two different transaction amounts in one message return no parse. A reversal is a refund, not a new expense. An ATM withdrawal is `cash_withdrawal`, not an expense.

## Evidence levels

| Level | Meaning in this repository |
| --- | --- |
| implemented | The institution or rail name can be detected. No sender ID is shipped. |
| tested | Synthetic fixtures in `mobile/test` exercise that wording. |
| verified | A real notification from that institution was checked in. None are. |

Generic debit, credit, balance, Urdu digit, Roman Urdu, Raast, refund, and ATM fixtures are tested. HBL, UBL, MCB, Meezan, Bank Alfalah, Allied, Askari, Faysal, BankIslami, NBP, Standard Chartered Pakistan, JS Bank, Bank of Punjab, HabibMetro, JazzCash, Easypaisa, SadaPay, NayaPay, and Zindigi are name detection only (`implemented`), except Raast and IBFT wording which is `tested`. JazzCash is detected when the name appears in text the user pasted or an allowlisted sender returned. That is not a JazzCash integration.

Sender IDs are empty on a new install. The user adds an ID they have seen. The Android reader still ignores a two-letter routing prefix and caps a scan at 1,500 inbox rows from the requested time window.

Rejected messages are not inserted. Raw text is stored only when **Keep message text** is on. The paste preview can show the text before that choice.
