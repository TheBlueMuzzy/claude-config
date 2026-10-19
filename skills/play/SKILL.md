---
name: play
description: Start the game so Muzzy can play it — runs the dev server, gives desktop and phone links, and can watch the console while he plays. Use when Muzzy types /play or says "run it", "start the server", "let me try it", "give me the link", "let's playtest", "watch me play", or "<npm>".
---

# /play — let me try it

Steps are marked by how they happen (F80): ① a script or hook does it · ② Claude's judgement, refused until it's on record · ③ judgement only. Starting the servers is still done by hand ③ until play.mjs (proposed — one script for steps 1–2: read Key facts, reuse a running server, start it with --host + companions, wait, print both link kinds).

## 1. Start it
- Find how it runs: STATE.md → Key facts first (old GSD projects: look for a Dev Server / Deploy section instead, and don't restructure STATE), else `package.json` scripts (`dev`), else ask. The first time, write the run command and port into Key facts ③ until play.mjs.
- Already running? Check the usual port (curl it). Don't start a second copy ③ until play.mjs.
- Otherwise start it in the background with LAN access (e.g. `npm run dev -- --host`). Also start any companion server listed in Key facts (e.g. the online server). A local `wrangler dev` started here gets its own storage folder (`--persist-to .wrangler/state-play`) and its own port if the usual one is taken — two instances sharing `.wrangler/state` crash each other (SQLITE_BUSY) ③ until play.mjs.
- Wait until it answers, then check it loads without console errors (quick Playwright look) ③ until play.mjs · ② in a hand-off (handoff-check sends back a card whose local links don't answer).

## 2. Give the links — both kinds, clearly labeled
```
▶ LIVE — share with friends (v<version>, last /deliver):  <Live URL from STATE — full clickable URL>
  Dev version (what we're building now — just you):
    Desktop:  http://localhost:<port>/
    Phone:    http://<PC-LAN-IP>:<port>/      (same Wi-Fi; https only if the Vite config enables it)
```
Say plainly that friends can only use the LIVE link, and that it changes only on /deliver. No live version yet → say so and offer to set one up at the next /deliver.
Get the LAN IP from `ipconfig`. If the phone can't connect or needs motion sensors, use the Cloudflare tunnel from `~/.claude/references/phone-testing.md` and give that URL instead ③ until play.mjs.

## 3. Watch (offer, don't force)
"Want me to watch the console while you play? Tell me when you finish a round."
If yes → use the **live-playtest** method: open the page in Playwright without joining, wait for Muzzy's cue, pull console logs, and report in plain English: what happened, errors, anything odd. Don't poll constantly ③ (an offer).

## 4. Stopping it
When Muzzy's done (or before switching machines): stop the background task, then `node ~/.claude/config/bmuz/scripts/stop-servers.mjs <port>` (ends the whole server tree and says when the port is free) ① (guard-edits refuses taskkill / Stop-Process / kill-port and names this script).

## 5. What he sees → what we do
- A bug → `/bug` (it triages: fix now if small/blocking, else log it).
- A feel/look tweak ("shrink it to 93%") → just do it, then say "refresh". "Feels flat / no punch" → **game-feel**.
- After a real playtest (friends, or a full session) → **mda-analyze** playtest mode: what players did and said vs the GDD experience targets, update `Seen?`, one fix suggestion per ⚠️/❌. Ideas → ROADMAP Ideas ③ until F87 (QA routine: playtest log).
