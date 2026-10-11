# Information architecture

Decisions trace back to [CURRENT_PRODUCT_AUDIT.md](../research/CURRENT_PRODUCT_AUDIT.md) (A), [UX_LITERATURE_REVIEW.md](../research/UX_LITERATURE_REVIEW.md) (L), and [PAKISTAN_USER_JOURNEYS.md](../research/PAKISTAN_USER_JOURNEYS.md) (J).

## Top-level destinations: four tabs

| Tab | Route | Job | Why |
|-----|-------|-----|-----|
| Home | `(tabs)/home` | One number for this month, plus what needs attention | J1 |
| Activity | `(tabs)/inbox` | Every entry, filters, and review | J4; the badge shows the review count |
| Insights | `(tabs)/insights` | Where money went, with **Budgets** as a second view | J7; A-N3 |
| You | `(tabs)/you` | Money tools, data, preferences | Settings and rarely used tools |

Budgets leaves the tab bar. It stays reachable in one tap:

- the Spending | Budgets switch at the top of Insights;
- the budget line inside the Home summary, which opens Insights on Budgets;
- `/budget` (add or edit), unchanged.

Route names stay the same (`inbox` is still the Activity file) to avoid breaking existing deep links and stored navigation state.

## Second level (stack screens)

| Screen | Entry points | Change |
|--------|--------------|--------|
| Add an entry `/manual` | Plus button on Home and Activity | Amount first; type and details behind "More" |
| Money Paths `/threads` | Home attention card, the Activity "Moved" filter footer, You → Money | Renamed from Money Threads; flow cards |
| Ask `/ask` | Search button on Home | Suggestion chips |
| Bank SMS `/sms` | You → Money, Home attention card | Unchanged structure |
| SMS history `/sms-history` | Bank SMS, Home first-run prompt | Unchanged |
| Accounts `/accounts`, Cash `/cash` | You → Money | Friendly labels |
| Backup `/backup`, Export `/data` | You → Data | Unchanged |
| About `/about` | You, last row | Shorter |
| Transaction `/transaction/[id]` | Any row | Friendly type labels |

Maximum depth: tab → screen → one sheet or sub-screen. That keeps to two disclosure levels (L5).

## Home attention order

Only items that apply are shown, and at most three:

1. Error banner
2. History import prompt (first run with SMS on) or a paused import
3. Review count, which opens Activity filtered to Review
4. Money Paths suggestions, which opens Money Paths
5. Budget pace warning, shown only when the pace is at risk

## Adaptive layout

| Width | Navigation | Content |
|-------|------------|---------|
| < 600dp | Bottom bar, 4 labelled items, height = 56 + bottom inset | Full width, 16dp margins |
| ≥ 600dp | Left rail (`tabBarPosition: 'left'`, material variant) | Centred column, max 720dp |

## What moved where

| Before | After |
|--------|-------|
| Budgets tab | Insights → Budgets |
| Home buttons for Ask, Threads, and SMS | Ask is the Home header search; Threads becomes the Money Paths attention card; SMS moves to the attention card and You → Money |
| Activity provider chips (raast/ibft/wallet) | Removed. Filters become All · Spent · Received · Moved · Review |
| You → Senders list | Bank SMS → Manage senders (already existed) |
| "Money Threads" | "Money Paths" |
