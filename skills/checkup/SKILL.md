---
name: checkup
description: BMUZ health check — are Muzzy's skills, borrowed skills, reference cards, plugins, MCPs and the two-machine sync still current, used and wired in? Reports in plain English and proposes updates, cuts and fixes; changes nothing without his OK. Use when the session start says "BMUZ checkup due", or Muzzy types /checkup, or says "check on BMUZ", "is everything up to date?", "are my skills stale?", "clean up my skills".
---

# /checkup — keep BMUZ healthy

Runs about monthly: the session-start hook says **"BMUZ checkup due"** when `~/.claude/config/bmuz/last-checkup` is 30+ days old. When you see that, tell Muzzy in one line and offer to run it. Don't run it in the middle of his game work.

## 1. Gather
Run `bash ~/.claude/config/bmuz/checkup.sh` (read-only; takes about a minute).

## 2. Judge each section
- **Upstream changed (↑):**
  - For a `copied` skill, read the upstream diff since our date and say what's new in one line. If it's better, offer to replace ours. Re-apply any local edits listed in `sources.json`'s `note`.
  - For an `adapted` skill, only look for new ideas worth borrowing.
  - Unknown upstream (?): try to find it once. If you can't, mark it frozen in `sources.json`.
- **Cards due (↻):** re-verify the facts that go stale (free-tier limits, licences, package names, prices) on the real pages. Update the card and its `checked` date.
- **Use:** transcripts only cover about 30 days on this machine. Counts include Claude reading a skill while working, including during checkups, so treat them as a hint only. **Unused ≠ unwanted.** Judge each skill by its job: is it wired into a BMUZ step, and would a game actually need it?
  - Wired, but its job never comes up → ask Muzzy: keep or retire?
  - Doing the same job as another skill → propose merging them.
- **Wiring (✗):** every specialist needs at least one BMUZ step that calls it by name. Propose where to wire it in, or propose retiring it.
- **Plugins / MCPs:** anything broken, needing login, or disabled for 3+ months → fix or retire it. Check `~/.claude/references/mcp-card.md` for anything a current project now needs.
- **Sync:** a difference between `~/.claude` and `~/.claude-config` means something wasn't pushed. A folder that exists only in the repo is a leftover, so propose adding it to `RETIRED.txt`.
- **Scan for news (quick):** in the Anthropic plugin marketplace and in the repos in `sources.json`, look for new skills in the areas BMUZ-PLAN cares about. Mention at most 3.

## 3. Report (one screen, plain English)
```
🩺 BMUZ checkup — <date>
Healthy: <n> skills current and wired
Updates ready: <skill — what's new — copy or borrow idea>
Needs a re-check: <card — what I verified/changed>
Maybe retire: <skill — why (job never comes up / duplicate)>
Fixes: <wiring, sync, broken MCP>
New worth a look: <≤3>
```
Then ask which to do. Nothing gets installed, replaced or retired without his OK. Retiring means adding the skill to `~/.claude-config/RETIRED.txt` (setup.sh archives it; nothing is deleted).

## 4. Close
- Write today's date to `~/.claude/config/bmuz/last-checkup`.
- Update the `checked` dates in `sources.json`.
- Save the report to `config/bmuz/reviews/checkups/<date>.md`.
- Sync to `~/.claude-config`, commit and push, following `references/config-sync.md`.
