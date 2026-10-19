---
name: sync
description: Sync Muzzy's global Claude setup (CLAUDE.md, skills, BMUZ config, HUB.md) between the PC and the laptop through ~/.claude-config — pull the other machine's changes, offer to push this machine's, then do this machine's to-do from HUB.md. Use when Muzzy says /sync, "sync", "sync my config/setup", or on a machine that hasn't synced in a while.
---

# /sync — the PC and the laptop get the same setup

Muzzy, 2026-10-13: "I'm not going to remember to type that exactly … I'll do a command /sync". So he never types git commands for this ① (config-sync.sh does them).
(Projects sync themselves: the session-start hook pulls the project you're in, /save pushes it. This is the GLOBAL setup only.)

Steps are marked by how they happen (F80): ① a script or hook does it · ② Claude's judgement, refused until it's on record · ③ judgement only.

1. `bash ~/.claude/config/bmuz/config-sync.sh status` ① (it pulls `~/.claude-config` first).
   - **INCOMING** (the other machine pushed setup) → `cd ~/.claude-config && bash setup.sh`, then run status again ③ until config-sync.sh applies it itself (proposed: when nothing local changed).
   - **CHANGED** (this machine's setup differs from the repo) → push it without asking (Muzzy, 2026-10-14: "always sync to the laptop" — /save's script does the same ①) and name the files in one line: `bash ~/.claude/config/bmuz/config-sync.sh push "<plain summary>"`. A file changed on BOTH machines → show both versions, ask which to keep ③ (his call).
   - The script is missing (a machine that hasn't synced since it was added) → do it by hand: `cd ~/.claude-config && git pull && bash setup.sh`, then start again from step 1 ③ (rare).
2. **Machine to-do:** `~/Documents/dev/HUB.md` → "📌 Machine to-do" for THIS machine (PC = user Muzzy, laptop = user joebr) — the session start prints its open items ① → do it one item at a time, tick each; all done → delete that machine's part and push HUB.md (step 1's push) ③ (doing them is the work).
3. Say in one line what came in, what went out, and what's left — e.g. "Synced — 2 updates in (CLAUDE.md, the develop skill), nothing to send. Laptop to-do: 3 of 4 done."
