---
name: ppp
description: Open the game's Project Planner Page (PPP) — the visual home screen of the project (the game at a glance, what's in hand now, milestones with %, every item's stage and scope, parking lot, bugs, log). Rebuilds it from the plan files, republishes it, and opens it in Muzzy's browser. Use when Muzzy types /ppp, or says "show me the planner", "open the plan", "project page", "where are we" (visual), "show me the big picture".
---

# /ppp — open the Project Planner Page

The page is drawn from `.planning/` GDD / ROADMAP / SPRINT / BUGS / STATE by `~/.claude/config/bmuz/templates/ppp/build-ppp.mjs`. It is never edited by hand: to change what it shows, change the plan files (or tell Claude).

1. **Build:** in the project folder run `node ~/.claude/config/bmuz/templates/ppp/build-ppp.mjs .` → `.planning/ppp.html` (gitignored). Make sure `.planning/ppp.html` is in `.gitignore`.
2. **Publish:** STATE Key facts has `**Planner (PPP):** <url>` → publish `.planning/ppp.html` with the Artifact tool using that `url` (keeps the link), and pass every sketch as `files`: `{"sketches/<file>.html": ".planning/research/sketches/<file>.html"}` (the Sketches tabs load them; a sketch needs a `<title>` and a `<meta name="description">` — the tab name and blurb). No link yet → first publish (icon `plan`), then write the link into STATE Key facts.
3. **Open it:** Artifact tool `action: "open"` with the url, so it opens in his browser. Don't make him click a link. Mention the link once in a short line, for the phone.
4. Say one line about what changed since last time if anything did (e.g. "M0 now 25%: F02 and F03 decided").

The page's rules (states, % on milestones, Milestone 0, parking lot) live in `~/.claude/config/bmuz/PROJECT-FILES.md` → "Project Planner Page".
