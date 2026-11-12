---
name: release
description: Stage 6 of 6, Release — take the finished 1.0 public — where it goes (the web, itch.io, Steam, phone app stores), each platform's current needs researched fresh with sources, the store page from the pitch, the launch only on Muzzy's clear OK, a live check from outside, players' first reactions read against the GDD's feelings, and a look back. Use when Muzzy types /release, or says "launch it", "go public", "put it on Steam / itch / the app store", "release 1.0", or after /deliver has built and versioned 1.0.
---

# /release — 1.0 goes public

Steps are marked by how they happen (F80): ① a script or hook does it · ② Claude's judgement, refused until it's on record · ③ judgement only.
Scripts: `~/.claude/config/bmuz/scripts/` (called `S/` below) — the same ones /deliver uses; never a second copy ③ (judgement: reuse over rewrite). Platform recipes: `~/.claude/config/bmuz/release/<platform>.md`. Rules for the plan files: `~/.claude/config/bmuz/PROJECT-FILES.md`.

**What Release means** (framework `research/bmuz-vision/stages.md`, the engine script's Stage 6): the public experiences the game. /deliver turns every milestone into a build to play and share — 1.0 included (checks, merge, version 1.0.0, tag). /release takes that 1.0 public, per platform, and listens to what players say.

## 1. Is 1.0 ready? ③
- 1.0 delivered: version.json is 1.0.0 (or later), tagged, ROADMAP's 1.0 heading ✅, the 1.0 release check filled (`.planning/archive/release-checks/1.0.md`) ①. Not yet → `/deliver` first (it does the 1.0 build, then hands back here).
- Read GDD §1 (pitch), §2 (the feelings), §7 (release path) and STATE Key facts `Release:`.

## 2. Where should it go? ③
Ask once, pick any: **the web** · **itch.io** · **Steam** · **phone app stores**. A web link is one step; Steam and the phone stores need store pages, artwork, forms and a review that can take days — say so up front.

## 3. Each platform's needs — researched fresh ③
Never from memory, even for a platform used before (CLAUDE.md "Research first"): read the platform's current rules and docs, cite each source, and compare with its recipe (`release/<platform>.md`) ③ (judgement: no script can tell a fresh source from memory). Per platform, say: **what it needs today** · **done** · **needs you** (accounts, payment, tax and ID forms, age rating, signing keys — only Muzzy can do those).
- No recipe yet → write one from the template in `release/README.md` as you go (untested steps marked ⚠). App stores / Steam → the **deployer** agent does the build work; the recipe is still written.
- Something that can't be done yet (a missing account, a store review pending) → `<platform> waits until <what>` as a ROADMAP line in the 1.0 milestone; that platform is picked up again later. Nothing else waits on it.

## 4. The store page ③
Draft it from the GDD's pitch (one line, the story, the familiar part and the new part): short description, long description, tags, screenshots list, the privacy and age answers. Muzzy changes anything; his words win.

## 5. The launch — only on Muzzy's clear OK ②
Ask per platform: **"Release <game> on <platform>?"** — options in this order: *Not yet — tell me what's missing* · *Release it — it goes public*. Only a clear yes launches (auto mode never does: Autonomous Mode stops before anything public ① — guard-git, live-push).
- **The web** (GitHub Pages, Vercel…): follow the recipe — ① smoke pass first (`node ~/.claude/config/bmuz/hooks/smoke-pass.mjs`, commit `.planning/smoke-pass`; a hook refuses a deploy push without a fresh pass or with an open P0), then `git push --follow-tags`. Companion servers only when release.mjs said server code changed (as /deliver §5).
- **itch.io**: the recipe's butler push (the same smoke-pass guard).
- **Steam / phone stores**: walk Muzzy through the steps only he can do, one at a time ("step N of M … say done when it's done"); the deployer agent does the rest.

## 6. Is it really live? ①
- Web / itch: `node S/live-check.mjs` — fetched from outside with a cache-buster, public (no login), the new version showing; records `.planning/live-pass` (commit it).
- A store: when the store shows it live, Muzzy pastes its link → open it from outside in Playwright (no login, the page loads, the game starts where the store allows) ③.
- STATE: the Live line per platform; Key facts `Release:` per platform; a Log line dated today.
- Something's badly wrong live → the fix goes out as a /deliver update (rollback.mjs runs only under /deliver until guard-git accepts /release — F226's morning file).

## 7. First reactions ③
Ask him to paste what players say (reviews, comments, messages, links). Read them against GDD §2's feelings and "we'll know when" signs — mark each target Seen? ✓ / ✗ in the GDD. Fixes worth making → an **Update 1.1** milestone in ROADMAP (features with types, scope, needs); then `/sprint` → `/develop` → `/deliver` as usual.

## 8. Look back ③
Follow `~/.claude/config/bmuz/templates/lookback.md` for the whole game, launch included → `.planning/archive/lookbacks/release-1.0.md` (/deliver's 1.0 look-back covers the milestone; this one covers the game and the launch): what this game taught for the next one, and for BMUZ itself (given to Muzzy as suggestions, landed only with his OK) ③ (judgement: no hook watches a launch's look-back yet).

## 9. Hand-off
STATE: Stage = release; RESUME HERE → "<game> is out on <platforms> — next: first reactions, or an update (/roadmap)".
Say ② (handoff-check: the card): each platform with its **clickable public link on its own line**, what's still waiting (and on what), and Next: paste first reactions here, or `/roadmap` for the 1.1 update.
