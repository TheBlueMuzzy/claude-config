# BMUZ hooks — rules the computer enforces (F68, 2026-10-18)

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
| — | Always | Gmail stays fully blocked (unchanged) | Muzzy's choice |

**The smoke pass (hook 4):** `node ~/.claude/config/bmuz/hooks/smoke-pass.mjs` in the project runs its `smoke` npm
script (the game loads and one turn/round plays, console clean) and, only if it passes, writes `.planning/smoke-pass`
(the commit it tested). Commit that file, then push. /deliver does this right before the push. A game without a `smoke`
script gets told to add one (point it at an e2e that already plays a round).

**Proof:** `node ~/.claude/config/bmuz/hooks/test-hooks.mjs` — feeds every hook "should refuse" and "should allow"
cases in throwaway repos (94 checks, ~1 min). Each hook was also tried for real in a headless Claude session (2026-10-18).
Changing a hook → also try it with the chained commands Claude really types (`git add -A && git commit`, `commit && push`):
a hook sees the whole line BEFORE any of it runs — the commit gate's first real try slipped through that way.

**Switching one off:** delete its block in `~/.claude/settings.json` (hooks 1, 3, 4, 6, 7 — the PreToolUse/PostToolUse/Stop
entries) or the `hooks:` lines at the top of `skills/develop/SKILL.md` (hook 5); type `/hooks` to see what's loaded.
Everything goes to the laptop with /sync.
