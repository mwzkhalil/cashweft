# Cashweft brand guidelines

The visual source is `docs/brand/Cashweft-Fintech-Brand-System-Board.png`. It is a presentation board, not an app asset. Production marks are redrawn from that geometry and live under `mobile/assets/brand`, `mobile/assets/icons`, and `mobile/assets/splash`.

## Mark

The Cashweft mark is an interwoven geometric C. A deep emerald ribbon and a mint ribbon pass over and under each other. It is not a single-stroke letter and not the earlier wave icon.

Use the mark with clear space of about one ribbon thickness on every side. Do not crop it, outline it, rotate it, or add a word inside the launcher icon.

| File | Use |
| --- | --- |
| `mobile/assets/brand/cashweft-mark.svg` | Master color mark |
| `mobile/assets/brand/cashweft-monochrome.svg` | Single-color mark |
| `mobile/assets/brand/cashweft-wordmark.svg` | "Cashweft" in Inter Bold |
| `mobile/assets/brand/cashweft-lockup.svg` | Mark, wordmark, and tagline on a light field |
| `mobile/assets/brand/cashweft-lockup-light.svg` | Same lockup for light surfaces |
| `mobile/assets/brand/cashweft-lockup-dark.svg` | Mint mark and light wordmark for dark surfaces |

## Color

| Token | Hex | Role |
| --- | --- | --- |
| Deep Emerald | `#0F5132` | Primary, light-theme accent, splash field |
| Mint | `#6EE7B7` | Dark-theme accent, woven highlight |
| Charcoal | `#1F2937` | Light-theme text |
| Off White | `#F8FAF7` | Light background and dark-theme text |

Tokens live in `mobile/src/ui/brand.ts`. Screen colors in `mobile/src/ui/theme.ts` read those tokens.

The launcher field is `#0C5C3E`, slightly lighter than the ribbon emerald, so the woven structure stays visible on the icon. The adaptive-icon background and the splash field use `#0F5132`.

Light surfaces use off-white, charcoal text, and an emerald mark. Dark surfaces use a deep green field, mint accent, and off-white text.

## Typography

The approved board names Inter. Cashweft uses it for the wordmark and tagline (`Inter-Bold.ttf`, `Inter-Medium.ttf` in `mobile/assets/brand/fonts`). Screen titles stay in Bricolage Grotesque and body text stays in Hanken Grotesk, which were already part of the product. Amounts stay in IBM Plex Mono. Inter is not applied to every ledger row.

## Icon and splash

The launcher icon is the woven mark on a deep green rounded square. The word "Cashweft" is not inside that icon. Android adaptive icons use `mobile/assets/icons/adaptive-icon-foreground.png` (mark only, inside the safe zone) and `adaptive-icon-background.png`. The monochrome icon is for themed Android icons.

The splash is an emerald field with the mark, the wordmark, the tagline, and a few lines under the tagline. It is `mobile/assets/splash/splash-logo.png`, centered, not stretched.

## Do not

- Replace the mark with a generic C, a wave, or a letter K.
- Put mock names, balances, or profile photos from the brand board into the product.
- Recolor the mint and emerald so they no longer separate.
- Use the brand board PNG itself as an icon, splash, or README hero.
