# Financial intelligence

These features are rules on the local ledger. There is no trained classifier, no model file, and no cloud inference.

## What counts

An expense or a fee counts as spending. A refund reduces that spending. Income is a separate total. A cash withdrawal and a confirmed internal transfer do not count as spending. A credit is income only when its type is `income`. Linking a pair changes both rows to `internal_transfer` and can be undone, which restores the previous types.

## Cash Bridge

Optional. An ATM withdrawal increases an on-device cash estimate. A manual expense whose account is the cash wallet decreases it. A counted-cash adjustment is the difference between the estimate and what the user counted. The screen says the figure is an estimate.

## Transfer suggestions

A suggestion requires one debit and exactly one credit with the same amount and currency inside 48 hours. A shared reference or two accounts the user marked as theirs raises the confidence and is included in the reason. Ambiguous pairs (more than one possible credit) are not suggested. Nothing is linked until the user confirms.

## Patterns

Recurring: at least three expenses, same normalized merchant, gaps of about a week or a month, amounts within 15% of the median.

Unusual: at least four earlier expenses at that merchant, and the latest is at least twice that median. A first visit does not alert.

Duplicates: same merchant and amount inside 10 minutes. Different references are left alone. The hint does not merge rows.

Budget pace: needs a budget, some spending, and day 7 or later. Projection is month-to-date average times the number of days. The sentence on screen states that assumption.

## Ask Cashweft

English, Urdu, and Roman Urdu phrases map to spend, income, biggest expense, category, and month comparison. Dates that are not a known phrase are refused. Text that looks like a SQL command is refused. `buildSpendQuery` only interpolates `?` placeholders. The running app answers from the in-memory ledger so web and native share one path.

## Category memory

The first time a user moves a merchant to a new category, the correction is stored. The second time, later parses of that same normalized merchant use it. A different merchant is not affected. The user can still edit any row.
