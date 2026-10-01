# Prime 60 — Design System

Brief: Apple plus high-end private banking plus elite performance coaching plus luxury health club. Premium, minimal, calm, masculine without cliché. Light and dark mode. Mobile first.

## 1. Design intent

The subject is a man rebuilding the second half of his life, and the material world of that life: sea at dusk on the Gold Coast, stone and linen, a well-made watch, a quiet club lounge. The app should feel like a private ledger kept by someone who respects him. Not a gym app, not a productivity tool.

One memorable element: **the Prime Score reveal**. A large serif numeral that settles into place once each evening, with four thin bars filling beneath it. Everything else is quiet.

What this design is not: no cream-and-terracotta, no black-and-neon, no card kit with identical rounded boxes and grey shadows, no all-caps eyebrow labels, no middle-dot meta strings, no arrows appended to buttons, no monospace numerals, no traffic-light red and green.

## 2. Colour

Named tokens. Light and dark are two tunings of the same palette, not inversions.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| paper | #F6F5F1 | #141A21 | page background (warm stone / deep water) |
| surface | #FFFFFF | #1B232C | sheets, inputs, grouped controls |
| surface-raised | #EFEDE7 | #232D38 | pressed states, secondary surfaces |
| ink | #1A1F26 | #ECEAE4 | primary text |
| ink-soft | #5B636D | #A4ACB6 | secondary text |
| ink-faint | #9AA1AA | #68727E | tertiary text, placeholders |
| hairline | #E2DFD8 | #2B3641 | 1px rules |
| harbour | #2E6B6E | #5FA3A6 | primary accent: actions, progress, links |
| harbour-soft | #DCEBEB | #1F3A3C | accent backgrounds |
| brass | #B9985E | #D4B57A | reserved: Prime Self moments, score numeral, founding mark |
| ember | #A4553F | #D27C64 | attention: destructive confirmations, drift notes. Never for scores |

Rules: brass appears at most once per screen. Progress bars use harbour only; pillars are distinguished by label and position, never by colour. Direction is shown with a glyph and a word, not a colour. Contrast meets AA for all text on all surfaces.

## 3. Typography

Two families, clearly distinct.

- **Newsreader** (variable, optical sizes) for the voice of the product: the Prime Score numeral, North Star text, identity statements, the daily closing line, score reveal lines, Your Moment, section openers in the weekly review. Italic allowed for quotes only.
- **Instrument Sans** (variable) for the interface: navigation, controls, labels, body in settings, numbers in tables.

Type scale (px, mobile): 13, 15, 17 (body), 20, 24, 30 (sans). Serif display: 28, 36, 48, 72 (score numeral). Line height 1.45 for body, 1.15 for display. Tracking: slightly negative at 30px and above, zero at body, plus 0.01em at 13px.

Body measure under 70 characters. Headings in sentence case. No all-caps anywhere. No eyebrow labels. Numbers in the serif only when they are the point of the screen (score, weight toward target); otherwise sans.

## 4. Spacing, shape, elevation

Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 56, 72. Page gutter 20px on phones, content max width 520px centred on larger screens, Progress may use two columns at 900px and above.

Radius by role: 10px controls and inputs, 16px sheets and grouped lists, 24px full-screen modals, 999px pills and the tab indicator. Never one radius for everything.

Elevation: none by default. Surfaces are distinguished by tone, not shadow. The action sheet and modals use a single soft shadow `0 12px 40px rgba(10,14,20,0.18)` light, `0 12px 40px rgba(0,0,0,0.5)` dark. No shadows on cards because there are no cards: content sits on paper, separated by spacing and hairlines; only interactive groups get a surface.

## 5. Components

Built on shadcn/ui primitives, restyled with the tokens above. Lucide icons at 1.5 stroke, 20px, used sparingly and never without a label on primary actions.

- Tab bar: five items, label under icon, safe-area padding, active item in harbour with a 3px pill indicator.
- Commitment tap (non-negotiable): full-width row, 56px tall, label left, a 28px ring on the right that fills in harbour when done, with a 180ms fill. Haptic-feeling press state via scale 0.98.
- The One Thing: serif 20px text on a surface, a single "Finished" control beneath.
- Trajectory block: number in sans 30px, direction word beside it, four bars 6px tall with pillar labels in ink-soft.
- Score reveal: serif 72px numeral in brass, reveal line beneath in serif 20px, bars fill once. Reduced motion shows the final state immediately.
- Rating 1 to 10: a row of ten 32px targets, selected in harbour. No sliders.
- Yes/no: two equal segments, 48px tall.
- Sheet: slides from the bottom, 16px radius, drag handle, one task per sheet.
- Prompt banner: one at a time on Today, surface-raised, one line of text, one action.
- Drift note: ink-soft text with an ember dot, never a badge count.
- Explain this number: a tappable number opens a sheet listing the inputs and the arithmetic.
- Empty states: one sentence of direction and one action. No illustrations in V1.
- Charts: single harbour line or bars on hairline gridlines, target as a dashed ink-faint line, no legends when there is one series, axis labels in sans 13px.

## 6. Motion

One orchestrated moment: the evening score reveal (numeral settles over 600ms with an ease-out, bars fill over 400ms staggered 60ms). Everything else responds to the user: sheet open 240ms, commitment ring fill 180ms, tab change 160ms crossfade using the View Transition API. `prefers-reduced-motion` disables all of it.

## 7. Voice

Direct, intelligent, warm, calm. Sentence case. Plain verbs. The product speaks in the second person and never apologises. Reinforcement lines are short and specific: "Courage Rep recorded. A vote for your Prime Self." Misses: "One miss is an event. Two can become a pattern. Return today." Banned: failure, loser, bad, lazy, wasted, behind, crush, hustle, grind.

Button text says what happens: Save, Finished, Start the morning, Close the day, Record Courage Rep, Park it, Pursue.

## 8. Iconography and imagery

Icons: Lucide. Vision screen accepts user images; defaults are abstract, low-contrast photographic textures (sea, stone, linen) supplied as optimised WebP under 120 KB each, dimmed under text. No stock photos of men on beaches.

App icon: a brass numeral "60" in Newsreader on deep-water ground, with "Prime" small beneath only on the splash.

## 9. Accessibility floor

44pt targets, AA contrast, focus rings in harbour 2px with 2px offset, every control labelled, every chart with a text summary, dynamic type respected up to 120% without breaking layouts, reduced motion respected, colour never the sole carrier of meaning.
