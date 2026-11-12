---
name: define
description: Stage 2 of 6, Define — decide what the game (or a big feature) is, on one page — from the material Ideate gathered, one answer per need — the feelings, the pillars, the pitch, the core loop, platform and play, a clash check, the scope (must per release / should / could / won't) and the risks — then lock GDD Part 1, the concept, and hand to /design. Use when Muzzy types /define, says "let's lock it in", "let's decide what it is", "pin it down", "what's in scope", wants to write or change the concept, or wants to scope a big new feature.
---

# /define — make the blocks

Read `~/.claude/config/bmuz/PROJECT-FILES.md` first (layout, planning model, ROADMAP format). No `.planning/STATE.md`? Do the quick setup from `~/.claude/config/bmuz/SETUP-AND-CONVERT.md`. Old GSD layout? Offer the conversion first.

Steps are marked by how they happen (F80): ① a script or hook does it · ② Claude's judgement, refused until it's on record · ③ judgement only. Most of /define is a design conversation ③; the marks below are where something checks.

**What Define means** (framework `research/bmuz-vision/stages.md`): "which one is it?" per need, one answer each — the tight concept. It ends with **GDD Part 1, the one-page concept, locked**; the rules, systems, screens and the build plan are `/design`'s.
**Why this matters:** every hour here saves loops later. A clear concept means Design works out the right game and Claude builds the right thing.

## 1. Where are we? ③
- **No GDD and nothing gathered** (no `.planning/IDEATE.md`) → the opening first: `/ideate` (it asks for his idea and his material, and offers the jump to Define when the material already answers most of it). Never a separate "fast-track" pass ③ (judgement: reading what he has).
- **The game so far** (`.planning/IDEATE.md`; older projects: a GDD with `Current phase: Discover` + `research/discovery.md`, or `.planning/DISCOVER.md`) → create `.planning/GDD.md` from `~/.claude/config/bmuz/templates/GDD.md` (an older GDD: keep it, add the Part 1 / Part 2 headings) and run `stages/define.md`, one sitting or several.
- **Part 1 locked or GDD complete** → ask what to rethink: a Part 1 chapter or the scope. Edit just that, log the change with the date — and update ROADMAP.md to match when the scope moved (new features get IDs, types, scope, needs). Rules, systems and the build plan → `/design`.

## 1b. Gap walk (always, before deciding — Muzzy, 2026-10-16: "walk me through the steps to fill in the gaps after analyzing what you do have")
1. **Analyze first, ask second.** Read IDEATE.md (or the older GDD), `research/`, `design/` (and for a remake, the old docs + code). Check every Part 1 chapter against: settled · drafted (Claude's guess, needs a yes) · open · conflicting (docs vs code, old vs new).
2. **Show the gap map once:** one short table — what's settled (no questions), and the gaps in walk order: feelings → pillars → pitch → core loop → platform & play → scope → risks.
3. **Walk one gap at a time:** what we already have (quote it — what his material already answers shows first, one tap to keep) · what's missing · Claude's recommendation + 2–3 options (AskUserQuestion when the options are clear, open question when it's taste) · write the answer into the GDD straight away, commit, then the next gap. Never a bulk list of questions ③ (conversation).
4. Muzzy can say "stop here" any time — STATE RESUME HERE names the next gap ② (stop-unsaved sends a "stopping" turn back to /save; save.mjs refuses an unchanged RESUME HERE when there's new work) · ③ naming the right gap.

## 2. Decide and lock — `stages/define.md`
The feelings (**mda-analyze** targets), the pillars, the pitch (prior-art research offered once), the core loop, platform & play, a clash check, the scope (Must per release · Should · Could · Won't) and the risks ③ (design work). Then show the concept on one page and ask to lock it.

## 3. Defining one big feature (in an existing game)
Feature-sized: what it's for (which pillar and feeling it serves) and its scope (must for which release?) ③ (design work). Write it into GDD Part 1's scope; then `/design` works out how it plays and breaks it into features.

## 4. Hand-off
Part 1 locked → GDD header `Current phase: Part 1 locked <date>`; STATE: Stage = define → design, RESUME HERE → "Concept locked — next: /design"; commit `GDD: define` ② (guard-git refuses it without STATE.md in the commit).
Say ② (handoff-check: the card, Next `/design`): *"The concept's locked — one page. Say `/design` and we'll work out the rules, test the risky parts with sketches, and make the build plan."*
Ideas that aren't for now → ROADMAP → Ideas with the date ③ (spotting them).
