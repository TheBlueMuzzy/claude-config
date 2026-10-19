# BMUZ hooks — rules the computer enforces (F68 + F67, 2026-10-18)

A **hook** is a small script Claude Code runs by itself before or after one of Claude's actions. It can stop the
action and tell Claude why. Unlike a rule written in CLAUDE.md or a skill (which Claude has to remember), a hook
always runs. Scripts: `~/.claude/config/bmuz/hooks/` · wiring: `~/.claude/settings.json` (+ /develop's frontmatter).

| # | When | What it does | Why |
|---|---|---|---|
| 1 | Before any shell command | **Refuses** `git reset --hard`, any force-push, and deleting a branch whose work isn't merged yet (a fully merged branch may go — nothing is lost) | Muzzy's "never" rules for undo |
| 2 | Before Claude uses Muzzy's Chrome | **Asks Muzzy** each time (a permission prompt) | His browser, his call |
| 3 | Before `git commit` with TypeScript in it | Runs the type check (~4 s); a type error **refuses the commit** and shows the error | A no-test edit once pushed a broken build |
| 4 | Before anything goes live, in **every** project — it finds by itself which branch publishes each one (today: Glyphtender `main`, Roll Better `master`) and catches `npm run deploy`, `gh-pages`, `party:deploy`, `wrangler deploy`, `butler push` | **Refuses** unless the smoke test passed on this code. Doc-only changes (`.planning/`, `*.md`) don't count | Nothing untested reaches players |
| 5 | When /develop is about to hand back | Runs `npm run check:fast` if the code changed since it last passed (~1 min; max 5 min). Red → Claude keeps going to fix it or says plainly what's broken | Never "done" on broken code |
| 6 | After Claude edits a file under `src/` in a game with the UI kit | Reads that file's code for UI kit rule breaks (e.g. a colour typed into a screen instead of coming from the style file) and shows Claude any problems. Not visual — the visual checks (overlap, cut-off, 44 px) are `npm run check:framework` | UI kit rules caught at once, not at the end |
| 7 | When Claude finishes a turn in which it did work (edited or committed) | Its last message must be the **hand-off card** (`templates/handoff.md`: Done · You'll see · Try it · Proof · Questions · Next `/command` — what it covers) or, while work still runs, the progress line. Anything else is sent back once to be rewritten | Every hand-off looks the same (Muzzy, 2026-10-18: "I never want to see it any other way going forward!") |
| 8 | After Claude edits ROADMAP, SPRINT, BUGS or STATE (F67) | Checks the plan rules (needs point at real features and are done before building; the graph matches; 3–8 tasks each with an owner; the bug count is right, fixed P0/P1 have a guard test; STATE stays short) and **tells Claude** about anything new it broke; rebuilds the planner page | The plan files are what every session trusts |
| 9 | When Muzzy sends a message, and after each commit (F67) | At 80% and 90% context: **reminds Claude** to write down what a fresh Claude would need, then /save. "Going to bed" / "switching machines" → /save | Nothing lives only in Claude's memory |
| 10 | Before an edit or a shell command (F67) | **Refuses**: editing a game's copy of a framework module (fix it in the framework, reinstall) · piping a check into tail/grep (hides a failure) · writing code with a backslash through a heredoc or `python -c` (it gets mangled) | Each one broke something before |
| 11 | Before `git commit` / `git merge` on main (F67) | **Refuses** a `F08: …` commit with code on main, and merging a work branch into main, unless /deliver is running. Plan/doc commits and tiny fixes (no `F08:`) are fine | Main only changes through /deliver |
| 12 | Before going live (hook 4, F67) | Also **refuses** while BUGS.md has an open P0 | A P0 blocks every release |
| 13 | When Claude finishes a turn (F67) | Work committed while a sprint runs, but SPRINT.md untouched → **sent back** to log it as a task. Planner page rebuilt but not republished → sent back to republish | Every request shows up in the planner |
| — | Always | Gmail stays fully blocked (unchanged) | Muzzy's choice |

## Scripts — fragile jobs as one command (F69)
A **script** does a whole multi-step job the same way every time — or refuses before changing anything, saying why in
plain words. The skills call them; you never need to type them. Folder: `~/.claude/config/bmuz/scripts/`.

| Script | Does | Refuses when |
|---|---|---|
| `install-module.mjs <module> <game>` | Installs / updates a framework module: the module's own tests first, the dry run, the install, then that module's checks in the game | the module's own tests or checks are red · the game doesn't keep the module's promises yet (says what to wire) |
| `release.mjs <update\|milestone\|major> "<summary>"` | Version bump, history line, package.json, the `Release vX.Y.Z` commit and its tag — never pushes | uncommitted code · not on main · the tag already exists |
| `save.mjs "<summary>"` | Build +1, old Log lines to the archive, commit, push — and "safe to switch machines" only once GitHub has the commit | a `.env` or secret would be committed · the push failed (says NOT safe) |
| `archive-sprint.mjs` | Files a finished sprint and commits `Sprint NN done` | a feature isn't approved yet |
| `musts-check.mjs <stage>` | Lists the `must:<stage>` features still open before a release | — (exit 1 = some open) |
| `stop-servers.mjs <port\|name>` | Ends a local server's whole process tree (on Windows, killing only the port lets wrangler restart it) | — (never touches Claude, a shell or an editor) |
| `templates/check-all.mjs` (in each game) | A full check run takes a lock | another full check run is still going |

**Proof:** `node ~/.claude/config/bmuz/scripts/test-scripts.mjs` (throwaway repos; real servers for stop-servers).

**The smoke pass (hook 4):** `node ~/.claude/config/bmuz/hooks/smoke-pass.mjs` in the project runs its `smoke` npm
script (the game loads and one turn/round plays, console clean) and, only if it passes, writes `.planning/smoke-pass`
(the commit it tested). Commit that file, then push. /deliver does this right before the push. A game without a `smoke`
script gets told to add one (point it at an e2e that already plays a round).

**Proof:** `node ~/.claude/config/bmuz/hooks/test-hooks.mjs` — feeds every hook "should refuse" and "should allow"
cases in throwaway repos (202 checks, ~2 min). Each hook was also tried for real in a headless Claude session (2026-10-18).
Changing a hook → also try it with the chained commands Claude really types (`git add -A && git commit`, `commit && push`):
a hook sees the whole line BEFORE any of it runs — the commit gate's first real try slipped through that way.

**Real tries (a new or changed hook isn't done until one passes):** in a throwaway repo in the scratchpad, ask a
headless Claude to do the thing the hook should catch, then read what it did — `echo "<task>" | claude -p --allowedTools
"Bash Edit Write Read Glob Grep"` (the prompt goes in through stdin), then check the repo (`git log`, the file) and the
session log in `~/.claude/projects/<folder>/` for the hook's message. Each one caught something the unit tests didn't:
2026-10-18 a file made and committed on ONE line slipped past the main-branch rule (the file didn't exist yet when the
hook looked); the sprint nudge sent Claude looking for SPRINT.md in the wrong folder (now names the full path).

**Plan files by hand:** `node ~/.claude/config/bmuz/hooks/plan-lint.mjs <project>` lists every problem (the hook itself only mentions new ones).

**Switching one off:** delete its block in `~/.claude/settings.json` (hooks 1, 3, 4, 6–13 — the PreToolUse/PostToolUse/UserPromptSubmit/Stop
entries) or the `hooks:` lines at the top of `skills/develop/SKILL.md` (hook 5); type `/hooks` to see what's loaded.
Everything goes to the laptop with /sync.
