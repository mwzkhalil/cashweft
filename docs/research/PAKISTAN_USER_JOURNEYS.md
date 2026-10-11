# Pakistan user journeys

**Every persona here is a hypothesis.** No interviews, diary studies, or usability sessions have been run for Cashweft. The personas combine published national statistics with the product's feature set so the design has concrete people to serve. They must be replaced or revised once real users are observed.

## Context from published sources

| Fact | Source |
|------|--------|
| 92% of FY26 formal retail payment transactions were digital; mobile phone-based channels handled over 11.1 billion transactions. | SBP Annual Report on Payment Systems FY26, as reported by [Dawn](https://www.dawn.com/news/2035291) and [APP](https://www.app.com.pk/business/retail-payments-via-formal-banking-channels-grow-58-in-fy26-with-widespread-adoption-of-digital-transactions/) |
| Raast processed 742.1 million transactions in Jan–Mar 2026; 664 million were person-to-person and 55.9 million person-to-merchant. | [SBP press release, 25 Jun 2026](https://www.sbp.org.pk/assets/documents/press-release/Pr-25-Jun-2026.pdf) |
| 99.1 million branchless-banking app users and 30.4 million bank-app users. | SBP FY26 report via [Dawn](https://www.dawn.com/news/2035291) |
| Financial inclusion was 35% in 2024; 30% of adults use mobile money. 14% of women vs 56% of men have a financial account; 46% of women vs 82% of men own a phone. | [Karandaaz K-FIS 2024 release](https://www.karandaaz.com.pk/news-and-media/press-releases/karandaaz-releases-k-fis-2024-survey-findings-reflecting-a-decade-of-financial-inclusion-trends-in-pakistan) |
| 85% of adults rely on informal sources, mainly family and friends, for credit. | Same K-FIS 2024 release |
| SBP's reports exclude cash transactions outside the banking system. | SBP press release above |

Implications for design:

- Most tracked payments will be digital, but cash is still real and invisible to SMS.
- Raast traffic is mostly person-to-person. A Raast message alone cannot tell whether money went to a shop, a relative, or the user's own account.
- Informal lending is the norm, so "who owes whom" is a core money question, not an edge case.
- Phones are often shared, especially by women. Privacy on the device itself matters as much as privacy from servers.

## Hypothetical personas

### P1 — Salaried professional, Lahore
Has an HBL salary account, a Meezan account, and JazzCash. Moves money between them often. Pain: monthly "spent" looks inflated because self-transfers count as spending. Needs: true spend, one monthly number.

### P2 — Freelancer, Karachi
Receives USD through SadaPay or NayaPay, converts, and pays family. Irregular income. Needs: received vs spent per month, clear incoming labels, no confusion between remittance and income.

### P3 — Student, Islamabad
Uses Easypaisa and cash. Small amounts, frequent food and transport. Budget-sensitive. Needs: fast cash entry, a weekly pace view, Urdu or English.

### P4 — Household manager, Faisalabad
Manages groceries, utility bills, school fees. Phone may be shared. Mostly cash plus some wallet bill payments. Needs: bills by category, cash tracking, privacy lock, Urdu.

### P5 — Small shop owner, Peshawar
Mixes personal and shop money in one wallet; lends to and borrows from suppliers and friends. Needs: loan position per person, cash in hand.

### P6 — Older parent supported by remittances, Multan
Receives money from a child abroad and pays bills. Low comfort with small text. Needs: large type, a few big buttons, clear "money received" moments.

## Core journeys

| ID | Journey | Persona | Today's friction (from audit) | Target |
|----|---------|---------|-------------------------------|--------|
| J1 | "How much did I spend this month?" | All | Home shows a slip plus a list plus three buttons; self-transfers can inflate spend. | Open the app and see one number, with Spent · Received · Moved, in under 3 seconds. Not yet timed with users. |
| J2 | Add a cash expense | P3, P4, P5 | Add screen shows direction, six enum chips, and 21 categories at once. | Amount first, a category from recent ones, then Save. Everything else goes behind More. |
| J3 | First SMS import | P1, P2 | Works, but there are five actions on the SMS screen. | One "Import history" action, with senders checked one by one. |
| J4 | Review uncertain entries | P1, P2 | Review lives inside Activity without a count on the tab. | A badge count on Activity and a filter chip. |
| J5 | Understand a transfer between own accounts | P1 | Threads screen opens with a paragraph and evidence text. | A Money Paths card that shows "Meezan → JazzCash · Rs 5,000" as a flow with suggested or confirmed state. |
| J6 | "Who owes me?" | P5, P2 | Loan position exists in code but is not on any first-level screen. | A Money Paths summary: "You lent Rs X · You owe Rs Y". |
| J7 | Check a budget | P3, P4 | Budgets is its own tab. | Budgets sit inside Insights, one tap from the tab. Home shows pace only when at risk. |
| J8 | Ask a question | P1, P2 | A blank field. | Suggested chips: "Food this month", "Biggest spend", "Spent at Daraz". |
| J9 | Protect a shared phone | P4, P6 | Cashweft has no app lock today; it relies on the phone's own screen lock. | Recorded as a gap. An app lock is a feature, not a redesign item, and is out of scope for rc.2. |
| J10 | Back up before changing phone | All | Backup works; the recovery code is displayed as text. | Same flow, with a one-sentence warning and copy confirmation. |

## Open questions for real research

1. Do users think of transfers between their own accounts as spending? Hypothesis: no, and it annoys them when apps count them.
2. Is Urdu UI preferred, or is Roman Urdu or English more familiar for money words?
3. Does a single "This month" number reduce anxiety or cause it?
4. How often do users want to log cash, given that it is manual?
