---
name: sync
description: Sync Muzzy's global Claude setup (CLAUDE.md, skills, BMUZ config, HUB.md) between the PC and the laptop through ~/.claude-config — pull the other machine's changes, offer to push this machine's, then do this machine's to-do from HUB.md. Use when Muzzy says /sync, "sync", "sync my config/setup", or on a machine that hasn't synced in a while.
---

# /sync — the PC and the laptop get the same setup

Muzzy, 2026-10-13: "I'm not going to remember to type that exactly … I'll do a command /sync". So he never types git commands for this.
(Projects sync themselves: the session-start hook pulls the project you're in, /save pushes it. This is the GLOBAL setup only.)

1. `bash ~/.claude/config/bmuz/config-sync.sh status` (it pulls `~/.claude-config` first).
   - **INCOMING** (the other machine pushed setup) → `cd ~/.claude-config && bash setup.sh`, then run status again.
   - **CHANGED** (this machine's setup differs from the repo) → list the files in one line and ask: *"Your setup changed here (CLAUDE.md, a skill…) — send it to the other machine?"* Yes → `bash ~/.claude/config/bmuz/config-sync.sh push "<plain summary>"`. A file changed on BOTH machines → show both versions, ask which to keep.
   - The script is missing (a machine that never synced since it was added) → do it by hand: `cd ~/.claude-config && git pull && bash setup.sh`, then start again from step 1.
2. **Machine to-do:** `~/Documents/dev/HUB.md` → "📌 Machine to-do" for THIS machine (PC = user Muzzy, laptop = user joebr) → do it one item at a time, tick each; all done → delete that machine's part and push HUB.md (step 1's push).
3. Say in one line what came in, what went out, and what's left — e.g. "Synced — 2 updates in (CLAUDE.md, the develop skill), nothing to send. Laptop to-do: 3 of 4 done."
