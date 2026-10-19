# Look-back — the self-improving loop (F74)

Muzzy, 2026-10-18: "when finishing a milestone, analyze it all and see if any lessons or structure/methods, etc can be
ported to BMUZ/Framework in a ever-flowing self-improving loop."

**When:** /deliver of a milestone or a release stage (not a plain update), before §8. **Where:** the project's
`.planning/archive/lookbacks/<milestone>.md` (e.g. `v0.9.md`). A Stop hook sends the turn back if a milestone went out
without one, or if an item's home doesn't exist.

## How to do it (~10 min)
1. **Read** the milestone, not the chat: its archived sprints (`archive/sprints/`, Notes + `Lesson →` lines), BUGS.md
   (fixed this milestone: what broke, what guards it now), the STATE Log, and `git log <last tag>..HEAD --oneline`
   (`fix` / `revert` / repeated commits on one thing are the tell).
2. **Find** three kinds of thing:
   - **Went wrong** — a bug that reached Muzzy, a check that missed it, a loop of fixes, a wrong guess.
   - **Done more than once** — the same steps by hand in several sprints, the same fix in two games, a question asked twice.
   - **Built for one game, others need it** — a part, a tool, a script, a test helper that's not game-specific.
   - **Promised but not landed:** take every review list or plan this milestone worked from (`~/.claude/config/bmuz/reviews/…`, a TDD plan, a research doc) and check each item against the real code: landed (where), or not. A "not" gets a home like any other item, and a quiet partial build counts as "not". This came from 2026-10-19: F69 built the installer without the lint step on the Oct 18 list, nobody logged it, and Muzzy found it (audit: `reviews/2026-10-18-reliability/AUDIT-2026-10-19.md`).
3. **Give each a home**, strongest first — something that runs beats something to remember:
   `hook` (`~/.claude/config/bmuz/hooks/`) · `check` (a module's conformance / check:fast) · `script` (one command for a
   fragile job) · `module` (a framework kit piece) · `checklist` (one line in the skill / PROJECT-FILES rule it belongs to)
   · `game` (only this game: its TDD / STATE) · `nothing` (say why — a one-off).
4. **Land it now**, in this session: make the change in that file (a big one → a ROADMAP feature with an ID, and the
   home is that ROADMAP line). Then write the item with the file it landed in.
5. Tell Muzzy in the hand-off card (**Done:** "Look-back: 6 lessons → 2 hooks, 1 check, 3 checklist lines") and ask
   the one question: "One thing to keep doing, or stop doing, next time?" — his answer is an item too.

## The file
```markdown
# Look-back — <project> <milestone> (<date>)
Read: sprints 05–07 · 4 bugs fixed · 38 commits since v0.8.0
## Went wrong
- <what happened, in one line> → hook: ~/.claude/config/bmuz/hooks/guard-edits.mjs (refuses …)
## Done more than once
- <…> → script: scripts/release.mjs (…)
## Built for one game, others need it
- <…> → module: ~/Documents/dev/framework/ui-kit/kit/… (…)
## Muzzy
- <his answer to "keep doing / stop doing"> → checklist: ~/.claude/skills/develop/SKILL.md (…)
```
Each item ends with `→ <home>: <path> (<what changed>)`. The path is a real file (`~/…`, or relative to the project);
`nothing` takes a reason instead: `→ nothing (a one-off: the laptop's clock was wrong)`.
