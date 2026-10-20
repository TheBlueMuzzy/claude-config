---
name: deliver
description: Double Diamond stage 4 — converge and put it out: check the release's must-haves are done, polish, merge the sprint branch, version, and release to the platform (GitHub Pages, Vercel, itch, app stores…) following a per-platform release recipe, then hand Muzzy the live link. Use when Muzzy types /deliver, or says "deploy", "release", "ship it", "put it live", "merge", "<deploy>", or "push it to the site".
---

# /deliver — settle it and put it out (converge)

Steps are marked by how they happen (F80): ① a script or hook does it · ② Claude's judgement, refused until it's on record · ③ judgement only.
Scripts: `~/.claude/config/bmuz/scripts/` (called `S/` below). Every refusal says why in plain words with a `→` fix: fix that, run it again.
Rules for the plan files: `~/.claude/config/bmuz/PROJECT-FILES.md`. **Old GSD layout?** Don't restructure; merge, version and release as below, add one dated line to the old STATE, and say "This project still uses the old layout — `/roadmap` or `/sprint` will convert it."

## 1. What kind? ③
- **update** — finished work onto the live site (most common) → Z.
- **milestone** — a milestone's features are all done → Y (even if another milestone stays open).
- **stage** — prototype / alpha / beta / 1.0 → Y, `--stage=<name>`. **major** — only when Muzzy says it's the public 1.0 → X.

## 2. Get it ready (the records release.mjs will look for)
Do these on the work branch, then commit (/save). release.mjs refuses until each is true — run `release.mjs … --dry-run` any time: it lists **every** open gate at once.
- ② **Reviews:** `/code-review` (low) on the commits after STATE's `Reviewed through:` → fix real bugs → move `Reviewed through: <commit>`. `/security-review` on the changes since the last release → fix real issues → `Security reviewed: <commit>` in Key facts. Not inside the repo → hand each to a subagent working in it (real bugs / real exploits only). The rest: list in plain English, ask ③.
- ② **Full check:** only if code changed since `Last full check:` — `npm run check:full`, then update that line. (Fast + check:framework are run by release.mjs itself ①.)
- ② **Bugs:** an open P0 refuses. Open P1s are printed → ask Muzzy ③: release anyway, or a bug sweep first?
- ② **Approval:** features with commits since the last tag that aren't ✅ → ask once ③ ("F08 hasn't had your OK yet — release anyway?"); yes → `--unapproved-ok`.
- ② **Finished sprint** → `node S/archive-sprint.mjs`.
- ② **Stage release:** musts — not all done → ask ③: finish first, or release anyway (`--musts-open-ok`, say what's missing in the notes). No playtest log since the last stage (F87) → `/play` watch mode with Muzzy first, or ask ③: release anyway (`--no-playtest-ok`). Tick what's true in TDD §7 Compliance; anything the platform still needs (e.g. a privacy policy) → list and ask ③. Stage checks ③: **alpha** a quick look (loads fast, no console errors, works on a phone); **beta / 1.0** the **optimize**, **accessibility-check** and **web-design-guidelines** skills + a phone test via `/play` — fix quick wins, list the rest as 🐞/✨ features.
- **First release to a platform?** ③ Do its one-time setup (base path, deploy workflow…) here on the work branch, so the tag contains it (see §5).
- Overrides are Muzzy's calls only — each one used is written into the release commit ("Released with: …").

## 3. Merge ①
`node S/merge.mjs <branch>` — pushes the branch, waits for GitHub's Checks to go green (red → it refuses with the link: say it plainly, "GitHub found something broken on this branch: <link>", fix on the branch — never merge around it), pulls main, `merge --no-ff`, deletes the branch here (GitHub's copy goes once main is pushed). `version.json` clashes settle themselves. Other conflicts ③ → it stops mid-merge and lists the files: resolve if obvious, else explain and ask; `git add` + `git commit --no-edit`, run it again (or `git merge --abort`). No Checks workflow / no gh → it warns: say so in §7 and offer `templates/checks.yml`. Already on main with nothing to merge → skip.

## 4. Version + notes — one commit
- ① **Patch notes draft:** `node S/release.mjs <kind> --draft-notes` → `.planning/archive/releases/vX.Y.Z.md`, the commits since the last tag grouped by feature, marked DRAFT (never over an existing file). Format: PROJECT-FILES "Patch notes".
- ② **Edit them with Muzzy:** rewrite each line as what the player notices, in a neutral voice ("Fixed the crash when…", never "We…") — no feature/bug ids, file names, "Dev Kit", checks or git talk in a game's notes; 1–3 sentences of Highlights; Balance as old → new; Known issues with a status; a library: Breaking + upgrade steps first. Show him the file, take his words, delete the DRAFT line. release.mjs refuses a missing / DRAFT / highlight-less / dev-talk file, naming each line (`--no-notes-ok` only on his say-so). The Highlights' first sentence is a good summary.
- ② ROADMAP: milestone/stage → its heading ✅ with today's date ("✅ released 2026-11-02 (v0.3.0)"); a stage release moves `Release target:` on ("beta — musts not set (/define)").
- ② STATE: a Log line dated today; RESUME HERE → "Released vX.Y.Z — next: /sprint (or /roadmap)"; Stage = deliver; the Live line. Key facts has a `Release:` line: `<platform> (recipe …)` · `none (library)` · `not set up (declined <date>)` · `<platform> — blocked: <why>`.
- ① `node S/release.mjs <update|milestone|stage|major> "<summary>" [--stage=alpha]` — checks every gate first (Fast tier, check:framework, reviews, full check, P0, approvals, sprint, ROADMAP, STATE, patch notes, packages, GitHub green for what was merged), and only then: bump, history, package.json + lock, STATE `Version:`, CHANGELOG.md (newest first) + the itch text (saved as `vX.Y.Z-itch.txt` beside the notes and printed), `public/third-party-notices.txt` for a game, commit `Release vX.Y.Z: …` with your ROADMAP/STATE/notes edits (the commit hooks check it), tag, cleanup.sh. It prints whether server code changed since the last tag. It never pushes.
- ② **Packages** (F85, `S/deps-check.mjs`): a GPL / AGPL / LGPL / unlicensed package or a high security problem in what players get refuses, naming the package and who pulls it in — swap or update it on a work branch; release anyway only on Muzzy's say-so (`--deps-risk-ok`). "Couldn't reach npm's security list" is a warning: say it in §7.

## 5. Release it — the platform's recipe ③
Recipes: `~/.claude/config/bmuz/release/<platform>.md` (shared by every project; Key facts `Release:` names the platform).
- ① **Smoke pass first:** `node ~/.claude/config/bmuz/hooks/smoke-pass.mjs` (the project's `smoke` script: loads, one turn/round, console clean — no script → add one pointing at an e2e that plays a round), commit `.planning/smoke-pass`, then `git push --follow-tags`. A hook refuses any push to a deploying branch or deploy command without a fresh pass, or with an open P0.
- **Recipe exists** → follow it step by step. Anything different this time → fix the recipe afterwards.
- **No recipe yet** → ask where it should go (suggest GitHub Pages for web; it needs a GitHub remote). Set it up, release, and **write the recipe as you go**: prerequisites, one-time setup, release steps, how to check it's live, gotchas. Short and exact. Record `Release:` in Key facts. App stores / Steam → the **deployer** agent, and still write the recipe.
- **Nothing to host** (a library like `dev/framework`) → `Release: none (library)`; merge, version, tag, push; §7 gives the repo link and what games get from it.
- **Not yet** (Muzzy doesn't want it hosted) → `Release: not set up (declined <date>)`; say plainly "Merged and versioned v0.1.1 — **not live anywhere yet**."
- **Blocked** (e.g. no GitHub repo) → do the local setup, write the recipe as far as it goes (untested steps ⚠), `Release: <platform> — blocked: <why>`, a `Muzzy:` line saying what unblocks it, and say it's **not live**.
- Companion servers (`npm run party:deploy`) only when release.mjs said "server code changed … yes" — server first. "no" → skip it and say "server unchanged — not redeployed".

## 6. Is it really live? ①
`node S/live-check.mjs` — waits for the deploy run, fetches the Live URL with a cache-buster (retrying while the host catches up), refuses unless it's public (no login) and shows the new version, runs `e2e:update` (offline-cache games: returning players get the new version) and `smoke:live` if the project has them, records `.planning/live-pass` (commit it), and deletes merged branches on GitHub. Nothing hosted → it records the skip. The URL changed → `--url=<new>` rewrites STATE's Live line.
- ③ No `smoke:live` script → the console is your check: open the URL in Playwright — 0 console errors, no failed requests (list them by URL), the new version showing.
- Something's badly wrong live → `node S/rollback.mjs <last good tag> "<why>"` ① puts the code back as a new commit (history kept), then it prints the rest: log the bug, release, smoke, push, live-check.
- **Clean up after yourself** (Muzzy, 2026-10-04) ① — release.mjs runs cleanup.sh; its 🧹 line goes in §7. A framework release went out too → `bash ~/.claude/config/bmuz/cleanup.sh ~/Documents/dev/framework`.

## 6b. Look back — milestone or stage only ②
Follow `~/.claude/config/bmuz/templates/lookback.md`: read the milestone (archived sprints, fixed bugs, Log, commits) → what went wrong · what was done more than once · what one game built that others need → give each a home (hook · check · script · framework module · checklist line · game · nothing) and **land it now** → `.planning/archive/lookbacks/<milestone>.md`. A Stop hook sends the turn back without it, or when a home isn't a real file.

## 7. Tell him — always with the clickable public link ③
The link on its own line as a full URL (live-check confirmed it's public), and 2–5 lines on how to test it (with friends too: room codes, what to look for).
```
Released v0.3.0 (alpha) — Card play milestone ✅
Live: https://thebluemuzzy.github.io/card-game/
New: <the notes file's Highlights + 2–4 of its bullets, as written>
Alpha musts: 9/9 ✅ · Look-back: 6 lessons → 2 hooks, 1 check, 3 lines
Devlog: paste .planning/archive/releases/v0.3.0-itch.txt into itch (or "no itch page")
```
The "New:" lines come from the notes file ① (release.mjs printed its itch text) — never re-written from the commits ③.
Milestone or stage delivered → ask one question: "One thing to keep doing, or stop doing, next time?" — a real answer becomes a look-back item with its home, landed the same session. Then: "Next: `/sprint` for the next batch, or `/roadmap` to see what's left."
