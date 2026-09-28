---
name: bug
description: Report, list, or sweep bugs in a game project. Turns Muzzy's description, screenshot or Dev Kit bug-capture log into a standard report (steps, expected, actual, P0–P3), triages whether to fix now or keep going, and fixes bugs the QA way — reproduce as a failing test, fix the root cause, keep the test forever. Use when Muzzy types /bug, or says something is broken, wrong, glitchy, "it's doing X instead of Y", "we fixed this before and it's back", sends a bug-capture file, or asks for a bug sweep.
---

# /bug — find it, capture it, fix it once

Read `~/.claude/config/bmuz/PROJECT-FILES.md` (BUGS.md format + P-levels). Create `.planning/BUGS.md` if missing.

## P-levels
- **P0** — crash, game can't continue, data lost, or the live build is broken → fix now; blocks /deliver
- **P1** — a feature doesn't work as designed → fix this sprint (or in the bug sweep)
- **P2** — minor, or has a workaround → queue it
- **P3** — cosmetic → whenever

## `/bug <description>` (or Muzzy just says something's broken)
1. **Capture** — write the report yourself; ask at most one question if something essential is missing (usually "every time, or just once?"):
   ```
   ### B014 · P2 · open · found 2026-10-05 in F08 · v0.2.0.93 · Pixel 6
   Dice keep pulsing after unlock
   Steps: 1. Roll 2. Drag a die to unlock 3. Let the timer end
   Expected: pulses once · Actual: pulses forever · How often: every time
   Evidence: bugs/B014-capture.json · screenshot
   ```
   A Dev Kit bug-capture file → read it first; it usually answers steps, state and version by itself. Save captures to `.planning/bugs/`.
2. **Triage out loud, one line** — the focus rule (Muzzy asked to be kept on track):
   - Fix **now** only if: P0, **or** it breaks the current feature's "Done when", **or** it's in code being changed right now and takes a couple of minutes.
   - Otherwise: *"That's a P2 in the menu, not F08 — logged as B014. Back to F08."* Muzzy can overrule with "fix it now".
   - Is it really a design change, not a bug? → say so, route to `/gdd`.
3. Commit the BUGS.md entry (`Bug B014: <title>`).

## Fixing a bug (now, or in a sweep)
0. **Branch:** a P0 on the live build → hotfix: branch `hotfix/B014-short-name` from the default branch, fix, then `/deliver` it as a hotfix (patch bump) — even if other work is in progress. Otherwise fix on the current work branch.
1. **Reproduce first.** Write a test that fails *because of* this bug: rules/logic → unit test; flow/UI → Playwright script; timing/physics that can't be tested → a scripted reproduction + Dev Kit Snapshot. Keep them in `tests/` (or `e2e/` for browser flows), not scratch folders. If the logic is buried in a big file with no way to test it, it's OK to pull that piece out into a small pure function first (no behaviour change) — the minimal change that makes it testable. Can't reproduce it? Say so — don't guess-fix.
2. **Root cause** with the **systematic-debugging** method. Check `.planning/archive/` and BUGS.md "fixed" — has this come back?
3. **Fix** the cause, not the symptom.
4. **Verify** (per **verification-before-completion** — run it, read the output, then claim it): the new test passes · the whole test suite passes · the full build passes (`npm run build`, including type checks) · for P0/P1, ask Muzzy to confirm on his device. Something already broken before your change? Log it as its own bug; fix it now only if it's tiny.
5. **Record:** status `fixed` with the commit and the guarding test (`Guarded by: tests/dice-pulse.test.ts`). Muzzy's confirmation → `verified`. Add any "must not" rule to STATE Key facts → Don't re-break.
Commit `Fix B014: <title>`.

## `/bug` (no words) → the list
```
Open bugs: 5 — P0 0 · P1 1 · P2 3 · P3 1
  B014 P1 Dice keep pulsing after unlock        (F08)
  B011 P2 Menu button overlaps on small phones
  ...
Fixed, waiting for your check: B009, B010
Next bug sweep: end of sprint 4 (or say "bug sweep")
```

## `/bug sweep` (or "bug sweep") — batch fixing
Offered by /develop at the end of each sprint and by /deliver before a release. Order: P0 → P1 → P2 (P3 only if quick). Group bugs that share a cause. Same fix steps as above. Summarize: fixed, couldn't reproduce, deferred.
