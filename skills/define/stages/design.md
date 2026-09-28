# Design — how it plays

Goal: rules and systems specific enough to build, each tied to the feeling it's for.

## Do
1. **Core loop + rules** — §4: the loop in one line, then the real rules, numbered and short. Controls for desktop and phone.
2. **Options first** — for anything not obvious, sketch 2–3 ways it could work, pick with Muzzy, note the rejected ones in `research/` (so they're not re-argued).
3. **Trace every core mechanic** with **mda-analyze** trace — one row in the §4 mechanics table: what players end up doing → which target. Mark predictions. Check the traps (snowballing leader, one best strategy, waiting around, too random). A target nothing serves → tell Muzzy.
4. **Numbers** — rules with odds or balance → a **proto** sim before committing to them. Resources/currencies → **game-economy**. Computer opponents → **ai-opponent**.
5. **Systems** — §5, only the ones this game has; long ones get their own `design/<system>.md`.
6. **Look & sound** — §6 with Muzzy (he's the artist — capture his direction, don't invent it).

## Output
GDD §4, §5, §6 filled. Header: `Current phase: Design`. Commit `GDD: design`.

## Done when
- Rules are buildable · every core mechanic traced to a target · numbers that matter were simmed or flagged · Muzzy agrees.
