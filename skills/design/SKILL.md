---
name: design
description: Stage 3 of 6, Design — assemble the locked concept into a game that can be built — GDD Part 2 (the rulebook, content and balance, change over time, opponents and online, look and sound, screens), the risky parts settled by sketches, sims or paper play, then the build plan (TDD + feature map in ROADMAP.md, checked against the GDD). Use when Muzzy types /design, says "let's work out the rules", "how does it play?", "let's design it", "make the build plan", "map out the build", or after /define locks the concept; also to design how a big new feature works and break it into features.
---

# /design — assemble the blocks

Read `~/.claude/config/bmuz/PROJECT-FILES.md` first (layout, planning model, ROADMAP format). No `.planning/STATE.md`? Do the quick setup from `~/.claude/config/bmuz/SETUP-AND-CONVERT.md`. Old GSD layout? Offer the conversion first.

Steps are marked by how they happen (F80): ① a script or hook does it · ② Claude's judgement, refused until it's on record · ③ judgement only. Most of /design is a design conversation ③; the marks below are where something checks.

**What Design means** (framework `research/bmuz-vision/stages.md`): the concept is locked (GDD Part 1); now the game is worked out in detail — rules, systems and screens — and the risky parts are settled by sketches and paper play before anything is built. It ends with the full GDD, then the build plan. The GDD is the north star: a source of truth for decisions and how Muzzy and Claude talk about the game, updated as the game becomes real (Muzzy, 2026-11-09).

## 1. Where are we? ③
- **No GDD, or Part 1 not locked** (`Current phase: Define`) → say so and offer `/define` first: Design builds on the locked one-page concept.
- **Part 1 locked** (`Current phase: Part 1 locked …`) → the two parts below, in order, one per sitting if Muzzy likes.
- **GDD complete** (`Current phase: Complete`) → ask what to rethink: a Part 2 chapter, a system, the build plan. Edit just that — and update TDD.md / ROADMAP.md to match (new features get IDs, types, scope, needs).

## 1b. Gap walk (always, before the two parts — Muzzy, 2026-10-16: "walk me through the steps to fill in the gaps after analyzing what you do have")
1. **Analyze first, ask second.** Read the GDD, `IDEATE.md`, `research/`, `design/` (and for a remake, the old docs + code). Check every Part 2 chapter and every feature against: settled · drafted (Claude's guess, needs a yes) · open · conflicting (docs vs code, old vs new).
2. **Show the gap map once:** one short table — what's settled (no questions), and the gaps in walk order. Order (stages.md, from the rework evidence) = rules' shape and the real skill → look, HUD and feel by sketch → systems → content and exact numbers → screens and names → teaching last.
3. **Walk one gap at a time:** what we already have (quote it) · what's missing · Claude's recommendation + 2–3 options (AskUserQuestion when the options are clear, open question when it's taste) · write the answer into the GDD/design doc straight away, commit, then the next gap. Never a bulk list of questions ③ (conversation).
4. A gap that needs a feel test (a `/sketch` for feel/look, `proto` for numbers) → start it, skip ahead, come back. Muzzy can say "stop here" any time — STATE RESUME HERE names the next gap ② (stop-unsaved sends a "stopping" turn back to /save; save.mjs refuses an unchanged RESUME HERE when there's new work) · ③ naming the right gap.

## 2. The two parts
1. **Design** — `stages/design.md`: GDD Part 2 — sketches for the risky parts, the rulebook, content and balance, change over time, scope and risks again, players and opponents, look and sound, screens and teaching. Pull in **proto** for rules/odds, **game-economy** for resources, **ai-opponent** for bots, **mda-analyze** to trace each mechanic to the experience targets ③ (design work).
2. **Build plan** — `stages/build-plan.md`: the **TDD** (how it's built, standards, compliance, Dev Kit tools), milestones, and the **feature map** in ROADMAP.md — every feature typed (❓🧱🎮✨), scoped, and linked to what it `needs:` ② (plan-lint flags a feature with no type, no scope, or a need that isn't in the roadmap, and keeps the graph in sync), checked against the GDD ③. Show Muzzy the dependency tree before writing it ③.

At the end of each part: update `Current phase:` in the GDD and STATE (Stage, RESUME HERE), commit `GDD: design` / `TDD + roadmap: build plan` with STATE.md in it ② (guard-git GG13 refuses either one without STATE.md), and ask *"Keep going, or stop here?"*

## 3. Designing one big feature (in an existing game)
After `/define` set what it's for and its scope: how it works (the GDD Part 2 chapter it belongs in), a sketch for its risky part, and how it breaks down into features with needs ③ (design work). Add them to the right milestone in ROADMAP.md with new IDs ② (plan-lint: unique IDs, type, scope, needs).
- **Changing a system that already exists?** First spend 5 minutes reading how its code really works — who holds what, what each screen can see (online too) — before the sketch or the design. ③ (Glyphtender sprint 33 retro, 2026-11-03: "awards are per player" and "an online screen has no log mid-game" were found after the sketch)

## 4. Hand-off
STATE: Stage = design → develop when the map is done; RESUME HERE → "Roadmap ready — N features ready to start. Next: /sprint" ② (the build-plan commit carries STATE; guard-git GG13 refuses it without).
Say ② (handoff-check: the card, Next `/sprint`): *"The game's worked out and the map's ready — N features can start now. Say `/sprint` and I'll line up the first sprint, then `/develop` builds it."*
Ideas that aren't for now → ROADMAP → Ideas with the date ③ (spotting them).
