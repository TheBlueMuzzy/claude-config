# Templates a game copies — versions and what each one added (framework F203)

Each template below is copied into a game. Its first line is its version line — `// template: <name> <N> (<date>)`
(`#` in YAML) — and a game's copy keeps that line, so the session start can say when the copy is behind
(`scripts/templates-check.mjs`, run by session-start.sh). Quiet when every copy is current.

Rules:
- Change a template in a way a game should take (a fix, a new check, a new setting) → add a line at the top of its
  list here with the next number, and put the same number + today's date in the template's version line. A comment-only
  touch-up needs no new number. ② (test-scripts `templates` refuses a version line that doesn't match the top line here)
- A heading reads `## <template> → <where a game keeps its copy> · <copy | merge (keep: …)>`: "copy" = the game changes
  nothing in it, copy the template over the old one; "merge" = the game fills parts of it, bring the new parts in and
  keep what the game filled. The path is relative to the game folder.
- A copy with no version line is an old copy (made before F203): compare it with the template, merge, and give it the
  version line. ① (templates-check.mjs names it at session start) It counts as a copy only when it holds the template's
  title (the start of the template's second line); without it, it's the project's own file and nothing is said. A copy
  word for word the template, only the version line missing, counts as current.
- Not here (not copied into a game's code): GDD.md, TDD.md, handoff.md, lookback.md, release-check.md, ppp/, sketch/,
  check-permissions.sh.

## check-all.mjs → scripts/check-all.mjs · merge (keep: FAST, E2E)
- 4 (2026-11-03, F175): warns about unit tests over 1 s with no time limit of their own (needs scripts/slow-tests.mjs)
- 3 (2026-10-24, F118): port pre-flight — a full run checks every port is free first, naming who holds it (needs scripts/ports.mjs)
- 2 (2026-10-19, F69/F70): one full run at a time (a lock), fast checks sized to the machine's cores, check:framework lines
- 1 (2026-10-04): the check tiers — fast and full, side by side, the checks page

## ports.mjs → scripts/ports.mjs · copy
- 2 (2026-11-03, F177): knocks on the port instead of trusting netstat; names the real server holding a port (not a shell or itself)
- 1 (2026-10-24, F118): who holds this port — one lookup for check-all's pre-flight and stop-servers, every call time-limited

## slow-tests.mjs → scripts/slow-tests.mjs · copy
- 1 (2026-11-03, F175): lists unit tests over 1 s that still have vitest's default time limit

## shots.mjs → e2e/shots.mjs · merge (keep: PORT, FREEZE_QUERY, STILL, JOURNEYS)
- 1 (2026-11-07, F196): before/after screenshots — record, compare pixel by pixel, a changes page; sizes follow the game's orientation

## checks.yml → .github/workflows/checks.yml · copy
- 2 (2026-10-27, F158): test browsers kept between GitHub runs (the slow Linux packages cached; a stalled download retries)
- 1 (2026-10-19, F70): GitHub re-runs check:fast (and check:framework) on every push
