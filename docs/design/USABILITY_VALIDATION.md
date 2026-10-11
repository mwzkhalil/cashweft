# Usability validation (1.1.0-rc.2)

## What was done

**No usability sessions took part.** No participants, no task completion rates, no times, and no satisfaction scores exist for this release. Nothing in this document is a measured user statistic.

What was done instead:

1. **Heuristic review** of the HTML prototype ([PROTOTYPE_REVIEW.md](PROTOTYPE_REVIEW.md)), carried out by an AI coding assistant against the NN/g heuristics, Material 3 guidance, and WCAG 2.2.
2. **Task walk-throughs in the Expo web build**, run by the same assistant, with an invented demo ledger at 320dp, 360dp, and 840dp. These show whether a task can be completed and how many taps it takes. They do not show whether real people understand the screens.
3. **Automated checks** in `mobile/test/redesign.test.mjs`: tab count, inset-aware heights, no K path, no emoji glyphs, catalog parity, RTL-safe margins, summary maths, and parser fixes.

## Task walk-throughs

Taps are counted from the Home tab. Typing counts as one step.

| # | Task (from PAKISTAN_USER_JOURNEYS) | Path in rc.2 | Steps | Result in web build |
|---|-----------------------------------|--------------|-------|---------------------|
| T1 | How much did I spend this month? | Read Home summary card | 0 | Shown as "Spent" with true spend |
| T2 | Add a Rs 450 rickshaw ride | ＋ → amount → name → Transport → Save | 5 | Screen rendered at 320dp and 360dp; Save is disabled until an amount is entered. The save itself was not run in this pass |
| T3 | Check entries that need review | Attention row "N to review" → Looks right / Fix / Not a spend | 2 | Review view and its actions rendered; tab badge shows the count. Actions not run |
| T4 | Mark a bank-to-wallet move as not spending | You → Money Paths → Connect | 3 | Completed. True spend dropped from Rs 35,500 to Rs 20,500 and Moved rose to Rs 20,000, matching on Home |
| T5 | Undo that move | Money Paths → Confirmed → Undo | 2 | Confirmed card with Undo rendered. Undo not run |
| T6 | See which category costs most | Insights tab | 1 | Category rows sorted by amount with glyph, bar, and percentage |
| T7 | Check the food budget | Insights → Budgets | 2 | Budgets view rendered with per-category bars |
| T8 | Ask "how much on food this month" | Search icon → "Food this month" chip | 2 | Path exists in source; not run in this pass |
| T9 | Switch to Urdu | You → Language → اردو | 2 | Completed. Layout mirrors; amounts stay left to right |
| T10 | Paste a bank SMS | You → Paste a message | 2 + paste | Path exists; not run in this pass |
| T11 | Import older bank SMS | You → Bank SMS → Import older | 3 | Not testable on web; Android only |

## Layout checks at small and wide widths

| Width | Screens checked | Finding |
|-------|-----------------|---------|
| 320dp | Add | Fixed: Add appeared shifted left on web because the auto-focused amount field scrolled its container during the slide-in. Autofocus is now off on web. Fixed: category picker showed all 21 categories on a cold load; it now always starts with six |
| 360dp | All four tabs, Budgets, Money Paths | No overflow found |
| 840dp | Insights, Home | Side rail shown; content centred |

Earlier fixes from these walk-throughs: tab labels clipped at a 56dp bar height (raised to 64), selected chips invisible on the dark surface (now accent fill plus check), Money Paths totals not matching Home (now shared), and garbled percentages in Urdu (bidi isolates).

## Not validated

- Any real person using the app, in English or Urdu.
- Phone rendering, gesture and three-button navigation, TalkBack, 200% font scale, and Android Reduce motion.
- Comprehension of "Money Paths", "Moved", and "Suggested" by people who are new to the app.

## Recommended next study

Five to eight participants in Pakistan, split between English-first and Urdu-first readers, running T1–T5, T9, and T11 on their own Android phones with the rc.2 SMS build. Record task success, wrong taps, and the words they use for "moved" money. Do not record SMS bodies, balances, or account numbers.
