---
name: checkup
description: BMUZ health check — are Muzzy's skills, borrowed skills, reference cards, plugins, MCPs and the two-machine sync still current, used and wired in? Reports in plain English and proposes updates, cuts and fixes; changes nothing without his OK. Use when the session start says "BMUZ checkup due", or Muzzy types /checkup, or says "check on BMUZ", "is everything up to date?", "are my skills stale?", "clean up my skills".
---

# /checkup — keep BMUZ healthy

Steps are marked by how they happen (F80): ① a script or hook does it · ② Claude's judgement, refused until it's on record · ③ judgement only. Most of a checkup is judging ③ — that's its job.

Runs about monthly: the session-start hook says **"BMUZ checkup due"** when `~/.claude/config/bmuz/last-checkup` is 30+ days old ①. When you see that, tell Muzzy in one line and offer to run it. Don't run it in the middle of his game work ③.

## 1. Gather
Run `bash ~/.claude/config/bmuz/checkup.sh` (read-only; takes about a minute) ①.

## 2. Judge each section
- **Upstream changed (↑):**
  - For a `copied` skill, read the upstream diff since our date and say what's new in one line. If it's better, offer to replace ours. Re-apply any local edits listed in `sources.json`'s `note`.
  - For an `adapted` skill, only look for new ideas worth borrowing.
  - Unknown upstream (?): try to find it once. If you can't, mark it frozen in `sources.json`.
- **Cards due (↻):** re-verify the facts that go stale (free-tier limits, licences, package names, prices) on the real pages. Update the card and its `checked` date.
- **Use:** transcripts only cover about 30 days on this machine. Counts include Claude reading a skill while working, including during checkups, so treat them as a hint only. **Unused ≠ unwanted.** Judge each skill by its job: is it wired into a BMUZ step, and would a game actually need it?
  - Wired, but its job never comes up → ask Muzzy: keep or retire? ③
  - Doing the same job as another skill → propose merging them.
- **Wiring (✗):** every specialist needs at least one BMUZ step that calls it by name. Propose where to wire it in, or propose retiring it.
- **Plugins / MCPs:** anything broken, needing login, or disabled for 3+ months → fix or retire it. Check `~/.claude/references/mcp-card.md` for anything a current project now needs.
- **UI kit:** games with `src/ui/kit/VERSION` older than `~/Documents/dev/framework/ui-kit/kit/VERSION` → offer an update (`install-kit.mjs`, shows what changes). Recipes built in a game but not yet in the framework → harvest them.
- **Sync:** a difference between `~/.claude` and `~/.claude-config` means something wasn't pushed. A folder that exists only in the repo is a leftover, so propose adding it to `RETIRED.txt`.
- **Same safety kit in every game** (section 7, F79): each ✗ names its fix (the check-run lock, GitHub checks, check:framework). Offer the fixes. A game on the shelf gets a roadmap line in its own ROADMAP instead of a fix now.
- **Dependencies + licences** (section 8, F85 — gathered by checkup.sh ①; judging them ③):
  - ✗ licence problem (GPL / AGPL / LGPL / no licence) or a high security problem → name the package in plain words and offer the fix: update it, or swap out what pulls it in. The next release refuses it anyway ① (release.mjs runs deps-check).
  - "N with a newer version" → only offer updates for packages players get, a few at a time, each a week old or more (min-release-age), on a work branch with the full check after. Big version jumps (react, vite) → a roadmap line, not a checkup fix ③.
  - "licences to read" → read each one's licence once; fine → say so, not fine → treat as ✗ ③.
  - "no min-release-age" → offer to add the line to that project's `.npmrc` (install-module.mjs adds it on the next module install ①).
  - "not installed on this machine" / "security not checked (offline?)" → say it plainly, no fix needed ③.
- **Skill tests (F71):** read `~/.claude/config/bmuz/last-skill-tests.json` (date, Claude Code version, result). Offer a run — never start one unasked (Muzzy, 2026-10-19: "A") — when a skill that has an `evals/` folder changed after that date, or `claude --version` / the model differs. Say the cost first: about $0.20 a case (`ls ~/.claude/skills/*/evals` counts them). On yes: `node ~/.claude/config/bmuz/scripts/test-skills.mjs --muzzy-said-yes` ② (the script refuses without it); a red case → read its failed checks and fix the skill (or the case) the same session ③.
- **Unmarked rules:** `node ~/.claude/config/bmuz/hooks/rule-kind.mjs --all` lists every rule line in the skills and BMUZ docs that doesn't say how it happens ①. Offer to convert the ones in BMUZ's own skills (a hook or script step, or a ①/②/③ mark).
- **Scan for news (quick):** in the Anthropic plugin marketplace and in the repos in `sources.json`, look for new skills in the areas BMUZ-PLAN cares about. Mention at most 3.

## 3. Report (one screen, plain English)
```
🩺 BMUZ checkup — <date>
Healthy: <n> skills current and wired
Updates ready: <skill — what's new — copy or borrow idea>
Needs a re-check: <card — what I verified/changed>
Maybe retire: <skill — why (job never comes up / duplicate)>
Fixes: <wiring, sync, broken MCP>
Packages: <per game: ✓ fine / what's risky, outdated count — or "all fine">
Skill tests: <last run date + result> · <run now? n cases ≈ $x — why (skills changed / new model)>, or "up to date"
New worth a look: <≤3>
```
Then ask which to do. Nothing gets installed, replaced or retired without his OK ③ (consent). Retiring means adding the skill to `~/.claude-config/RETIRED.txt` (setup.sh archives it; nothing is deleted).

## 4. Close
- Update the `checked` dates in `sources.json` for what you re-checked ③ (per item).
- Save the report to `~/.claude/config/bmuz/reviews/checkups/<date>.md`, then run `bash ~/.claude/config/bmuz/checkup.sh --done` ① — it refuses until today's report is saved, then writes today's date to `last-checkup` and pushes the setup to `~/.claude-config` (the laptop gets it).
