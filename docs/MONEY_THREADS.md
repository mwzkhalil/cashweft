# Money Threads

Money Threads connects ledger rows that already exist. It does not replace the SMS parser, Cash Bridge, transfer links, budgets, or Ask Cashweft.

A suggestion is only shown when a structural gate passes and the rule score is at least 0.82. Those cutoffs are provisional. They were not fitted on OpenJev output, because that model has not been run here. There is no automatic link. Confirming a card is what changes a stored type.

## Score

When the model is absent:

`score = 0.75 * ruleScore + 0.25 * prior`

The card is shown only if `ruleScore >= 0.82`. The prior does not lower the structural bar.

When a verified model score `jev` exists:

`score = 0.5 * ruleScore + 0.35 * jev + 0.15 * prior`

The card is shown only if `ruleScore >= 0.70` and `score >= 0.78`. A high model score cannot pass a failed gate. Amounts, direction, and time still have to match.

`prior` starts at 0.5. Each confirm or rejection for the same kind and names moves it toward that choice. The model weights are never updated.

## What confirmation changes

| Connection | Stored change |
| --- | --- |
| Own transfer, money lent, committee set-aside | Debit becomes `internal_transfer` |
| Cash taken out | Debit becomes `cash_withdrawal` if it was still an expense |
| Refund | Credit becomes `refund` |
| Loan returned, committee payout | Credit becomes `internal_transfer` |
| Duplicate, keep one | The later row is `ignored` |
| Partly | The thread is stored and the amounts stay as they were |

Home keeps using the normal spend total. True Spend is the normal spend after those confirmed changes. Money moved is the sum of the confirmed impacts. Undo writes the previous type and status back.

Loan outstanding is confirmed money lent minus confirmed money returned. It is not a collection tool.
