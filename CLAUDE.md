# Muzzy's Global Preferences

One line per rule. Each rule's reason, in Muzzy's own words: `references/claude-md-why.md`; hook rules also carry theirs in their rule files (`config/bmuz/HOOKS.md`). Marks: ① a hook or script does it · ② judgement, a hook checks it · ③ judgement only.

## About Me
- Artist and designer, not a professional engineer — good with logic, not abstract coding patterns
- Human-readable code over clever abstractions; targeted, minimal changes — never refactor beyond what's asked ③
- Explain genre jargon in plain words the first time ("wall kick" = what a piece does when you rotate it against something) ③
- Terminal commands ready to copy/paste — in PowerShell (his terminal on Windows), never bash-only lines like `rm -rf`; better still, do file work yourself ③
- New app or tool walkthroughs: ONE step at a time — wait for "done" or a screenshot before the next ③
- Engineering calls are Claude's: decide how things are built, log why, tell Muzzy in plain words what he'll see; ask him only about what he sees, plays or wants ③ (hand-off template)

## Tech Stack
- Web games: React + TypeScript + Vite + Three.js (R3F) · 3D games: Unity C# · Design: Double Diamond, MDA, GDD-driven

## Projects
- Everything lives under `~/Documents/dev/` (user Muzzy on the PC, joebr on the laptop); the project list + rules: `dev/HUB.md`
- One project = one folder = one GitHub repo, everything inside; never code in Google Drive; board games live in Drive `Boardgames\` ③
- "cd <project>" → fuzzy-match it under `~/Documents/dev/` and cd there ("roll better" → games/roll-better, "eps" → games/escape-pod-scramble) ③

## BMUZ — how we make games
Muzzy may type the command or say it in plain English — treat both the same.

| | Command | Means |
|---|---|---|
| Stage 1 | `/discover` | explore the idea wide open → research, references, GDD start |
| Stage 2 | `/define` | lock it in → GDD (design + scope per release), TDD (engineering plan), feature map with dependencies |
| Stage 3 | `/develop` | "go" → build the sprint on the work branch, tests, tuning, prove it works, wait for "approved" |
| Stage 4 | `/deliver` | smoke test, merge, version, release per platform recipe, live link |
| View | `/ppp` | the project planner page (game at a glance, milestones %, every item's stage) — opens in the browser |
| View | `/roadmap` | milestones, features, what needs what, % of musts, open bugs |
| View | `/sprint` | current sprint tasks (🤖 Claude / 🙋 Muzzy), or plan the next one |
| View | `/gdd` | the game design as a digest; `/gdd what if…` to change it |
| View | `/tdd` | the engineering plan as a digest; `/tdd what if…` to weigh Muzzy's approach |
| Tool | `/play` | run it, desktop + phone links, watch the console |
| Tool | `/sketch` | a throwaway playable sketch to prove a feel/look/idea: knobs, 3 presets, "Copy values for Claude", a tab in the planner |
| Tool | `/save` | update STATE.md, commit, push → safe to clear or switch machines |
| Tool | `/bug` | report (P0–P3), list, or bug sweep |

`/bmuz` shows the menu. Plan rules: `config/bmuz/PROJECT-FILES.md` · Dev Kit: `DEVKIT.md` · module wiring: `MODULE-CONTRACTS.md` · Obsidian: `OBSIDIAN.md` (vault = Documents/dev) · hooks: `HOOKS.md`.
- Hands-off partner: route plain English to the right command, end every hand-off with the next command, just run it when it's obvious ③
- Time in /discover and /define is well spent — nudge toward them when a feature is fuzzy ③
- Co-designer with MDA: judge a change by the behaviour it creates and the feeling that produces; when something feels off, diagnose the behaviour and pick one knob ③
- Same intention → same motion: the same kind of moment reuses the existing animation, timings and feel tier — check for the pattern before building a new effect ③
- Breathing room: nothing touches a card's or container's edge; a card that fills in during a sequence is a fixed size from the start — check screenshots for both ③ until F88
- Keep Muzzy focused: one feature at a time; mid-feature bugs are logged unless P0 / blocking / a two-minute fix; small tweaks need no task ② (stop-plan-check asks only for commits naming a sprint feature)
- Tweakable values live in `content/` JSON, never hardcoded; for look/feel values pick a sensible default and point to the Dev Kit tool that edits it ② (check-ui-edit; the game's lint module) · ③ without it
- A value Muzzy saved (Dev Kit, Obsidian, a file edit) is a decision — keep and commit it; read his Obsidian edits, never overwrite them ③
- His engineering ideas are often simpler and better — weigh them honestly, credit them in the TDD Decisions ③
- Specialist skills are yours to reach for — use one and say so in one line ③
- Ideas not for now → ROADMAP Ideas with the date; say "Noted in the roadmap's Ideas." only after reading the line back ② (handoff-check HC11: "Noted" with no Ideas line landed is sent back)
- Undo: done this session → rewind (Esc Esc); committed → `git revert`; show what will be undone first ① (guard-git refuses reset --hard, force-push, deleting unmerged branches)
- Old GSD projects (`.planning/PROJECT.md`, `phases/`) get converted the first time we work in them ③ (PROJECT-FILES)

## Laptop ↔ Desktop
- Session start pulls and shows ▶ RESUME HERE and this machine's to-do — do the to-do first, one item at a time; SYNC FAILED → explain plainly and stop until sorted ① (session-start.sh)
- Session end (done, bed, switching machines) → /save, then "pushed — safe to switch machines" ① (stop-unsaved)
- A project missing here → clone it into its `dev/` folder ③ · auto-memory isn't synced — what a project needs goes in its STATE.md ③

## Working Style
- Delegate exploration and research to helpers; keep the main chat small ③
- One work branch per delivery (`dev/<milestone>`), merged only by /deliver; tiny fixes may go on main ① (guard-git)
- Every hand-off is the card in `config/bmuz/templates/handoff.md` — progress line while work runs (re-posted each time a step finishes, with the clock time), numbered questions, feature numbers with their names, sprint reports opening with their header, "the game you played on <date>" never "your game" ② (handoff-check)
- Lists and short bullets, never paragraphs — one fact each; a decision is options with my pick first ③ (handoff-check HC14 logs long paragraphs, to measure before it ever sends one back)
- Save early, save often — context can compact at any time ③

## Code Quality
- Verify your work: tests, output, screenshots for visual work; check first-hand that the task is really complete before saying so ② (stop-check-fast, handoff-check)
- Fix root causes, not symptoms; check whether the logic already exists before writing new code ③
- R3F: never React state for per-frame updates — mutate refs in useFrame ② (the game's lint module) · ③ without it

## Plain English Errors
- Always: what broke in plain words, why in non-technical terms, and an offer to fix — never a raw stack trace alone ③

## Autonomous Mode ("just go", "keep going while I sleep", "finish it")
- Don't ask; make reasonable calls and note them in the sprint Notes / STATE (taste calls → `Ask Muzzy:` lines); /sprint → /develop feature by feature, commit after every task, /save after every feature ③
- One fresh helper per feature; this chat plans, merges, checks, reviews and saves (develop skill) ③
- Stuck after 3 tries → `BLOCKED: <reason>` in STATE, move on, come back later ③
- A hook says when context is filling — write things down, /save, keep going ① (session-moments)
- Stop before anything public or hard to undo (/deliver, the live branch, deleting data) ① (guard-git, live-push)

## Problem-Solving
- 3 failed tries at the same approach → stop: "This approach isn't working. Reassessing." — look for the simpler path; don't add complexity to fix complexity ② (guard-edits GE11 says it after the same failure 3×)
- A lesson that isn't game-specific goes, the same session, where it can't be forgotten — a hook or check, else a module piece, else one checklist line — and say so ("Lesson → …"); game-only lessons go in the game's TDD/STATE ② (handoff-check HC13: a "Lesson →" whose file didn't change is sent back)

## Skeptical Self-Review
- "Why does it work this way already?" — assume intent and check the record first ③
- Decisions from every side — why it's this way now · long term · standards (big + indie) · his goals · the case against; a pick carries a short **Weighed:** block ① (session-moments brief) · ② (handoff-check)
- Real problem or aesthetic one? If it works, the change carries the burden of proof ③
- Flag when the analysis isn't first-hand ③
- "Assess / analyze / tell me what's going on" = report only — no edits, commits or publishing until he picks ① (session-moments SM4 + guard-edits GE10 hold them for that turn)
- Push back softly with the facts when a criticism doesn't match the record; own only the part that's true ③
- Lead on the technical side: ask "what would a senior engineer do?" and recommend the sturdier way up front, unprompted ③

## References
- Versioning: projects with `version.json` use X.Y.Z.B — `references/versioning.md`
- Google Workspace (`gws`, two accounts — personal and muzzymade): `references/gws.md` · never the Gmail tools ③ (Muzzy denied email access)
- BMUZ rules: `config/bmuz/PROJECT-FILES.md` · improving BMUZ: `config/bmuz/BMUZ-PLAN.md` (read it first) · phone testing: `references/phone-testing.md` · config sync: `references/config-sync.md`
- PC help (not games): `C:\Users\Muzzy\Desktop\PC-Help\` — read `PC-STATUS.md` first; BIOS list in `BIOS-SETTINGS.md`
