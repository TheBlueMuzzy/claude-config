# Obsidian with BMUZ

**Vault = `C:/Users/Muzzy/Documents/dev`** (all projects in one place). Same folder on the laptop.

## How parity works
- Obsidian edits the real files in each project. There is no separate copy, so nothing drifts.
- Git carries everything between machines: `/save` commits Muzzy's Obsidian edits together with Claude's, then pushes. The session-start hook pulls on the other machine.
- Rule: **`/save` before switching machines.** If both machines edit the same file without saving, git will ask which version wins, and Claude will explain.
- Vault settings (`dev/.obsidian/`) are not in any project repo. Set it up once per machine; Claude can copy the settings.

## What to open
- `<game>/.planning/STATE.md` — ▶ RESUME HERE: where things stand
- `ROADMAP.md` — milestones, features, dependency graph (drawn automatically)
- `SPRINT.md` — what's being built now, your 🙋 tasks
- `GDD.md` / `TDD.md` — the design and the engineering plan (TDD has the architecture diagram)
- `BUGS.md` — the bug list
- `<game>/content/**/*.json` — the numbers the game reads (tuning, animation, text, data)

## Editing rules (so Claude and you don't trip each other)
- Edit prose freely. Claude reads your changes at the next command and mentions anything that affects the plan.
- In ROADMAP/SPRINT, keep the line shapes (`- 🟢 F08 🎮 Name — must:alpha · needs: F07`). Moving lines around is fine.
- JSON: keep quotes and commas intact. If a file breaks, the game shows an error and Claude fixes it.

## Setup (once per machine)
1. Obsidian → Open folder as vault → `Documents/dev`.
2. Settings → Files & links → turn on **Detect all file extensions** (so .json files show up).
3. Plugin for editing JSON comfortably: Claude checks which community plugin is current at setup time and installs it with you.
4. Diagrams (Mermaid) and tables render natively, with no plugin needed.
