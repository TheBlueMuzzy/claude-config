---
name: save
description: Save progress in a project — update STATE.md's resume-here notes, commit, and push so it's safe to clear the chat or switch machines. Use when Muzzy types /save, or says "save", "<save>", "commit", "document and commit", "handoff", "I'm done for now", "switching machines", "going to bed", or mentions the context getting full.
---

# /save — safe to walk away

Works in any git project, BMUZ or not.

## 1. Check it isn't broken
- If the project has tests, run them. If code changed, run the build.
- Failing? Say so in plain English: "Saving anyway, but heads up: the score test fails." Never hide it. Don't stop to fix unless Muzzy says so.

## 2. Bump the build
If the project has `version.json`, bump build (B) now per `~/.claude/references/versioning.md`, so STATE gets the right number.

## 3. Update STATE.md (skip if the project has no .planning/)
**Old GSD layout** (`.planning/PROJECT.md` or `phases/`, or STATE says "Phase: X of Y")? Don't restructure anything. Just add a dated line under its current status section, then skip to step 4. Say: "This project still uses the old layout — `/roadmap` or `/sprint` will convert it."
Follow the template in `~/.claude/config/bmuz/PROJECT-FILES.md`:
- **▶ RESUME HERE** — rewrite it: where things stand, the exact next action, anything Muzzy must do by hand. Written for a fresh Claude with zero memory of this chat.
- **Where we are** — stage, milestone, sprint, what's being done, branch, version.
- **Key facts** — add anything learned this session that must survive (a gotcha, a decision, a port). Remove anything no longer true.
- **Log** — one new dated entry, 1–3 lines, player's-eye view. Keep 10; move older ones to `.planning/archive/log.md`.
- Ideas that came up but aren't being built → ROADMAP → Ideas.

## 4. Commit and push
- Stage everything relevant (never `.env`, secrets, or `.playwright-mcp/` — warn if you see them).
- Commit with a plain summary. Push the current branch (set upstream if new).
- No remote? If Key facts says `Remote: none (declined …)`, don't offer again. Otherwise offer once to create one (`gh repo create TheBlueMuzzy/<folder> --private --source . --push`); if he declines, record that.

## 4b. Sync the shared setup (PC ↔ laptop)
Run `bash ~/.claude/config/bmuz/config-sync.sh status` (pulls `~/.claude-config` first).
- **INCOMING** (the other machine pushed config) → apply it first: `cd ~/.claude-config && bash setup.sh`, then re-run status.
- **CHANGED** lines (this machine's global setup — CLAUDE.md, skills, config, references, HUB.md… — differs from the repo) → show the list in one line and ask: *"Your global setup changed here (CLAUDE.md, HUB.md…) — sync it to the other machine?"* Yes → `bash ~/.claude/config/bmuz/config-sync.sh push "<plain summary>"`. If a CHANGED file was also changed by INCOMING, show both versions and ask which to keep.
- "only in repo" lines are usually things retired on purpose — mention once, never delete without asking (retire via RETIRED.txt).
- Nothing printed → say nothing.

## 4c. Clean up
- **Clean up after yourself** (Muzzy, 2026-10-04): `bash ~/.claude/config/bmuz/cleanup.sh` — removes helper workspaces whose work is all on the main branch, empties git-ignored check output (`e2e-shots/`…), deletes temporary files (`*.tmp.*`, `e2e/_*.mjs`). Never touches tracked files; keeps (and names) any workspace that still holds work. Its one line goes in the report.

## 5. Tell him
Two or three lines, player's-eye:
```
Saved + pushed (v0.2.0.93, branch dev/v0-3-card-play — on the other machine I'll switch to it automatically). Setup synced to the laptop too. 🧹 cleaned 1.2 GB.
This session: lobby shows seats, host can kick. Next: reconnect handling.
Safe to /clear or switch machines.
```
If the push failed, it's NOT safe — explain why in plain English and fix it.
No remote: "Saved locally (v0.1.0.6) — no GitHub backup, so NOT safe to switch machines."
