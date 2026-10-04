# Standards + process review — after Glyphtender v0.3.0 (2026-10-03)

Muzzy: "assess what standards we've been setting and see if they belong in BMUZ, as well as post-check the process to see if BMUZ can improve at all."
Evidence: this session (v0.5 polish round → /deliver v0.3.0), Glyphtender STATE "don't re-break" + TDD D51–D58, FINDINGS.md (remake stress test, items 1–54 + 55–66 added today), a grep of the BMUZ skills and the UI kit catalog.
Nothing in BMUZ changes without Muzzy's OK — this is the decision list.

## A. Standards we set — where they live now, where they belong

| # | Standard | Lives now | In BMUZ? | Belongs |
|---|---|---|---|---|
| A1 | **Breathing room** — nothing touches a card/container edge | global CLAUDE.md; UI kit 0.2.13 (player chips only) | no | game-ui rule + a kit-wide padding audit of every container part + an automatic "nothing within N px of its container" check |
| A2 | **Fixed frames** — anything that fills in over time (prompt, reveal cards, buttons) is sized for its biggest content from the start (hidden sizer copies) | Glyphtender twice (B013 prompt, reveal cards); global CLAUDE.md | no | kit primitive `FixedFrame` (proven twice → harvest) + game-ui rule |
| A3 | **No orphan words** | UI kit 0.2.15 (`text-wrap: pretty`, `noOrphan`) | kit only | game-ui rule: game-built sentences go through `noOrphan` |
| A4 | **Carousels loop forward** | UI kit 0.2.14 | kit only | ✅ done — catalog says it |
| A5 | **Every screen size** (390×844, 360×780, 844×390, ~768×343, ~1100, 1440×900, 1920×1080) | develop skill + memory | ✅ develop | also in game-ui (one list, one place) |
| A6 | **Full screen for web games** (tap → full screen on phones, button on desktop, iPhone → Add to Home Screen) | Glyphtender `src/ui/fullscreen.ts` | no | framework "web shell" (full screen + install tip + update-on-first-visit) — default for every web game, since links go to friends |
| A7 | **Whose turn, at the point of action** (the player's glyphling beside every prompt) | Glyphtender | no | board-game interaction checklist (FINDINGS #44, still open) |
| B1 | **Same intention → same motion** | global CLAUDE.md | no | game-feel step 0: list the game's existing motions ("motion vocabulary" in the TDD) and map every new moment to one before building |
| B2 | **Points fly on the seed's arc into a total that pops; every animated part ends invisible; nothing from a turn survives into the next** | Glyphtender (D52, D56, B007) | no | game-feel "score feedback" pattern now; framework module when a 2nd game needs it |
| C1 | **Awards = skill only, earned only, proof in the caption**; thresholds = sim floor check + a real playtest game as a fixture + near-miss script; re-tune with AI | Glyphtender (D54, D55, D57) | no | design reference card ("Highlights / achievements") for /define; framework module after a 2nd game |
| C2 | **Player-facing captions are plain sentences** — no notation ("9 → 5 → 1" failed) | Glyphtender en.json | no | game-ui / externalize-text writing rule |
| C3 | **A real playtest game becomes a test fixture** (muzzy-zero-awards.json) | Glyphtender | no | /bug + /develop playtest step: "save the snapshot → e2e/fixtures" |
| D1 | **Every e2e starts its own server on its own port; run one at a time; read exit codes** | develop/deliver (one at a time, exit codes); e2e:menu still needs an outside server | partly | shared e2e harness (FINDINGS #10/#25/#33) |
| D2 | **Hidden sizer copies are skipped by e2e selectors** | Glyphtender e2e | no | comes free with A2's primitive (marker + helper) |
| D3 | **Phone e2e turns auto-full-screen off before resizing** | Glyphtender e2e:online4 | no | comes with A6's web shell (test helper) |
| D4 | **Windows text tooling** — CRLF working copies broke scripted edits several times; tools turn ` ` into an invisible character | nowhere | no | starter: `.gitattributes` (`* text=auto eol=lf`); rule: invisible characters via `String.fromCharCode`, never literal (lint catches it) |
| D5 | **Kit fixes framework-first** (branch → VERSION bump → copy into the game → stamp commit) — done 5× by hand today | develop rule | rule yes, tool no | `npm run kit:update` that copies + stamps from the framework (FINDINGS #36) |

## B. Process post-check — what went well, what didn't

**Went well**
- /deliver end to end: two reviews caught one real bug (and proved it with a check that fails without the fix); server deployed and live-tested before the site; every check's exit code logged; framework released alongside.
- Reworking a kit part in the framework first meant Roll Better gets every fix too.
- Muzzy's mid-task asks (carousel loop) were folded in without losing the thread.

**Didn't**
- 🔴 **Muzzy repeated UI rules he'd already given** — "you didn't listen to the 'margin' rule"; the reveal cards grew mid-sequence although the prompt sizer (same problem, same project) existed. Rules lived in chat and STATE, not in a checklist run against screenshots.
- 🟡 **Built a new motion when one existed** — the first +3 flight was straight; the seed already had an arc.
- 🟡 **STATE drift reached /deliver** — "3 framework branches to merge" (2 already were), "360 px scrolls" (already fixed). Found only when checked.
- 🟡 **The findings log isn't triaged** — 54 items since 2026-09-30, about 4 marked applied; nothing reviewed since 10-01.
- 🟢 Scripted edits fought Windows line endings and escape characters (≈10 wasted tool calls).

## C. Recommendation — three batches (Muzzy picks)

1. **Rules (text only, ~1 hour):** game-ui "UI craft rules" + a screenshot review checklist run before any "done" (A1, A2, A3, A5, C2, B-🔴) · game-feel "motion vocabulary" step (B1, B2) · /bug + /develop "playtest → fixture" (C3) · /deliver: re-verify every open item and framework branch before acting (B-STATE) · /checkup triages FINDINGS at each milestone (B-log) · starter note for D4.
2. **Framework code (one framework sprint):** `FixedFrame` primitive (A2, D2) · web shell with full screen (A6, D3) · kit-wide padding audit (A1) · `kit:update` script (D5).
3. **Bigger, later:** game starter + shared e2e harness (D1, D4, FINDINGS #4/#10/#25) · awards module (C1, after a 2nd game) · board-game interaction checklist (A7, FINDINGS #44).
