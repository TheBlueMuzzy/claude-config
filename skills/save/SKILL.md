---
name: save
description: Save progress in a project — update STATE.md's resume-here notes, commit, and push so it's safe to clear the chat or switch machines. Use when Muzzy types /save, or says "save", "<save>", "commit", "document and commit", "handoff", "I'm done for now", "switching machines", "going to bed", or mentions the context getting full.
---

# /save — safe to walk away

Works in any git project, BMUZ or not.

Steps are marked by how they happen (F80): ① a script or hook does it · ② Claude's judgement, refused until it's on record · ③ judgement only.

## 1. Update STATE.md (skip if the project has no .planning/)
**Old GSD layout** (`.planning/PROJECT.md` or `phases/`, or STATE says "Phase: X of Y")? Don't restructure anything. Just add a dated line under its current status section, then skip to step 3. Say: "This project still uses the old layout — `/roadmap` or `/sprint` will convert it."
Follow the template in `~/.claude/config/bmuz/PROJECT-FILES.md`:
- **▶ RESUME HERE** ② — rewrite it: where things stand, the exact next action, anything Muzzy must do by hand. Written for a fresh Claude with zero memory of this chat. save.mjs refuses when it's word-for-word what GitHub has but there's new work; `--resume-unchanged` only when truly nothing a fresh session needs changed.
- **Where we are** — stage, milestone, sprint, what's being done, branch, version.
- **Key facts** ③ (what's worth keeping is judgement) — add anything learned this session that must survive (a gotcha, a decision, a port). Remove anything no longer true.
- **Log** — one new dated entry, 1–3 lines, player's-eye view (the script keeps 10 and moves older ones to `.planning/archive/log.md`).
- Ideas that came up but aren't being built → ROADMAP → Ideas.

## 2. Save — one command ①
`node ~/.claude/config/bmuz/scripts/save.mjs "<plain summary>"` does everything else, in order, and prints a line for each:
- **Cleanup** (cleanup.sh: finished helper workspaces, git-ignored check output, temp files, old `.scratch/` entries) → its 🧹 line.
- **Checks** ①: `npm run check:fast` (skipped when this exact code already passed it), else `npm test` + `npm run build`. A red one never stops the save — it prints "⚠ heads up — … fails": put it in the report in plain English ("Saving anyway, but heads up: the score test fails"). Don't stop to fix unless Muzzy says so.
- Refuses a stale RESUME HERE (above) and `.env` / secrets / `.playwright-mcp/`; adds missing ignore lines; build +1 in version.json; Log trimmed to 10; commits, pushes (upstream the first time); says "safe to switch machines" only after checking GitHub has the commit.
- **Planner page** (STATE has a `Planner (PPP):` link): rebuilt; when it changed it prints "republish … to <link>" — do that with the Artifact tool (`url` = the link). A Stop hook sends the turn back until you have.
- **Shared setup (PC ↔ laptop)** ①: this machine's changed skills/config/CLAUDE.md/HUB.md are pushed by themselves (Muzzy, 2026-10-14: "always sync to the laptop") → its "Setup synced to the laptop (…)" line goes in the report. "⚠ setup NOT synced — the other machine's changes come first" → apply them (`cd ~/.claude-config && bash setup.sh`); a file changed on both machines → show Muzzy both versions and ask which to keep; then save again. "only in ~/.claude-config" lines are usually things retired on purpose: mention once, never delete without asking (retire via RETIRED.txt).
- A refusal says why in plain words — fix that, run it again.
- No remote? ③ If Key facts says `Remote: none (declined …)`, don't offer again. Otherwise offer once to create one (`gh repo create TheBlueMuzzy/<folder> --private --source . --push`); if he declines, record that.
- Muzzy said he's stopping or switching machines? ② A Stop hook (stop-unsaved) won't let the turn end while the project has uncommitted or unpushed work.

## 4. Tell him
Two or three lines, player's-eye:
```
Saved + pushed (v0.2.0.93, branch dev/v0-3-card-play — the other machine's session start says to switch to it). Setup synced to the laptop too. 🧹 cleaned 1.2 GB.
This session: lobby shows seats, host can kick. Next: reconnect handling.
Safe to /clear or switch machines.
```
If the push failed, it's NOT safe — explain why in plain English and fix it.
No remote: "Saved locally (v0.1.0.6) — no GitHub backup, so NOT safe to switch machines."
