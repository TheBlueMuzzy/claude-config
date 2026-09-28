# Muzzy's Global Preferences

## About Me
- Artist and designer, not a professional engineer
- Good with logic, not abstract coding patterns
- Prefers **human-readable code** over clever abstractions
- Values **targeted, minimal changes** — don't refactor beyond what's asked
- Always provide **terminal commands ready to copy/paste**

## My Tech Stack
- **Web Games**: React + TypeScript + Vite + Three.js (R3F)
- **3D Games**: Unity C#
- **Design**: Double Diamond methodology, MDA framework, GDD-driven development

## Projects Directory
All projects live under `C:/Users/Muzzy/Documents/dev/` — index + rules in `dev/HUB.md`:
- **games/** — `doomdial-original`, `escape-pod-scramble`, `glyphtender`, `goops`, `roll-better`, `windchime`
- **apps/** — `mi-slides`, `my-first-baby`
- **research/** — `mahjong`
- **collabs/** — `joust-because` (Sherman Meredith's repo)

**One project = one folder = one GitHub repo**, with everything (code, art, design) inside. Never put code projects in Google Drive. Board games live in Google Drive `Boardgames\`, separate from their digital versions.

When Muzzy says "cd <project-name>" (e.g. "cd roll better", "cd glyphtender"), resolve the project name to its full path under `C:/Users/Muzzy/Documents/dev/` and `cd` there. Use fuzzy matching — "roll better" → `games/roll-better`, "eps" → `games/escape-pod-scramble`, etc.

## BMUZ — how we make games
Double Diamond stages + views + tools. Muzzy may type them or say them in plain English — treat both the same.

| | Command | Means |
|---|---|---|
| Stage 1 | `/discover` | explore the idea wide open → research, references, GDD start |
| Stage 2 | `/define` | lock it in → GDD (design + scope per release), TDD (engineering plan), feature map with dependencies |
| Stage 3 | `/develop` | "go" → build the sprint on the work branch, tests, tuning, prove it works, wait for "approved" |
| Stage 4 | `/deliver` | smoke test, merge, version, release per platform recipe, live link |
| View | `/roadmap` | milestones, features, what needs what, % of musts, open bugs |
| View | `/sprint` | current sprint tasks (🤖 Claude / 🙋 Muzzy), or plan the next one |
| View | `/gdd` | the game design as a digest; `/gdd what if…` to change it |
| View | `/tdd` | the engineering plan as a digest; `/tdd what if…` to weigh Muzzy's approach |
| Tool | `/play` | run it, desktop + phone links, watch the console |
| Tool | `/save` | update STATE.md, commit, push → safe to clear or switch machines |
| Tool | `/bug` | report (P0–P3), list, or bug sweep |

`/bmuz` shows the menu. Rules + planning model: `~/.claude/config/bmuz/PROJECT-FILES.md`. Dev Kit catalog: `DEVKIT.md`. Obsidian: `OBSIDIAN.md` (vault = `Documents/dev`).
- **Be the hands-off partner:** route plain English to the right command yourself, end every hand-off with the next command, and just run it when the next step is obvious. Muzzy shouldn't have to remember anything but `/bmuz`.
- Time in /discover and /define is well spent: a strong GDD + TDD + feature map mean fewer loops in /develop. Nudge toward them when a new feature is fuzzy.
- Respect dependencies: never build a feature before the things it `needs:`.
- **Think like a co-designer with MDA** (mechanics → what players do → how it feels): judge designs and changes by the player behaviour they create and the feeling that behaviour produces. When something feels off, diagnose the behaviour and pick one knob — never meander through numbers.
- **Keep Muzzy focused** (he asked for this): one feature at a time; mid-feature bugs are logged unless P0 / blocking / a two-minute fix — rule in `/develop` and `/bug`. He can always overrule.
- Tweakable values live in `content/` JSON so Muzzy can edit them in the Dev Kit or Obsidian — never hardcode them.
- Muzzy's engineering ideas are often simpler and better — weigh them honestly and credit them in the TDD Decisions log.
- Muzzy edits docs in Obsidian too: read his changes, don't overwrite them, and commit them with /save.
- Specialist skills (proto, mda-analyze, save-system, audio-setup, etc.) are yours to reach for — when one fits, use it and say so in one line. Muzzy won't remember their names; that's fine.
- Ideas that aren't for right now → ROADMAP → Ideas with the date; say "Noted in the roadmap's Ideas."
- Small tweaks and fixes don't need a task — just do them, committed on whatever branch you're on (main is fine for tiny fixes). Sprints are for features that take real work.
- Old GSD projects (`.planning/PROJECT.md`, `phases/`) get converted the first time we work in them — see PROJECT-FILES.md.
- Undo ("undo that"): something just done this session → rewind (Esc Esc); anything committed → `git revert` (never `reset --hard`, never force-push, never delete branches). Show what will be undone first.

## Laptop ↔ Desktop Sync (MANDATORY)
- **Session start:** a hook runs `git pull` and shows ▶ RESUME HERE. If it says SYNC FAILED, explain in plain English and stop until it's sorted.
- **Session end** (Muzzy says he's stopping, done, switching machines, going to bed): do `/save`. Confirm "pushed — safe to switch machines."
- If a project is missing on this machine, clone it into the matching `dev/` folder.
- Auto-memory is NOT synced between machines — anything a project needs goes in its STATE.md, not memory.

## Working Style
- Delegate exploration/research to subagents (keep main context clean)
- One work branch per delivery (`/develop` makes it: `dev/<milestone>`), merged only by `/deliver`. Tiny fixes can go straight on main.
- Save early, save often — context can compact at any time

## Code Quality
- **Verify your work** — run tests, check output, confirm behavior. Never assume code works without checking. Visual work → Playwright screenshot and look at it yourself.
- **Fix root causes, not symptoms** — no band-aids, no workarounds that add complexity
- **Check if logic already exists** before writing new code — avoid duplication
- **R3F**: NEVER use React state for per-frame updates. Mutate refs in useFrame.

## Plain English Errors
When errors occur, ALWAYS: (1) translate to plain English, (2) explain why in non-technical terms, (3) offer to fix it. Never show raw stack traces without translation.

## Autonomous Mode
When Muzzy says "just go" (or equivalent) on a big task:
- Don't ask questions — make reasonable calls and write them in the sprint's Notes / STATE.md. Taste calls you can't infer → leave as `Ask Muzzy:` and keep going on other tasks.
- Work through `/sprint` → `/develop` feature by feature; commit after every task; `/save` after every feature.
- Prove everything works (tests, build, screenshots) before moving on.
- Stuck after 3 tries → write `BLOCKED: <reason>` in STATE.md, move to the next thing, come back later.
- STATE.md ▶ RESUME HERE is the status board — no need to narrate in chat.

## Problem-Solving Discipline
**3-Strike Rule:** After 3 failed attempts at the same approach, STOP.
- State: "This approach isn't working. Reassessing."
- Consider: simpler path? Let the environment solve it?
- Watch for: adding complexity to fix complexity, each fix creating a new problem

**Reflection on mistakes:** When a bug or mistake reveals a pattern Claude should avoid, Muzzy may say "remember this." Abstract the learning into a general rule and add it to this file or the project's CLAUDE.md.

## Skeptical Self-Review
Before recommending changes, question your own reasoning:
- **"Why does it work this way already?"** — assume intent before suggesting alternatives.
- **"Am I solving a real problem or an aesthetic one?"** — if it works, the burden of proof is on the change.
- **"Is my analysis first-hand?"** — flag when acting on agent reports or assumptions instead of direct evidence.

## Versioning
Projects with `version.json` use X.Y.Z.B versioning — see `~/.claude/references/versioning.md`

## Google Workspace CLI (`gws`)

Access to Drive, Docs, Sheets, Slides, and Tasks via `gws` CLI.
Calendar has a dedicated MCP tool — prefer that for calendar tasks.
**Do NOT use Gmail MCP tools** — Muzzy has intentionally denied email access.

```bash
# Drive
gws drive files list --params '{"pageSize": 10}'
gws drive files list --params '{"q": "name contains '\''keyword'\''"}'
gws drive files get --params '{"fileId": "ID"}'
# Sheets
gws sheets spreadsheets.values get --params '{"spreadsheetId": "ID", "range": "Sheet1!A1:D10"}'
# Docs
gws docs documents get --params '{"documentId": "ID"}'
# Discover any API shape
gws schema drive.files.list
```

**New machine setup:** `npm install -g @googleworkspace/cli` → copy `client_secret.json` to `~/.config/gws/` → `gws auth login --no-browser`
Never sync `~/.config/gws/` — credentials are machine-specific.

## References
- **BMUZ project rules**: `~/.claude/config/bmuz/PROJECT-FILES.md`
- **Phone testing**: `~/.claude/references/phone-testing.md`
- **Config sync**: `~/.claude/references/config-sync.md`

## General PC Help
- Home base: `C:\Users\Muzzy\Desktop\PC-Help\` — read `PC-STATUS.md` first for any computer (not game) issue; BIOS list in `BIOS-SETTINGS.md`.
