---
name: define
description: Double Diamond stage 2 — narrow the game (or a big feature) down to a clear concept, scope (must per release / should / could / won't), design, and a feature map with dependencies in ROADMAP.md. Use when Muzzy types /define, says "let's lock it in", "let's nail down the design", "what's in scope", wants to write or update the GDD, or wants to add a big feature to the roadmap properly.
---

# /define — narrow it down (converge)

Read `~/.claude/config/bmuz/PROJECT-FILES.md` first (layout, planning model, ROADMAP format). No `.planning/STATE.md`? Do the quick setup from `~/.claude/config/bmuz/SETUP-AND-CONVERT.md`. Old GSD layout? Offer the conversion first.

**Why this matters:** every hour here saves loops in /develop. A clear GDD + a good feature map means Claude builds the right thing in the right order.

## 1. Where are we?
- **No GDD** → ask: *"Explore first (/discover), or fast-track — you already know what you want?"* Fast-track → `stages/fast-track.md` (one pass, ends with the feature map; commit `GDD + roadmap: fast-track`).
- **GDD from /discover** (`Current phase: Discover`) → run the three parts below in order, one per sitting if Muzzy likes.
- **GDD complete** (`Current phase: Complete`) → ask what to rethink: a section of the GDD, the scope, or adding/reshaping features. Edit just that — and update ROADMAP.md to match (new features get IDs, types, scope, needs).

## 2. The three parts
1. **Define** — `stages/define.md`: sharp pitch, design principles, **experience targets** (mda-analyze), success criteria, **scope** (Must per release · Should · Could · Won't).
2. **Design** — `stages/design.md`: mechanics, systems, art & audio direction. Pull in **proto** for rules/odds, **game-economy** for resources, **ai-opponent** for bots, **mda-analyze** to trace each mechanic to the experience targets.
3. **Build plan** — `stages/build-plan.md`: the **TDD** (how it's built, standards, compliance, Dev Kit tools), milestones, and the **feature map** in ROADMAP.md — every feature typed (❓🧱🎮✨), scoped, and linked to what it `needs:`. Show Muzzy the dependency tree before writing it.

At the end of each part: update `Current phase:` in the GDD, commit `GDD: <part>`, and ask *"Keep going, or stop here?"*

## 3. Defining one big feature (in an existing game)
Same three parts, feature-sized: what it's for (which principle it serves), its scope (must for which release?), how it works, and how it breaks down into features with needs. Add them to the right milestone in ROADMAP.md with new IDs. Update the GDD section it belongs in.

## 4. Hand-off
STATE: Stage = define → develop when the map is done; RESUME HERE → "Roadmap ready — N features ready to start. Next: /sprint".
Say: *"The map's ready — N features can start now. Say `/sprint` and I'll line up the first sprint."*
Ideas that aren't for now → ROADMAP → Ideas with the date.
