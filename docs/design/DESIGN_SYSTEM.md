# Design system

Code lives in `mobile/src/ui/` (`theme.ts`, `Kit.tsx`, `Icon.tsx`, `CategoryIcon.tsx`, `motion.ts`, `layout.ts`).

## Brand

| Token | Value | Use |
|-------|-------|-----|
| Emerald | `#0F5132` | Primary surface (summary card), primary buttons, active tab |
| Mint | `#6EE7B7` | Accent in dark theme, focus, highlights |
| Charcoal | `#1F2937` | Text in light theme |
| Off-white | `#F8FAF7` | Light background; text on emerald |
| Mark | Woven C (`brandMark.ts`) | Logo only. No K, no Kharcha wordmark, no robot or AI symbols. |

## Theme

Theme can be System (the default), Light, or Dark, chosen under You → Preferences. Before this change the app was dark unless the system reported light (audit A1).

## Spacing

The base unit is 4dp. Steps: 4, 8, 12, 16, 24, 32.

- Screen margins: 16dp.
- Gap between sections: 24dp.
- Card padding: 16dp.

## Shape

Radius steps: 12 (controls), 16 (cards), 20 (summary card), 999 (pills).

## Type

| Role | Font | Size / line height |
|------|------|--------------------|
| Display number | IBM Plex Mono 500 | 36 / 44 |
| Screen title | Bricolage 700 | 28 / 34 |
| Section | Bricolage 600 | 18 / 24 |
| Body | Hanken 400 | 16 / 24 |
| Label | Hanken 600 | 15 / 20 |
| Caption | Hanken 400 | 13 / 18 (raised from 12) |
| Tab label | Hanken 600 | 12 |

Amounts always use the mono face with `writingDirection: 'ltr'`, so Urdu layouts still read "Rs 1,250" left to right.

## Touch and focus

- Minimum target is 48×48dp for every Pressable, chip, and switch row (L3).
- At least 8dp between adjacent targets.
- Icon-only buttons need an `accessibilityLabel`; decorative icons are hidden.
- Selected chips set `accessibilityState.selected`.

## Colour use

- Text contrast: 4.5:1 below 18sp, 3:1 above (L4).
- Category identity is **glyph plus tint**, never colour alone (audit D5). `CategoryIcon` draws a 36dp circle tinted at 18% opacity with a 20dp stroke glyph in the full category colour.
- Money direction is a sign plus colour: `−Rs 500` uses the debit colour, `+Rs 500` the credit colour.

## Category glyphs

There is one stroke glyph per system category:

- basket: Groceries
- cup: Food
- bus: Transport
- pump: Fuel
- bolt: Utilities
- phone: Mobile
- book: Education
- cross: Healthcare
- bag: Shopping
- house: Rent and Housing
- play: Entertainment
- people: Family
- heart: Charity
- column: Government
- repeat: Subscriptions
- note: Cash
- arrows: Transfers
- jar: Savings
- arrow-in: Income
- dot: Other

Custom categories use the dot.

## States

| State | Visual |
|-------|--------|
| Confirmed path | Solid 1.5dp border in the credit colour, check glyph, label "Confirmed" |
| Suggested path | Dashed 1.5dp border in the muted colour, label "Suggested", no check |
| Needs review | 3dp left accent bar in the review colour, "Review" caption |
| Disabled | 45% opacity, not focusable |
| Selected chip | Accent fill (mint in dark, emerald in light), check glyph, `accessibilityState.selected`. Emerald on the dark surface was too faint, so it is not used for selection. |
| Ignored row | 60% opacity and struck-through amount |

Suggested and confirmed states differ in line style, glyph, and label, so colour is never the only difference.

## Motion

- Durations: 150ms (press feedback), 200ms (expand/collapse), 250ms (progress fill).
- `useReducedMotion()` reads `AccessibilityInfo.isReduceMotionEnabled()` and its change event. When it is on, values jump to their final state.
- No looping animation and no motion is required to understand content.

## Layout primitives

- `Screen`: a top safe area. The bottom pad is 24 + `insets.bottom` on stack screens and 24 on tab screens, where the tab bar already owns the inset. Content is centred to a maximum of 720dp when the window is at least 600dp.
- Tab bar: never a fixed height. Height = 64 + max(`insets.bottom`, 8). The first web check at 56 clipped the 12sp labels, so 64 is the floor.
- At 600dp and wider the tab bar becomes a left rail (`tabBarPosition: 'left'`).
- `useLayout()` returns `{ width, wide }`, where `wide` means at least 600dp.
