# Design — how it plays (GDD Part 2)

Goal: rules and systems specific enough to build, each tied to the feeling it's for, the risky parts settled by playing a sketch before the full build.

## Do (in this order — the frame is already locked in Part 1)
1. **Sketches first** — the sketch list from `.planning/IDEATE.md` + every §6 risk a sketch can settle: build and play each with `/sketch` (feel, look, "is it fun?"); a numbers question → a **proto** sim instead. Paper play counts for a board or card game. Each answer goes into the GDD.
2. **Rulebook** — §8: the rules numbered and short, written like a real rulebook (overview, components, how to win, setup, the flow, each action, game end, scoring, keywords). Controls for desktop and phone. It gets rewritten many times — that's normal.
3. **Options first** — for anything not obvious, sketch 2–3 ways it could work, pick with Muzzy, note the rejected ones in `research/` (so they're not re-argued).
4. **Trace every core mechanic** with **mda-analyze** trace — one row in the §8 mechanics table: what players end up doing → which target. Mark predictions. Check the traps (snowballing leader, one best strategy, waiting around, too random). A target nothing serves → tell Muzzy.
5. **Content & balance** — §9: every card, unit, ability and number in tables (`content/` or `design/`). Rules with odds or balance → a **proto** sim before committing to them. Resources/currencies → **game-economy**.
6. **Change over time** — §10: what changes within a game and between games.
7. **Scope & risks, second pass** — the rulebook always adds things: re-size Part 1's §5 Scope and §6 Risks with Muzzy (a change to Part 1 is logged in the GDD with the date).
8. **Players & opponents** — §11, only what this game has: computer opponents → **ai-opponent**; online → **multiplayer-setup**; saves → **save-system**. Long ones get their own `design/<system>.md`.
   - **Plain English must be literally true** (Muzzy, Glyphtender 2026-10-13: an AI that "never makes the second tangle" can be forced to): an AI / system *preference* is written as "tries to / prefers / if it can", plus what happens when it can't ("it always plays a legal turn") — code built from an over-strong sentence soft-locks. Game words players see follow the GDD's wording rules (e.g. Magic is *created*, never *gained*).
   - **Modes the game can enter** (help/explore, pause, overlays): list what ends them by themselves (idle warnings, bot takeover, disconnect, game end, handoff) and what is held while they're up (tips, timers).
9. **Look & sound** — §12 with Muzzy (he's the artist — capture his direction, don't invent it); look sketches side by side at real phone size.
10. **Screens & menus** — §13: the screen map, the HUD, names of things (web: the **game-ui** kit). **Teaching** — §14: what a new player must learn (notes only; the tutorial is built in Develop after playtests).

## Output
GDD §8–§14 filled (n/a is fine for what the game doesn't have). Header: `Current phase: Design`. Commit `GDD: design` with STATE.

## Done when
- Rules are buildable · every core mechanic traced to a target · the risky parts were sketched or simmed · numbers that matter were simmed or flagged · Muzzy agrees.
