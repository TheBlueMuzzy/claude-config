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

## Setup (once per machine) - tested with Muzzy 2026-09-29 (Obsidian 1.13.7)
**Fast way (second machine):** close Obsidian, copy `~/.claude-config/config/bmuz/obsidian-vault/` into `Documents/dev/.obsidian/` (settings + the two plugins below), reopen, "Open folder as vault" -> `Documents/dev`.
**By hand (walk Muzzy through ONE step at a time):**
1. Obsidian start screen -> **Open folder as vault** (grey Open, not Create) -> paste your `Documents\dev` path (PC: `C:\Users\Muzzy\Documents\dev` · laptop: `C:\Users\joebr\Documents\dev`) in the picker's address bar -> Select Folder -> Trust.
2. Settings -> Files and links -> **Show all file types** ON (older versions: "Detect all file extensions"). Leave "Automatically update internal links" OFF.
3. Same page -> Advanced -> **Excluded files** -> + -> one regex (hides build/library junk from search everywhere):
   `/node_modules|\/dist\/|\.git\/|\.partykit|\.playwright-mcp/` - the file LIST still shows those folders; exclusions only hide them from search/graph.
4. **`.planning` is hidden by Obsidian** (it hides every dot-folder, no setting). Settings -> Community plugins -> Turn on -> Browse -> **OpenLoops Hidden Files** -> Install -> Enable. It needs the FULL vault path per project, no wildcards - Claude writes the list into `dev/.obsidian/plugins/openloops-hidden-files/data.json` (`{"folders": ["games/roll-better/.planning", ...]}`) while Obsidian is CLOSED.
5. JSON files don't open natively (Windows asks for a program). Browse -> **JSON Editor** (johannes-kaindl) -> Install -> Enable. Tree mode = click-to-edit values without breaking quotes/commas.
6. Diagrams (Mermaid) and tables render natively.
**New project ->** add its `<folder>/.planning` path to the OpenLoops list (Obsidian closed), and refresh the copy in claude-config.
