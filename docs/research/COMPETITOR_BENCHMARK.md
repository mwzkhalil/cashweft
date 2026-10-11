# Competitor benchmark

**Scope and limits.** No competitor app was installed, signed into, or used for this benchmark. Every row below comes from the product's public website, fetched on 2026-10-11. Marketing pages describe intended features, not observed behaviour, so nothing here says how well a feature works.

## Products reviewed

| Product | Market | Page fetched | What the page claims |
|---------|--------|--------------|----------------------|
| YNAB | Global, USD pricing | [ynab.com/features](https://www.ynab.com/features) | Bank import through a linked aggregator (Plaid named in the footer), multi-device sync, goals/targets, loan planner, spending and net-worth reports, "Always ad-free". Pricing on page: USD 14.99/month or 109/year, 34-day trial. |
| Monarch | US | [monarch.com](https://www.monarch.com/) | "Every transaction in one list", mark transactions as reviewed, automatic recurring-subscription detection, flow-of-money charts, partner collaboration, 13,000+ institutions through multiple data providers. |
| Wallet by BudgetBakers | Global | [budgetbakers.com](https://budgetbakers.com/) | Bank sync with 15K+ connections, budgeting "based on how my spending actually happens", user quote saying "categorization feature learns over time". |
| Spendee | Global | [spendee.com](https://www.spendee.com/) | Cash, bank, e-wallet, and crypto wallets; category share chart on the hero; "Know how much you can spend daily"; shared wallets; custom categories. |
| Money Manager (Realbyte) | Global, Android | [realbyteapps.com](https://www.realbyteapps.com/) | Weekly/monthly totals, calendar view, charts, "Easier Double-entry Booking", per-category monthly budgets. |
| JazzCash | Pakistan wallet | [jazzcash.com.pk](https://www.jazzcash.com.pk/) | Payments, bill payments, savings, insurance, investment, rewards. No spending-tracking claim on the fetched page. |
| Easypaisa | Pakistan wallet/bank | [easypaisa.com.pk](https://easypaisa.com.pk/) | Security-first copy: 2-hour cooling-off period, device binding, 5-digit PIN, fraud monitoring, "encrypted storage". No budgeting claim on the fetched page. |
| SadaPay | Pakistan EMI | [sadapay.pk](https://sadapay.pk/) | Free transfers to any bank or wallet, virtual card, 900+ billers, "Request money", remittances via IBAN, phishing warning banner. |
| NayaPay | Pakistan EMI | [nayapay.com](https://www.nayapay.com/) | "Instant Notification: Stay in the know and know where you stand", Bill Split, Chip In, Gift Envelope, Raast merchant QR payments, playful voice ("Split bills, not friendships"). |

Not inspected: SMS-reading expense trackers from India and other markets. Their pages were not fetched, so they are not compared here.

## Patterns that recur

1. **Aggregator-first data.** YNAB, Monarch, and Wallet lead with bank connection. Pakistan has no consumer open-banking aggregator comparable to Plaid, so these apps cannot connect to Pakistani bank accounts. That is an inference from the absence of any Pakistani institution claims on their pages, not a tested fact.
2. **One list plus review.** Monarch describes one searchable transaction list where items can be marked as reviewed. Cashweft's Activity tab with a Review state is the same idea.
3. **Visual share first.** Spendee's hero shows a category share chart with percentages before any table. Money Manager names a calendar view.
4. **Wallets do payments, not tracking.** The four Pakistani apps reviewed advertise sending, paying, bills, and security. None of their fetched pages claims cross-bank spending history.
5. **Social money in Pakistan wallets.** NayaPay's Bill Split and Chip In and SadaPay's Request money show that shared and informal money is a recognised need.
6. **Security reassurance is prominent locally.** Easypaisa lists device binding, PIN, and cooling-off windows. SadaPay shows a phishing warning on its home page.

## Where Cashweft can differ

| Gap observed on the fetched pages | Cashweft position |
|------------------------------------|-------------------|
| Global trackers rely on aggregators that do not cover Pakistani banks. | Reads bank and wallet SMS on the phone, which every Pakistani bank already sends. |
| Pakistani wallets show only their own ledger. | One view across HBL, Meezan, JazzCash, Easypaisa, SadaPay, NayaPay, Raast, and cash. |
| Cloud sync is the default elsewhere. | Local-first. No account. Optional encrypted backup only. |
| Transfers between your own accounts inflate "spent" when each app counts its own side. | Money Paths links both sides so a Meezan→JazzCash move counts once. |
| Informal lending (friends, family, committees) is common. | Money Paths loan position: who owes whom, without any cloud contact list. |

## Patterns to borrow

- A single list with a visible "needs review" state (Monarch).
- A category share visual before any numbers table (Spendee).
- Plain, warm microcopy without jokes on money-loss screens (NayaPay's tone works for social features, but not for warnings).
- Security cues stated as facts, not adjectives (Easypaisa lists mechanisms rather than saying "bank-grade").

## Patterns to avoid

- "Bank-grade security" claims without mechanisms (YNAB copy). Cashweft should say exactly what is and is not encrypted.
- Feature walls. Every page reviewed lists 8–15 features; Cashweft's Home should show one number and one action.
