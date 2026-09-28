# Fast-track — Muzzy already knows what he wants

One pass instead of discover → define → design. Sized to the game: a small game should come out well under 150 lines of GDD.

## Ask (only what's missing, a few at a time)
1. The pitch · 2. platform + audience · 3. what players should feel · 4. the core loop and rules · 5. look & sound direction · 6. what must be in the first release, what's nice to have, what's out.

## Do
1. Create `.planning/GDD.md` from `~/.claude/config/bmuz/templates/GDD.md` and fill every section (short; "n/a yet" is fine for systems the game doesn't have).
2. **mda-analyze** targets for §2 and a trace per core mechanic in §4. Rules with odds → a quick **proto** sim if they matter.
3. Then run the **build plan** (`build-plan.md`): TDD + feature map + dependency tree for Muzzy.

## Output
GDD (header `Current phase: Complete`), TDD, ROADMAP. Commit `GDD + TDD + roadmap: fast-track`.
