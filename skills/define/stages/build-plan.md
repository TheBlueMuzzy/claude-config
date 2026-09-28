# Build plan — how it gets built, in what order

Goal: an engineering plan and a feature map with dependencies, so /develop builds the right things in the right order.

## Do
1. **TDD** — write `.planning/TDD.md` from `~/.claude/config/bmuz/templates/TDD.md`: stack and why, how the systems fit (Mermaid diagram), golden rules, the `content/` data files Muzzy will edit, standards, budgets, security, compliance checklist, third-party licenses, risks. Aim for ~120 lines; plain English. Pick **Dev Kit** tools from `~/.claude/config/bmuz/DEVKIT.md` — Tier 1 becomes a 🔧 foundation feature in the first milestone. **UI:** if the game has menus/HUD (web), note "UI: game-ui kit" in the TDD and let **game-ui** get the style picked (5-style sheet, one question) — it goes in the TDD Decisions log and `content/ui/style.json`.
2. **Milestones** — vertical slices (each one playable), tagged with the release stage they move toward. First milestone = smallest playable loop.
3. **Feature map** → `.planning/ROADMAP.md` (format in PROJECT-FILES.md):
   - every Must/Should/Could from GDD §7 becomes a feature; split anything that's really a building block + what's built on it;
   - type each (❓ 🧱 🎮 ✨ 🔧) and scope it;
   - **needs:** what must exist or be decided first — concrete ("splayed cards needs the card hand") or abstract ("discard pile needs the discard-rule decision"). Keep chains short: let foundations own the data others need. `~F07` = only needs F07 to *work*;
   - `why:` line on 🎮 ✨ ❓ features from the GDD mechanics traces; a Must with no reason → ask if it's really a Must; a primary target no feature serves → a gap;
   - features whose needs are met → 🟢 ready, others ⏳. ❓ decisions Muzzy can answer now → ask, write the answer into the GDD, mark ✅.
4. **Show Muzzy the dependency tree** (short text tree + "N features ready to start") before writing it. Adjust with him.

## Output
TDD.md and ROADMAP.md written; GDD header `Current phase: Complete` (ROADMAP owns milestones, the GDD doesn't repeat them). Commit `TDD + roadmap: build plan`.

## Done when
- TDD written · every Must feature typed, scoped, linked to its needs · Muzzy has seen the tree.
