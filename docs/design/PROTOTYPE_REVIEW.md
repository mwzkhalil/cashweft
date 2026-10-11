# Prototype review

Prototype: [`prototypes/index.html`](prototypes/index.html), a static HTML mock labelled PROTOTYPE with invented sample data. Screenshots: [top](prototypes/prototype-rc2-top.png) and [bottom](prototypes/prototype-rc2-bottom.png).

**Method.** An AI coding assistant ran a heuristic review against the design system, the 10 NN/g heuristics, and the WCAG 2.2 items in [UX_LITERATURE_REVIEW.md](../research/UX_LITERATURE_REVIEW.md). **No participants took part.** This is not a usability test, and no task times or success rates exist.

## Checklist

| Check | Home | Activity | Insights | Add | Money Paths | You |
|-------|------|----------|----------|-----|-------------|-----|
| One primary action | ＋ | ＋ | none (read-only) | Save | Connect on each card | none |
| No opening paragraph | yes | yes | yes | yes | yes | yes |
| 48dp targets | yes | yes | yes | yes | yes | yes (52dp rows) |
| Content clear of the system bar | yes | yes | yes | yes | yes | yes |
| Colour not the only cue | sign plus colour | Review bar plus caption | glyph plus colour | glyph plus label | dashed vs solid border, label, check | n/a |
| Fits at 320dp | not drawn | not drawn | not drawn | not drawn | at risk (see R1) | yes |

## Issues found and decisions

| ID | Issue | Decision |
|----|-------|----------|
| R1 | The horizontal Money Paths flow ("Meezan ··1234 ── Rs 15,000 ──▶ JazzCash") squeezes at 360dp and will truncate at 320dp and in Urdu. | Build the flow **vertically**: a from row, then an arrow with the amount, then a to row. It works at every width and mirrors cleanly in RTL. |
| R2 | The Home summary mixes budget progress and "Read today ↻" in one caption. | The summary keeps only budget progress. SMS status moves to the month caption ("October 2026 · Read today"). Check SMS becomes a tappable row only when SMS is on. |
| R3 | The Activity chips All · Spent · Received · Moved fill 360dp, leaving no room for Review. | The chip row scrolls horizontally and Review is the fifth chip with its count. The tab badge also leads there. |
| R4 | Category glyphs in the mock are emoji placeholders. | The app uses stroke SVG glyphs (DESIGN_SYSTEM). Emoji are not used. |
| R5 | The Insights category rows show amount and bar but no percentage. | Show the percentage in a muted caption under the name, which saves horizontal space. |
| R6 | You at 320dp works, but the switch rows have no secondary text, so their meaning relies on the title alone. | Keep titles self-explanatory ("Keep message text", "Auto-add clear SMS"). Bank SMS privacy stays behind its own screen. |
| R7 | The wide (720dp) layout leaves the right side empty. | Accept for rc.2. Content is centred to 720dp max. A two-pane layout is future work. |

## Not reviewed

- Urdu rendering. The prototype is English only, and RTL is checked in the app build.
- Dark theme. The prototype is light only; the dark palette is unchanged from rc.1.
- Real device rendering. No phone was available.
