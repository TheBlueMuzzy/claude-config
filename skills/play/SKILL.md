---
name: play
description: Start the game so Muzzy can play it — runs the dev server, gives desktop and phone links, and can watch the console while he plays. Use when Muzzy types /play or says "run it", "start the server", "let me try it", "give me the link", "let's playtest", "watch me play", or "<npm>".
---

# /play — let me try it

## 1. Start it
- Find how it runs: STATE.md → Key facts first (old GSD projects: look for a Dev Server / Deploy section instead, and don't restructure STATE), else `package.json` scripts (`dev`), else ask. The first time, always write the run command and port into Key facts.
- Already running? Check the usual port (curl it). Don't start a second copy.
- Otherwise start it in the background with LAN access (e.g. `npm run dev -- --host`). Also start any companion server listed in Key facts (e.g. PartyKit).
- Wait until it answers, then check it loads without console errors (quick Playwright look).

## 2. Give the links
```
Desktop:  http://localhost:<port>/
Phone:    http://<PC-LAN-IP>:<port>/      (same Wi-Fi; https only if the Vite config enables it)
```
Get the LAN IP from `ipconfig`. If the phone can't connect or needs motion sensors, use the Cloudflare tunnel from `~/.claude/references/phone-testing.md` and give that URL instead.
If a deployed version exists (STATE.md → Live), mention it too.

## 3. Watch (offer, don't force)
"Want me to watch the console while you play? Tell me when you finish a round."
If yes → use the **live-playtest** method: open the page in Playwright without joining, wait for Muzzy's cue, pull console logs, and report in plain English: what happened, errors, anything odd. Don't poll constantly.

## 4. Stopping it
When Muzzy's done (or before switching machines): stop the background task, then make sure the port is really free — on Windows node can linger: `netstat -ano | findstr :<port>` → `taskkill /PID <pid> /F`.

## 5. What he sees → what we do
- A bug → fix it now if small, or add it as a 🐞 feature via `/roadmap`.
- A feel/look tweak ("shrink it to 93%") → just do it, then say "refresh".
- Planning real playtests with other people → use the **playtest-plan** skill.
