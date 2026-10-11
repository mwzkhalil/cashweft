# Product differentiation

## Organising principle: Money Paths

Pakistani money moves along paths. Salary arrives at HBL, part goes to Meezan, some goes to JazzCash, some goes out as cash, and Rs 5,000 goes to a cousin who will pay it back. Every bank and wallet app shows only its own segment of the path. Cashweft's job is to weave the segments into one true picture. That is literally what a weft does.

Three candidate principles were considered:

| Candidate | Idea | Why not chosen as the organising principle |
|-----------|------|---------------------------------------------|
| Quiet Sense | Calm, low-notification, glanceable money awareness. | A tone, not a structure. It is kept as the voice of the product (see the writing guide). |
| Money Rhythm | Monthly and weekly cycles: salary day, bills, committee payments. | Useful for Insights, but cycles depend on correctly linked transfers first. |
| **Money Paths** | Link the two sides of every transfer, refund, and loan so totals are true. | Chosen. It is the feature no reviewed competitor claims (see [COMPETITOR_BENCHMARK.md](COMPETITOR_BENCHMARK.md)), it already exists as deterministic code, and it fixes the most damaging number in any tracker: an inflated "spent". |

## What Money Paths means on each screen

| Screen | Effect |
|--------|--------|
| Home | "This month" shows true spend. Below it: Spent · Received · Moved. "Moved" is money that stayed yours. |
| Activity | Filters: All · Spent · Received · Moved. A moved entry shows both ends ("Meezan → JazzCash"). |
| Insights | Spend by category excludes moved money. Loan position appears as "You lent / You owe". |
| Money Paths (screen) | Flow cards. A suggested path uses a dashed outline and "Suggested" label; a confirmed path uses a solid line and a check. |

## Non-goals

- No chat assistant, no cloud model, and no bank login aggregation.
- No investment or credit-score features.
- No automatic linking without the user's confirmation when confidence is low. Suggestions stay suggestions.

## Positioning line

"Every rupee, one true picture. On your phone."

Short form for the store listing: "Bank SMS, wallets, and cash in one private ledger."

## Naming

- Product: Cashweft. Never "Kharcha" or a K mark.
- Feature: Money Paths replaces "Money Threads" in all user-facing text. Internal module names (`finance/threads`) and database tables stay unchanged, so no migration is needed.
