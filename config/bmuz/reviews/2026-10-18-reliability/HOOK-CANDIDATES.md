# Hook / script / check candidates — first pass of F67 (2026-10-18)
Read-only audit of CLAUDE.md, PROJECT-FILES, MODULE-CONTRACTS, BMUZ-PLAN and 14 skills: every rule a hook, script or
check could enforce instead of Claude remembering it. Already enforced (HOOKS.md 1–7) left out; judgement-only rules
left out. ⭐ = best value for the effort. Key point: half the ⭐ items share one piece — a plan-file reader
(`plan-lint.mjs`, built on build-ppp's parser) → build it first.

## Before an action (PreToolUse)
- ⭐ Read a check's own exit code → warn when check/test/tsc/eslint is piped into tail/grep/Select-Object (develop:79, deliver:20)
- ⭐ No heredoc for text with backslashes/apostrophes → refuse heredoc/`python -c` writing .ts/.tsx/.mjs with `\`, point to Edit (develop:57)
- ⭐ Never edit a game's copy of a kit → refuse edits under `src/ui/kit/`, `src/devkit/`: "change it in the framework, reinstall" (game-ui:27)
- ⭐ /develop never works on / merges into main → refuse `F\d+:` commits on main and merges into main outside /deliver (develop:20, 97)
- ⭐ An open P0 bug blocks a release → live gate also reads BUGS.md (bug:11, deliver:19)
- Never stage `.env`, secrets, `.playwright-mcp/` (save:27)
- Planner page never hand-edited; nothing extra in `.planning/` root (ppp:8, PROJECT-FILES:17)
- `wrangler dev` needs `--persist-to` (play:11) · no second dev server on a port that already answers (play:10)
- "Break code to prove a test fails" → commit first: ask before `git checkout <file>` / `git restore` over uncommitted work (develop:54)

## Right after an edit (PostToolUse)
- ⭐ Plan files stay well-formed (`plan-lint.mjs` on ROADMAP/SPRINT/BUGS/STATE edits): `needs:` point to real IDs, order respects needs, Mermaid matches; 3–8 tasks per feature, named files exist; BUGS "Open:" count right, fixed P0/P1 have `Guarded by:`; STATE ≤120 lines, Key facts ~40, Log ≤10 (PROJECT-FILES:29, 60, 74, 79, 85, 120–130; roadmap:27; bug:39)
- ⭐ Plan file changed → rebuild the planner page (publish caught by a Stop check) (save:32, develop:28)
- New `content/*.json` → must be listed in TDD §1/§3 (develop:48)

## Before handing back (Stop)
- ⭐ Every mid-sprint request becomes a SPRINT task → code committed this turn but SPRINT.md unchanged → nudge (develop:28)
- `F08: done` needs `Reviewed through:` + `Last full check:` in STATE covering the feature (develop:70, 85; PROJECT-FILES:116–117)
- After a milestone /deliver → the retro step ran (deliver:69) → becomes F74
- Delete `.playwright-mcp/` automatically (develop:90) · unpushed commits after /save → "NOT safe to switch machines" (save:51)

## Session moments (SessionStart / UserPromptSubmit / PreCompact)
- ⭐ Context checkpoint at 80% → read `ctx-used.txt`, inject "finish, write it into the plan files, /save" (CLAUDE.md:99)
- ⭐ "going to bed / switching machines / done for now" → inject "run /save" (CLAUDE.md:69)
- Machine to-do from HUB.md printed at start (CLAUDE.md:67) · kit / Dev Kit behind the framework → "update available" (develop:21)
- "Approved" → inject the approval steps (develop:94) · `.gitignore` gets `.claude/worktrees/` + `.planning/ppp.html` (develop:34, ppp:10)

## Scripts (fragile multi-step job → one command) — F69
- `release.mjs` (version bump, package.json, history, commit, tag) (deliver:36–41) · `bump-build` + log trim (save:15, 23)
- `archive-sprint` (sprint:23) · `musts-check` (deliver:15) · `kill-wrangler.ps1` (develop:72, play:29)
- A lock in `check-all.mjs` → no second check run at once (develop:73) · knob sweep for sketches (sketch:31)

## Checks in the game (check:fast / check:framework / /deliver)
- ⭐ Credits: every asset in `content/credits.json`, no 🔴, every 🟡 line on the Credits screen (PROJECT-FILES:100, deliver:24)
- Every Settings row that's on is read by the game (game-ui:14) · tweakables live in `content/` (lint against raw numbers in game logic)
- Tools/tests read `content/`, never restate it (develop:50) · installers run a module's own checks + lint and refuse on red (develop:58–59)
