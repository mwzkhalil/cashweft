# Screen specifications

Widths are tested at 320, 360, 412, and 430dp (phones) and 600dp or more (rail layout). "Primary" means the single filled emerald action on the screen.

## Home

```
[month caption]                   (search) (＋ primary)
This month
┌──────────────── emerald summary ────────────────┐
│ Spent                                            │
│ Rs 48,250                     (mono 36)          │
│ Received Rs 1,20,000 · Moved Rs 15,000           │
│ ▓▓▓▓▓▓▓░░░  62% of Rs 78,000                     │  shown only if budgets exist; tap opens Insights → Budgets
│ Read today ↻                                     │  shown only if SMS is on; tap checks SMS
└──────────────────────────────────────────────────┘
[attention cards, max 3]  icon · one line · chevron
Recent                                   See all ›
[4 rows: CategoryIcon · merchant · category · amount]
```

- Spent is true spend for the month: confirmed Money Paths are removed, refunds reduce it.
- Received is income. Moved is money confirmed as staying yours.
- Empty state: "No entries yet", with Add as the primary action and Import history when SMS is on.
- Removed: the tagline, the INR caption (it is now an attention card linking to You), and the Ask/Threads/SMS tile row.

## Activity

```
Activity                                   (＋)
[search field 48dp]
(All) (Spent) (Received) (Moved) (Review 3)      horizontal chips, 48dp
Today
  row…
Yesterday
  row…
```

- Review rows show the SMS slip with three actions: Not a spend, Fix, and Looks right (primary).
- Suggested self-transfers collapse into one card: "2 possible moves between your accounts", which opens Money Paths.
- The tab badge shows the review count.

## Insights

```
Insights
[ Spending | Budgets ]                      segmented, 48dp
(Week) (Month) (Year)
Rs 48,250                                    mono 36
12% less than last month
[stacked bar]
By category
  CategoryIcon · name · bar · amount · %
Cash and digital
  Digital ▓▓▓▓▓▓▓▓░  Rs 40,000
  Cash    ▓▓░░░░░░░  Rs 8,250
  Cash estimate Rs 6,000 (estimate)
Repeats · Unusual · By source               compact lists, max 4 rows each
```

The Budgets view has the "Left this month" card, one row per category with a progress bar, "Set a budget" as the primary action, and the pace line.

## You

Grouped rows (52dp, icon, title, chevron):

- **Money:** Accounts, Cash, Money Paths, Bank SMS (SMS build only)
- **Data:** Backup, Export
- **Preferences:**
  - Language: English | اردو
  - Theme: System | Light | Dark
  - Switches: South Asian numbers, Cash estimate, Keep message text, Read bank SMS, Auto-add clear SMS
- **About:** version

Legacy INR choices appear only while they are pending.

## Add an entry

```
←  Add an entry
(Spent | Received)                        segmented
Rs [        0 ]                           mono 36, autofocus
Name or place [            ]
Category  [6 recent chips]  All categories ›
More ▾   →  Type: Purchase · Refund · ATM cash · Fee · Correction (or Income)
[ Save ]                                   primary, full width
```

## Money Paths

```
←  Money Paths
┌ True spend  Rs 33,250 ┐  Moved Rs 15,000 · Left accounts Rs 48,250
You lent Rs 5,000 · Returned Rs 2,000           only if loans exist
(To check 2) (Confirmed) (Loans) (Committee) (Cash) (Refunds)
┌ ─ ─ Suggested ─ ─ ─ ─ ─ ─ ─ ─ ┐               dashed border
  Meezan ··1234  ──Rs 15,000──▶  JazzCash
  Move between your accounts
  Why? ▾ (evidence lines, Fair match)
  [Not related]  [Connect]
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
┌ ✓ Confirmed ──────────────────┐               solid border
  HBL ──Rs 5,000──▶ Cash
  [Undo]
└───────────────────────────────┘
```

- The summary covers this month and uses the same `periodSummary()` as Home, so True spend and Moved always match the Home card.
- The screen always opens on "To check", even when nothing needs checking, so the first view does not change after data loads.
- In the build the arrow is drawn vertically (from, arrow, to) because a horizontal row clipped account names at 320dp.

## Ask

- Suggested chips: Spent this month · Biggest expense · Food this month · Compare with last month · Income this month · اس مہینے کتنا خرچ ہوا؟
- Tapping a chip answers immediately in an answer card with `accessibilityLiveRegion="polite"`.
- The question field and Answer button sit below the chips.
- Footer caption: "Answered on this phone."

## Shared

- No screen opens with a paragraph. Privacy and method explanations sit behind a single text link ("How this works") where needed.
- All chips are 48dp. All icon buttons are 48dp with labels.
- In Urdu, `direction: 'rtl'` mirrors rows and chevrons; amounts stay LTR.
