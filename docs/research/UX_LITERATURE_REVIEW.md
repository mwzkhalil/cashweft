# UX literature review

Scope: guidance that directly changes a Cashweft screen. Each source was fetched on 2026-10-11 unless marked otherwise. Quotes are short; the design consequence is ours.

## Sources

| ID | Source | Accessed |
|----|--------|----------|
| S1 | Android Developers, [Edge-to-edge design](https://developer.android.com/design/ui/mobile/guides/layout-and-content/edge-to-edge) | Fetched |
| S2 | Android Developers, [Make apps more accessible](https://developer.android.com/guide/topics/ui/accessibility/apps) | Fetched |
| S3 | W3C WAI, [What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) | Fetched |
| S4 | Material Design 3, [Navigation bar guidelines](https://m3.material.io/components/navigation-bar/guidelines) | Fetched |
| S5 | Nielsen, NN/g, [Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/) (2006) | Fetched |
| S6 | Budiu, NN/g, [Memory Recognition and Recall in User Interfaces](https://www.nngroup.com/articles/recognition-and-recall/) (2024) | Fetched |
| S7 | Nielsen, NN/g, [10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) (reviewed 2024) | Fetched |
| S8 | Expo, [Safe areas](https://docs.expo.dev/develop/user-interface/safe-areas/) | Fetched |
| S9 | React Native, [AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo) and the Android reduce-motion fix [facebook/react-native#36508](https://github.com/facebook/react-native/pull/36508) | Search result summaries |
| S10 | Google Play, [Use of SMS or Call Log permission groups](https://support.google.com/googleplay/android-developer/answer/10208820) | Fetched |

## Findings and consequences

### 1. Insets are the app's job (S1, S8)

S1: draw backgrounds under system bars, but "content like text and buttons should be inset to avoid the system UI", and avoid "tap gestures or drag targets under system insets". S8: React Navigation handles safe areas by default through `react-native-safe-area-context`.

Consequence: never give the tab bar a fixed height. Height must be `content + insets.bottom`. Scroll content must pad by the tab bar height (tab screens) or by `insets.bottom` (stack screens). This is audit item N1.

### 2. Navigation bar: 3–5 destinations, always labelled (S4)

S4: navigation bars hold "three to five destinations", labels are required ("Don't remove the labels"), labels are 1–2 words, must not wrap or shrink, and active and inactive icons need 3:1 contrast with the container. At 600dp+ use a navigation rail instead.

Consequence: four destinations give each item 90dp at 360dp instead of 72dp, which leaves room for Urdu labels. Labels stay visible. A rail layout is used at 600dp+.

### 3. Touch targets and spacing (S2, S3)

S2 recommends at least 48×48dp per interactive element. WCAG 2.2 SC 2.5.8 (AA) sets a 24×24 CSS px floor with spacing exceptions. SC 2.4.11 (AA) requires that a focused element is "not entirely hidden due to author-created content", which a sticky tab bar can violate.

Consequence: 48dp minimum everywhere, including chips (audit F6). Scroll padding must keep the last row clear of the tab bar so focused items are never hidden.

### 4. Contrast and colour (S2, S4)

S2: 4.5:1 for text under 18sp (14sp bold), 3:1 otherwise.

Consequence: category identity uses a glyph plus a colour, never colour alone (audit D5). Muted text tokens are checked against both surfaces.

### 5. Show fewer things first (S5, S7)

S5: "Initially, show users only a few of the most important options," and keep it to two disclosure levels because "designs that go beyond 2 disclosure levels typically have low usability". S7 heuristic 8: "Every extra unit of information in an interface competes with the relevant units of information."

Consequence: each screen gets one primary action. Transaction type, account, note, and time on Add sit behind a single "More" disclosure. Explanations move to a single info link per screen instead of opening paragraphs (audit D2).

### 6. Recognition over recall (S6, S7)

S6: search suggestions "partly transform the query-generation task from one of recall to one of recognition"; contextual tips beat tutorials, and icons without labels "do not promote recognition".

Consequence: Ask shows suggested questions as chips (audit F5). Category picker shows recent categories first. Every icon in navigation has a text label.

### 7. Speak the user's language (S7)

S7 heuristic 2: use words familiar to the user, not internal jargon.

Consequence: no enum names in the UI (audit F1, F2). "cash_withdrawal" becomes "ATM cash". "adjustment" becomes "Correction". Money Threads becomes "Money Paths", a phrase that describes what the screen shows.

### 8. Visibility of status and error recovery (S7)

Heuristic 1 (keep users informed) and 9 (plain-language errors with a way out).

Consequence: SMS import progress keeps its progress bar and counts. Errors say what happened and offer one action.

### 9. Reduced motion (S9)

React Native exposes `AccessibilityInfo.isReduceMotionEnabled()` and a `reduceMotionChanged` event. On Android this reads the animation scale; the "Remove animations" setting was fixed in [facebook/react-native#36508](https://github.com/facebook/react-native/pull/36508) (2023), which RN 0.86 includes.

Consequence: one `useReducedMotion()` hook. Animations are 150–250ms and are skipped when reduced motion is on (audit A3).

### 10. SMS permission trust (S10)

Google Play lists "SMS-based money management" as an exception use case for `READ_SMS` and `RECEIVE_SMS`. The same page says budgeting apps "may not exfiltrate or share non-financial or personal SMS history".

Consequence: Cashweft's local-only model fits the policy text. The permission-free build stays available for anyone who does not want SMS access. Play distribution would still need a Permissions Declaration Form; this review does not claim approval.

## What the literature does not answer

- Whether Pakistani users prefer Urdu or English labels for money words. No source found; see the hypotheses in [PAKISTAN_USER_JOURNEYS.md](PAKISTAN_USER_JOURNEYS.md).
- Whether a single headline number on Home reduces anxiety or increases it. Needs testing with users; not measured.
