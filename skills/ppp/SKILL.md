---
name: ppp
description: Open the game's Project Planner Page (PPP) — the visual home screen of the project (the game at a glance, what's in hand now, milestones with %, every item's stage and scope, parking lot, bugs, log). Rebuilds it from the plan files, republishes it, and opens it in Muzzy's browser. Use when Muzzy types /ppp, or says "show me the planner", "open the plan", "project page", "where are we" (visual), "show me the big picture".
---

# /ppp — open the Project Planner Page

The page is drawn from `.planning/` GDD / ROADMAP / SPRINT / BUGS / STATE by `~/.claude/config/bmuz/templates/ppp/build-ppp.mjs`. Nobody edits it by hand: to change what it shows, change the plan files (or tell Claude).

Steps are marked by how they happen (F80): ① a script or hook does it · ② Claude's judgement, sent back until it's on record · ③ judgement only.

1. **Build:** in the project folder run `node ~/.claude/config/bmuz/templates/ppp/build-ppp.mjs .` → `.planning/ppp.html` ① (plan-lint also rebuilds it after every plan edit; save.mjs adds the `.gitignore` line).
2. **Publish:** STATE Key facts has `**Planner (PPP):** <url>` → publish `.planning/ppp.html` with the Artifact tool using that `url` (keeps the link), and pass every new or changed sketch as `files`: `{"sketches/<file>.html": ".planning/research/sketches/<file>.html"}` (the Sketches tabs load them; a sketch needs a `<title>` and a `<meta name="description">` — the tab name and blurb, sketch-lint checks them ①) ② (stop-plan-check sends the turn back while a rebuilt page, or a sketch changed this turn, hasn't gone out). No link yet → first publish (icon `plan`), then write the link into STATE Key facts ③ (once per project).
   - **Chat opened outside the project's folder** (e.g. resumed in `dev/games`, working in `dev/framework`): the artifact tools can't attach its files — say so in the card ("rebuilt, not republished — the next session in <project> does it"), never call the page published (framework v0.31, 2026-10-29) ③ (no hook sees which folder the chat opened in).
3. **Open it:** Artifact tool `action: "open"` with the url, so it opens in his browser. Don't make him click a link. Mention the link once in a short line, for the phone ③ (no hook can see the browser).
4. Say one line about what changed since last time if anything did (e.g. "M0 now 25%: F02 and F03 decided") ③.

The page's rules (states, % on milestones, Milestone 0, parking lot) live in `~/.claude/config/bmuz/PROJECT-FILES.md` → "Project Planner Page".
