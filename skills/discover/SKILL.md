---
name: discover
description: Double Diamond stage 1 — explore a game idea (or a big new feature) wide open before narrowing anything: references, players, what's fun, quick sims to test hunches. Starts a new project if there isn't one. Use when Muzzy types /discover, has a new game idea, says "I have an idea", "what if…", "let's explore", or wants to research a genre or mechanic.
---

# /discover — explore the problem (diverge)

Read `~/.claude/config/bmuz/PROJECT-FILES.md` first. No `.planning/STATE.md`? Do the quick setup from it.
Muzzy is an artist/designer: be a design partner, not a form. A few questions at a time.

## What are we discovering?
- **A whole game** (no GDD yet, or Muzzy says "new game") → follow `stages/discover.md`. It creates `.planning/GDD.md`.
- **A big feature inside an existing game** ("I want a crafting system") → same spirit, smaller: references for that mechanic, what feeling it should serve (read the GDD's principles), 2–4 rough directions. Write the findings to `.planning/research/<feature>.md` and a one-paragraph summary into VISION.md or the GDD's relevant section. Then hand to `/define` for that feature.
- **Just an itch** ("what if the dice could melt?") → talk it through; park it in VISION.md with the date if it's not for now.

## Diverge on purpose
This stage is for *more* options, not fewer. Don't converge early. Useful moves:
- Reference games (what works, what's missing) — web research when it helps, skip when Muzzy knows the space.
- Who's it for → **player-profile**. What should it feel like → draft 1–3 rough **experience targets** in players' words (**mda-analyze** targets — loose; /define locks them). Break reference games down with **mda-analyze** reference.
- A hunch about rules or odds → **proto** (quick sim).
- A big new direction → **concept-eval**.
Skip heavy research if Muzzy just wants to move.

## Hand-off
Commit `GDD: discover` (or `Research: <feature>`). STATE: Stage = discover, RESUME HERE → "Discovery done — next: /define".
Say: *"We've got the space mapped. Say `/define` when you want to narrow it down — pick the concept, set the scope, and map out the build."*
