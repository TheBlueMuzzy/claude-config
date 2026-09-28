---
name: deliver
description: Double Diamond stage 4 — converge and put it out: check the release's must-haves are done, polish, merge the sprint branch, version, and release to the platform (GitHub Pages, Vercel, itch, app stores…) following a per-platform release recipe, then hand Muzzy the live link. Use when Muzzy types /deliver, or says "deploy", "release", "ship it", "put it live", "merge", "<deploy>", or "push it to the site".
---

# /deliver — settle it and put it out (converge)

Read `~/.claude/config/bmuz/PROJECT-FILES.md` if you haven't this session.
**Old GSD layout?** Don't restructure. Merge, version and release as below; add one dated line to the old STATE. Say "This project still uses the old layout — `/roadmap` or `/sprint` will convert it."

## 1. What kind of delivery?
Ask only if it's unclear:
- **Update** — merge finished work and put it on the current live site (most common). Bumps **Z**.
- **Milestone** — a milestone's features are all done. Bumps **Y**, marks it ✅ in ROADMAP.
- **Release stage** — moving to prototype / alpha / beta / 1.0. Run the **done check** first: every `must:<stage>` feature in ROADMAP is ✅. Missing musts → list them and ask: finish them first, or release anyway (say what's missing in the release notes). 1.0 → ask about **X** (public release).

## 2. Make sure it's ready
- Do `/save`'s STATE + Log step first (always — even with nothing uncommitted), so the log records what's being delivered.
- Tests + build must pass (**verification-before-completion**: run them fresh, quote the result), plus a **smoke test** (the game loads and one turn/round plays through in Playwright, console clean). Any open **P0** in BUGS.md blocks the release. Open P1s → list them and ask. Offer a bug sweep if there are several.
- Release stage → tick what's true in TDD §7 Compliance; anything required by the target platform that's still unticked (e.g. privacy policy for app stores) → list it and ask.
- Features in this delivery not yet approved by Muzzy? Ask once: "F08 hasn't had your OK yet — release anyway?"
- Release stage checks, scaled to the stage: **alpha** → a quick look (loads fast, no console errors, works on a phone). **beta / 1.0** → the full **optimize**, **accessibility-check** and **web-design-guidelines** (menus/HUD) skills plus a phone test via `/play`. Fix quick wins; list the rest as 🐞/✨ features.
- **Credits check** (`content/credits.json`, lights from `~/.claude/references/indie-toolkit.md`): every 🟡 asset's credit line shows in the game's Credits screen, no 🔴 asset ships, and no asset file is missing from the list. Anything wrong blocks the release until it's fixed or Muzzy decides.
- A SPRINT.md whose features are all done → archive it (`Sprint NN done`).
- **Review before merging:** run the built-in `/code-review` and `/security-review` on the work branch's changes. Fix real bugs and security issues now. List the rest in plain English and ask.

## 3. First release to a platform? Set it up now
If §6 will need one-time setup (base path, deploy workflow…), do and commit it here on the work branch — so the version tag in §5 contains it. Follow/write the recipe as in §6.

## 4. Merge
- Main branch = `main` or `master` (see Key facts). Already on main with nothing to merge → skip to §5.
- `git checkout <main>`, `git pull` (only if there's a remote), `git merge --no-ff <branch>`. Conflicts → resolve if obvious (`version.json` → take main's, then bump in §5), otherwise explain and ask.
- Delete the merged branch locally (and on the remote, if any).

## 5. Version + notes (per `~/.claude/references/versioning.md`) — one commit
- Bump Z / Y / X per §1 (build resets to 0). `history` entry in version.json; sync `package.json` version if it has one.
- **Patch notes:** read the commits since the last version tag (`git log <last-tag>..HEAD --oneline`) and write 3–8 player-facing bullets: what players will notice, no code talk. A one-line version goes in the `history` summary. The bullets become §8's "New:" lines, ready to paste into an itch devlog.
- ROADMAP: milestone ✅ with date if finished; release line updated ("alpha — released 2026-11-02"). After a release stage, set `Release target:` to the next stage — if it has no musts yet: "beta — musts not set (/define)".
- STATE: version, Live line (with release stage), Stage = deliver, RESUME HERE → "Released vX.Y.Z — next: /sprint (or /roadmap)".
- Commit `Release vX.Y.Z: <summary>`, tag `vX.Y.Z`, push with tags (if there's a remote).

## 6. Release it — follow the platform's recipe
Recipes live in `~/.claude/config/bmuz/release/<platform>.md` (shared across all projects). The project's Key facts says which platform(s) it releases to.
- **Recipe exists** → follow it step by step. If anything was different this time, fix the recipe afterwards.
- **No recipe yet** (first release to this platform) → ask where it should go (suggest GitHub Pages for web; it needs a GitHub remote). Set it up, release, and **write the recipe as you go**: prerequisites, one-time setup, the release steps, how to check it's live, gotchas hit. Keep it short and exact. Record the platform in Key facts. For app stores / Steam, bring in the **deployer** agent and still write the recipe.
- **Not yet** (Muzzy doesn't want it hosted) → record `Release: not set up (declined <date>)` in Key facts and say plainly: "Merged and versioned v0.1.1 — **not live anywhere yet**."
- **Blocked** (platform chosen but something's missing, e.g. no GitHub repo) → do all the local setup, write the recipe as far as it goes (mark untested steps ⚠), record `Release: <platform> — blocked: <why>` in Key facts, add a `Muzzy:` line saying what unblocks it, and say plainly it's **not live**.
- Companion servers (e.g. `npx partykit deploy`) only when their code changed — check `git diff` of the merge.
- CI deploys (a workflow in `.github/workflows/`) → pushing main started it; watch with `gh run watch` until done.

## 7. Check it's actually live
Open the live URL in Playwright: it loads, shows the new version/feature, console clean. Retry after a minute if the host is still updating.

## 8. Tell him — always with the clickable public link
Confirm the link is public (opens without login), put it on its own line as a full URL, and add 2–5 lines on how to test it (with friends too: room codes, what to look for).
```
Released v0.3.0 (alpha) — Card play milestone ✅
Live: https://thebluemuzzy.github.io/card-game/
New: <2–4 player's-eye bullets>
Alpha musts: 9/9 ✅
```
If the Live URL changed after the commit, update STATE and commit.
Milestone or release stage delivered → ask one question: "One thing to keep doing, or stop doing, next time?" — a real answer becomes a line in STATE Key facts (or a CLAUDE.md rule if it applies to every game). Then: "Next: `/sprint` for the next batch, or `/roadmap` to see what's left."
