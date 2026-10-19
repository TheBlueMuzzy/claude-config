---
name: save
description: Save progress in a project — update STATE.md's resume-here notes, commit, and push so it's safe to clear the chat or switch machines. Use when Muzzy types /save, or says "save", "<save>", "commit", "document and commit", "handoff", "I'm done for now", "switching machines", "going to bed", or mentions the context getting full.
---

# /save — safe to walk away

Works in any git project, BMUZ or not.

## 1. Check it isn't broken
- If the project has tests, run them. If code changed, run the build.
- Failing? Say so in plain English: "Saving anyway, but heads up: the score test fails." Never hide it. Don't stop to fix unless Muzzy says so.


## 2. Update STATE.md (skip if the project has no .planning/)
**Old GSD layout** (`.planning/PROJECT.md` or `phases/`, or STATE says "Phase: X of Y")? Don't restructure anything. Just add a dated line under its current status section, then skip to step 3. Say: "This project still uses the old layout — `/roadmap` or `/sprint` will convert it."
Follow the template in `~/.claude/config/bmuz/PROJECT-FILES.md`:
- **▶ RESUME HERE** — rewrite it: where things stand, the exact next action, anything Muzzy must do by hand. Written for a fresh Claude with zero memory of this chat.
- **Where we are** — stage, milestone, sprint, what's being done, branch, version.
- **Key facts** — add anything learned this session that must survive (a gotcha, a decision, a port). Remove anything no longer true.
- **Log** — one new dated entry, 1–3 lines, player's-eye view (the script keeps 10 and moves older ones to `.planning/archive/log.md`).
- Ideas that came up but aren't being built → ROADMAP → Ideas.

## 3. Commit and push — one command
`node ~/.claude/config/bmuz/scripts/save.mjs "<plain summary>"`: build +1 in version.json, Log trimmed to 10, refuses `.env` / secrets / `.playwright-mcp/`, commits, pushes (upstream the first time), and says "safe to switch machines" only after checking GitHub has the commit. A refusal says why in plain words — fix that, run it again.
- No remote? If Key facts says `Remote: none (declined …)`, don't offer again. Otherwise offer once to create one (`gh repo create TheBlueMuzzy/<folder> --private --source . --push`); if he declines, record that.

## 3a. Refresh the project planner (if STATE Key facts has a `Planner (PPP):` link)
A hook rebuilds `.planning/ppp.html` after every plan-file edit (by hand: `node ~/.claude/config/bmuz/templates/ppp/build-ppp.mjs .`); republish it to that link with the Artifact tool (`url` = the link). A Stop hook reminds any command that changed the plan to do the same.

## 3b. Sync the shared setup (PC ↔ laptop)
Run `bash ~/.claude/config/bmuz/config-sync.sh status` (pulls `~/.claude-config` first).
- **INCOMING** (the other machine pushed config) → apply it first: `cd ~/.claude-config && bash setup.sh`, then re-run status.
- **CHANGED** lines (this machine's global setup — CLAUDE.md, skills, config, references, HUB.md… — differs from the repo) → push it without asking (Muzzy, 2026-10-14: "always sync to the laptop"): `bash ~/.claude/config/bmuz/config-sync.sh push "<plain summary>"`, and name what synced in one line of the report. If a CHANGED file was also changed by INCOMING, show both versions and ask which to keep.
- "only in repo" lines are usually things retired on purpose — mention once, never delete without asking (retire via RETIRED.txt).
- Nothing printed → say nothing.

## 3c. Clean up
- **Cleanup runs by itself** (Muzzy, 2026-10-04 "clean up after yourself"; automatic since F78): save.mjs runs cleanup.sh. That removes finished helper workspaces, git-ignored check output, temporary files and old `~/Documents/dev/.scratch/` entries. Its 🧹 line goes in the report.

## 4. Tell him
Two or three lines, player's-eye:
```
Saved + pushed (v0.2.0.93, branch dev/v0-3-card-play — on the other machine I'll switch to it automatically). Setup synced to the laptop too. 🧹 cleaned 1.2 GB.
This session: lobby shows seats, host can kick. Next: reconnect handling.
Safe to /clear or switch machines.
```
If the push failed, it's NOT safe — explain why in plain English and fix it.
No remote: "Saved locally (v0.1.0.6) — no GitHub backup, so NOT safe to switch machines."
