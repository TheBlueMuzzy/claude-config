---
name: define
description: Double Diamond stage 2 — narrow the game (or a big feature) down to a clear concept, scope (must per release / should / could / won't), design, and a feature map with dependencies in ROADMAP.md. Use when Muzzy types /define, says "let's lock it in", "let's nail down the design", "what's in scope", wants to write or update the GDD, or wants to add a big feature to the roadmap properly.
---

# /define — narrow it down (converge)

Read `~/.claude/config/bmuz/PROJECT-FILES.md` first (layout, planning model, ROADMAP format). No `.planning/STATE.md`? Do the quick setup from `~/.claude/config/bmuz/SETUP-AND-CONVERT.md`. Old GSD layout? Offer the conversion first.

Steps are marked by how they happen (F80): ① a script or hook does it · ② Claude's judgement, refused until it's on record · ③ judgement only. Most of /define is a design conversation ③; the marks below are where something checks.

**Why this matters:** every hour here saves loops in /develop. A clear GDD + a good feature map means Claude builds the right thing in the right order.

## 1. Where are we?
- **No GDD** → ask: *"Explore first (/discover), or fast-track — you already know what you want?"* Fast-track → `stages/fast-track.md` (one pass, ends with the feature map; commit `GDD + roadmap: fast-track` with STATE ② — guard-git).
- **GDD from /discover** (`Current phase: Discover`) → run the three parts below in order, one per sitting if Muzzy likes.
- **GDD complete** (`Current phase: Complete`) → ask what to rethink: a section of the GDD, the scope, or adding/reshaping features. Edit just that — and update ROADMAP.md to match (new features get IDs, types, scope, needs).

## 1b. Gap walk (always, before the three parts — Muzzy, 2026-10-16: "walk me through the steps to fill in the gaps after analyzing what you do have")
1. **Analyze first, ask second.** Read the GDD, `research/`, `design/` (and for a remake, the old docs + code). Check every GDD section and every feature against: settled · drafted (Claude's guess, needs a yes) · open · conflicting (docs vs code, old vs new).
2. **Show the gap map once:** one short table — what's settled (no questions), and the gaps in walk order. Order = what blocks the most comes first: feel targets → core rules → scope/release → systems → content/story → tutorial (last; it teaches the settled rules) → look & sound.
3. **Walk one gap at a time:** what we already have (quote it) · what's missing · Claude's recommendation + 2–3 options (AskUserQuestion when the options are clear, open question when it's taste) · write the answer into the GDD/design doc straight away, commit, then the next gap. Never a bulk list of questions ③ (conversation).
4. A gap that needs a feel test (a `/sketch` for feel/look, `proto` for numbers) → start it, skip ahead, come back. Muzzy can say "stop here" any time — STATE RESUME HERE names the next gap ② (stop-unsaved sends a "stopping" turn back to /save; save.mjs refuses an unchanged RESUME HERE when there's new work) · ③ naming the right gap.

## 2. The three parts
1. **Define** — `stages/define.md`: sharp pitch, design principles, **experience targets** (mda-analyze), success criteria, **scope** (Must per release · Should · Could · Won't) ③ (design work).
2. **Design** — `stages/design.md`: mechanics, systems, art & audio direction. Pull in **proto** for rules/odds, **game-economy** for resources, **ai-opponent** for bots, **mda-analyze** to trace each mechanic to the experience targets.
3. **Build plan** — `stages/build-plan.md`: the **TDD** (how it's built, standards, compliance, Dev Kit tools), milestones, and the **feature map** in ROADMAP.md — every feature typed (❓🧱🎮✨), scoped, and linked to what it `needs:` ② (plan-lint flags a feature with no type, no scope, or a need that isn't in the roadmap, and keeps the graph in sync). Show Muzzy the dependency tree before writing it ③.

At the end of each part: update `Current phase:` in the GDD and STATE (Stage, RESUME HERE), commit `GDD: <part>` (`GDD: define` / `GDD: design` / `GDD: build plan`) ② (guard-git refuses those without STATE.md in the commit), and ask *"Keep going, or stop here?"*

## 3. Defining one big feature (in an existing game)
Same three parts, feature-sized: what it's for (which principle it serves), its scope (must for which release?), how it works, and how it breaks down into features with needs ③ (design work). Add them to the right milestone in ROADMAP.md with new IDs ② (plan-lint: unique IDs, type, scope, needs). Update the GDD section it belongs in ③.

## 4. Hand-off
STATE: Stage = define → develop when the map is done; RESUME HERE → "Roadmap ready — N features ready to start. Next: /sprint" ② (the `GDD: build plan` commit carries STATE — guard-git).
Say ② (handoff-check: the card, Next `/sprint`): *"The map's ready — N features can start now. Say `/sprint` and I'll line up the first sprint."*
Ideas that aren't for now → ROADMAP → Ideas with the date ③ (spotting them).
