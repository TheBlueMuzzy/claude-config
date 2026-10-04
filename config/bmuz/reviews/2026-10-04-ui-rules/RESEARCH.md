# Game UI rules: research (2026-10-04)

Question: which established UI rulebooks already cover the notes Muzzy has been giving one playtest at a time, so the UI kit gets them right from the start?
Kit checked: `dev/framework/ui-kit`, which includes CATALOG.md, kit.css, blocks.css, controls/, check-ui.mjs, scripts/shoot.mjs, styles.test.ts and Settings.tsx.

**Source tags:** HIG = Apple Human Interface Guidelines · M3 = Material Design 3 · WCAG = WCAG 2.2 (criterion no.) · NN = Nielsen's 10 heuristics · UX = Laws of UX · XAG = Xbox Accessibility Guidelines · GAG = gameaccessibilityguidelines.com · GUI = Game UI Database / mobile game practice.
**★ = Muzzy already gave this note this week.**

---

## 1. The checklist (37 rules)

### Layout & spacing
1. ★ **Breathing room.** Nothing touches a card or container edge. Inner padding is at least 8px, and 16px on panels. *HIG margins · M3 8dp grid · UX Common Region*
2. **One spacing scale.** Every gap comes from the scale (4/8/16/24/32), with no one-off numbers. *M3 · UX Similarity*
3. **Related things sit closer together than unrelated things.** The gap inside a group is smaller than the gap between groups. *UX Proximity*
4. ★ **Fixed size in a sequence.** Cards, pages and carousel items in one sequence keep one size, so nothing grows, shrinks or jumps while you move through them. The tallest item sets the size. *NN #4 consistency · GUI*
5. **Buttons stay in the same place across steps.** Next/Done stays in the same spot on every page, and appearing buttons never push it sideways. *NN #4 · UX Jakob*
6. **Safe areas.** No text or control sits under a notch, rounded corner or home bar: everything is inside `env(safe-area-inset-*)`, plus about 5% from the edges on TV/overscan. *HIG · GUI*
7. **Non-buttons never look like buttons**, and buttons always look pressable. *NN #4 · HIG* (already a kit rule)

### Text & type
8. **Readable size.** Body text is at least 16px on the web (HIG 17pt, XAG 18px on mobile/PC). Never go below 14px for anything a player must read. *HIG · XAG 101* (kit floor is 18px)
9. **Contrast.** Text is at least 4.5:1 against its background, large text (24px+, or 19px+ bold) at least 3:1. Text over game art gets an outline or halo. *WCAG 1.4.3 · XAG 101/102*
10. ★ **No orphan words.** No wrapped line ends with a single word alone on the last line. *Typography practice*
11. ★ **Plain-sentence captions.** Write short, everyday sentences in sentence case. ALL CAPS only for labels of 1–2 words. *GAG "simple clear language" · XAG 101*
12. **Short lines in long text.** Paragraphs run at most about 60–80 characters wide, with line height 1.5 when a block is longer than 2 lines. *XAG 101 · WCAG 1.4.12*
13. **Text can scale to 200%** without clipping or overlap, and with scrolling in one direction only. *WCAG 1.4.4 · XAG 101*
14. **Short HUD words never break mid-word**, and long names end in "…" instead of wrapping into the layout. *GUI*

### Touch & input
15. ★ **Finger-sized targets.** Everything tappable is at least 44×44px (HIG 44pt, M3 48dp, WCAG 2.5.5 AAA 44). The legal floor is 24px (WCAG 2.5.8 AA), but don't aim for it. *HIG · M3 · WCAG*
16. **Space between targets.** Leave at least 8px between neighbouring tappable things, so a fat finger can't hit two at once. *M3*
17. **Thumb zone.** Main actions sit in the bottom third (portrait) or the bottom corners (landscape). The top corners are for rarely used things (pause, settings). *GUI · UX Fitts*
18. **The action fires on release, not on touch-down**, so sliding off cancels it. *WCAG 2.5.2*
19. **Every drag or swipe has a tap alternative** (arrows, buttons). *WCAG 2.5.7 / 2.5.1*
20. **Holds can be turned into a tap**, and timed inputs can be slowed or switched off. *GAG · XAG 116*
21. **Keyboard and gamepad reach every control** with a visible focus ring (at least 3:1 contrast). Focus is never hidden behind other UI. *WCAG 2.1.1, 2.4.7, 2.4.11 · GAG*

### Feedback & motion
22. **Respond within 100ms.** Every press shows a press state at once. Anything that takes over 400ms shows a spinner or progress, and over 10 seconds a bar with a way out. *NN #1 · UX Doherty*
23. ★ **"Can't do that" shake.** A refused action gives a short sideways shake plus a reason, and never fails silently. *NN #9 · GUI*
24. ★ **Same intention, same motion.** One entrance, one exit, one "attention" pop and one "no" shake for each kind of meaning, with the same timings everywhere. *NN #4 · M3 motion*
25. ★ **Carousels loop forward.** After the last item comes the first, sliding in from the same side, with no rewind sweep. *GUI*
26. **Reduce motion.** One switch (or the device setting) stops slides, shakes, floats and screen shake. Flashing is never more than 3 times a second. *WCAG 2.3.3, 2.3.1 · XAG 117*
27. **Never by colour alone.** Turn, danger and selection also show a shape, icon, outline or word. *WCAG 1.4.1 · GAG · XAG 103*
28. **Status changes are announced** (toasts, turn changes, timers) without stealing focus. *WCAG 4.1.3*

### Navigation & flow
29. **Back always works.** Phone Back, Esc and gamepad B close the top screen. A destructive or progress-losing step asks first, with a danger colour on the "yes". *NN #3, #5*
30. ★ **Instructions at the point of action.** Hints sit beside the thing they're about ("Hold to Roll" by the dice), not in a manual. *NN #6 · UX Paradox of the Active User*
31. **Few choices at once.** Keep about 3–5 main buttons per screen, with one clear primary. Push the rest to a secondary screen. *UX Hick, Choice Overload*
32. **Two taps to play.** Players get from launch to playing without wading through menu levels. *GAG*
33. **Every screen has a state for loading, empty and error**, never a blank panel, and each error message offers a way forward. *NN #9*

### Accessibility
34. **Settings are remembered** and include text size, reduce motion, screen shake, colour-blind support, separate volumes, haptics on/off and game speed. *GAG basic · XAG*
35. **Scroll affordance.** When content scrolls, show it (a cut-off item or a fade at the edge), so nothing hides silently below the fold. *NN #1 · GUI*

### Responsiveness
36. ★ **Check every screen size**: phone portrait (390×844), phone landscape (844×390), small phone (320×568), tablet and desktop. Nothing may scroll sideways and nothing may be clipped. *WCAG 1.4.10 (reflow at 320px) · HIG*
37. **Both orientations work**, unless the game truly needs one, in which case it shows a polite "turn your phone" screen. *WCAG 1.3.4*

---

## 2. Gap list: the checklist against the kit

| Rule / feature | Kit has it? | Suggested fix |
|---|---|---|
| Breathing room (1) | **Partly.** Panel `gap-l`, Card `gap-l`, chips fixed 2026-10-03. Nothing checks it. | Add an "inner edge" check to `shoot.mjs`: flag any child whose box is closer than 4px to the edge of a padded parent. |
| Spacing scale (2) | **Yes.** `gap-xs…xl` from a 4px step, and check-ui bans raw px. | none |
| Fixed size in a sequence (4) | **Partly.** Carousel: yes (the tallest item sets the height). **HowToPlay: no.** It draws one page at a time, so the panel resizes per page. | Stack all HowTo pages in one grid cell, as Carousel does, and show only the current one. |
| Buttons don't move (5) | **No** in HowToPlay: Back appears on page 2 and shifts Next. | Always render Back and make it invisible (or disabled) on page 1. |
| Safe areas (6) | **Yes.** Screen padding and toasts use `env(safe-area-inset-*)`. | Make sure games have `viewport-fit=cover` in index.html (install-kit could check). |
| Text floor (8), scale (13) | **Yes.** 18px floor in applyStyle; Settings text size up to 200%; targets stay px. | Add a 200% text-size run to `shoot.mjs`. |
| Contrast (9) | **Yes.** `styles.test.ts` checks 4.5:1 for text and 3:1 for the focus ring per preset; HudText halo. | Also test `on-game` against a light and a dark sample of game art. |
| Orphans (10) | **Yes.** `text-wrap: pretty` plus `noOrphan()`. | none |
| Line length / 1.5 leading (12) | **No.** Base line-height is 1.4 and nothing limits paragraph width. | Add `max-inline-size: 65ch; line-height: 1.5` for body text in HowTo, Modal and Credits. |
| Target size (15) | **Yes.** `--target-min` 44px, and `shoot.mjs` flags anything under 44. | none |
| Space between targets (16) | **Partly.** Pickers, tabs and carousels use `gap-xs` (4px) between buttons. | Raise the gap between tappable neighbours to `gap-s` (8px), and add a check to `shoot.mjs`. |
| Fire on release (18) | **Yes.** Buttons use `onClick`. | Note it as a rule for game code (a game's own `onPointerDown` actions). |
| Tap alternative to swipe (19) | **Yes.** Carousel has ◀ ▶ and dots. | none |
| Hold → tap option (20) | **Partly.** A Settings row exists (`holdToPress`), but the kit has no hold button that reads it. | Add a `HoldButton` that honours the setting (Roll Better already needs one). |
| Focus ring / keyboard / gamepad (21) | **Yes.** `:focus-visible` ring, arrow keys on pickers and tabs, focus moves to new screens, and everything under the top screen is inert. The gamepad is left to the game. | A small `useGamepadNav()` (d-pad → arrows, A → click, B → `screens.pop`) would close it. |
| Press response (22) | **Yes.** Press shift and scale, and Button `loading`. | none |
| **"Can't do that" shake (23)** | **No.** There's no shake keyframe and no "refuse" helper. | Add `kit-shake` (about 300ms, ±0.5rem, three swings) and a `refuse(element, reason?)` helper that shakes the element, toasts the reason, and does a light buzz. Under reduce motion: a red flash instead of the shake. |
| Same motion per intention (24) | **Partly.** Style tokens `--enter`, `--motion-fast/normal` and `kit-attention`, but no written map from intention to motion. | Add a short "Motion vocabulary" table to CATALOG (appear / leave / attention / refuse / reward / score), with one keyframe each. |
| Carousel loops (25) | **Yes** (0.2.x). | none |
| Reduce motion (26) | **Yes.** The device setting and the Settings switch both stop all CSS animation, and `useCountUp` respects it. | none |
| **Screen shake setting (34)** | **Partly.** There's a Settings row, but `applyAccessibility` ignores it. | Set `data-no-shake` on the page, and have game-feel / `refuse()` read it. |
| **Colour-blind / high contrast (27, 34)** | **Partly.** The Settings rows exist but aren't wired. States already use outlines plus colour (selected card, active chip ring, hollow "weak" dot). | Wire `highContrast` to a preset tweak (stronger borders, no textures). Colour-blind mode is mostly the game's job: document "never colour alone" in CATALOG. |
| **Haptics (34)** | **No.** There's a "Vibration" setting but no `navigator.vibrate` anywhere. | Add a `buzz('light' | 'refuse' | 'win')` helper that obeys the setting and does nothing where vibration isn't supported (iOS Safari). |
| Status announced (28) | **Yes.** Toasts are `role=status`, HudText is `aria-live=polite`, and the countdown is `aria-live`. | none |
| Back behaviour (29) | **Yes.** Every screen gets a history entry, so phone Back and Esc close it. Destructive actions go through `askConfirm`. | none |
| Instructions at the point of action (30) | **Partly.** `HudText` and `Tooltip` exist; the coach-mark is only a recipe. | Build the Tutorial coach-mark (the next recipe to promote). |
| Loading / empty / error (33) | **Yes.** Loading, EmptyState, Reconnecting (failed), and Toast danger. | A generic "Something went wrong · Try again" panel for non-online errors. |
| Settings remembered (34) | **Yes.** `loadSettings` and save per game. | none |
| **Scroll affordance (35)** | **No.** ScrollArea clips with no hint that more is hidden. | Add an edge fade (mask) on the side that has more, toggled by scroll position. |
| Screen sizes (36) | **Partly.** `shoot.mjs` covers phone, landscape and desktop. | Add 320×568 (small phone), 768×1024 (tablet) and a 1280×720 desktop window. |
| Orientation (37) | **Yes**, for the built screens (landscape layouts for menu, results and panels). | A "Rotate your phone" screen for games that lock orientation. |
| Dark mode | **N/A.** The game's style sets the look; a game ignores the OS theme on purpose. | Leave as is, and write that down as a decision. |
| Hover states (desktop) | **No.** There's no `:hover` anywhere, so desktop has no "this is clickable" cue. | Add a subtle hover lift under `@media (hover: hover)` only, so phones don't get stuck hover states. |

---

## 3. What can be checked automatically, and what needs eyes

**Automate (Playwright in `shoot.mjs`, or a unit test):**
- Targets of at least 44×44 (already done). Gaps of at least 8px between tappable neighbours: compare the boxes of sibling controls.
- No sideways scroll at each size (done). Add the 320, tablet and 200%-text runs.
- Breathing room: for each padded box (panel, card, chip), every child box is at least 4px inside its border.
- Fixed size in a sequence: step through Carousel / HowToPlay and check that the panel's height and width never change, and that the Next button's position never changes.
- Clipping and overlap: text with `scrollWidth > clientWidth` that isn't meant to have an ellipsis, and two controls whose boxes overlap.
- Contrast between colour tokens (done in `styles.test.ts`). axe-core in Playwright (`@axe-core/playwright`) for labels, roles, contrast in place and focus order: about 10 lines, and it catches a lot.
- Orphans: for each multi-line `.kit-text`, check whether the last line holds a single word. Use a Range rect per word, or compare the box height of the last word against the box height of the text without it.
- Reduce motion: with the setting on, `getAnimations()` returns nothing running.
- Safe area: the computed padding on `.kit-screen` uses `env()` when the inset is forced on (Playwright can't fake a notch, so check the CSS rule instead).
- Lint (check-ui.mjs): raw px and colours (done); `onPointerDown` used for actions; `position:absolute` (done); text wider than `65ch` in body copy.

**Needs eyes on a screenshot:**
- Whether the spacing *feels* even and balanced, and whether there's a clear visual hierarchy (one obvious primary).
- Whether the HUD reads over real game art (halo strength), and the thumb-zone placement in a real game.
- Plain-sentence captions and tone of the words; whether hints sit at the right place.
- Whether motion feels consistent and well timed; whether the shake reads as "no" rather than "error/crash".
- Colour-blind checks: simulate them in Chrome DevTools or Playwright's `emulateVisionDeficiency` via CDP. The screenshots are automatic, but judging them needs eyes.

---

## Sources
- Xbox Accessibility Guideline 101 (text sizes, scaling, spacing): https://learn.microsoft.com/en-us/gaming/accessibility/xbox-accessibility-guidelines/101
- Game Accessibility Guidelines, basic tier: https://gameaccessibilityguidelines.com/basic/
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Material 3 touch targets and spacing (48dp, 8dp): https://m3.material.io/foundations/designing/structure · https://support.google.com/accessibility/android/answer/7101858
- Apple HIG layout and 44pt targets: https://developer.apple.com/design/human-interface-guidelines/layout
- Laws of UX: https://lawsofux.com/
- Nielsen's 10 heuristics: https://www.nngroup.com/articles/ten-usability-heuristics/
- Thumb zone / safe area practice: https://parachutedesign.ca/blog/thumb-zone-ux/ · https://thedigitalspell.com/aspect_ratio_and_safe_area/
- Game UI Database (pattern reference): https://www.gameuidatabase.com/

## Summary
1. The rulebooks agree: 9 of Muzzy's 10 notes are standard rules (HIG, M3, WCAG, NN, XAG). Only the "carousels loop forward" note is purely game practice. The 37-rule checklist above is the up-front version.
2. The kit is already strong on targets (44px), text floor (18px), contrast tests, safe areas, focus, Back/Esc, reduce motion, toasts and loading/empty/error.
3. Real gaps: there's no "can't do that" shake or refuse helper, no haptics helper, and no scroll-edge hint or hover state; the screen-shake, colour-blind and high-contrast settings aren't wired.
4. A live bug against Muzzy's own rule: HowToPlay resizes per page, and its Next button shifts when Back appears. Separately, neighbouring controls are only 4px apart (M3 asks for 8px).
5. Most of this can be automated in `shoot.mjs`: breathing-room, target-gap, fixed-size-sequence and orphan checks, axe-core, and more screen sizes. Feel, hierarchy, wording and motion still need a screenshot review.
