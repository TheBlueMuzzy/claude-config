---
name: develop
description: Double Diamond stage 3 — build the current sprint's tasks in order, trying options where the design is open, checking its own work with tests and screenshots, and tuning once things work, then stopping for Muzzy's approval. Use when Muzzy types /develop, or says "go", "build it", "do it", "keep going", "continue", "next task", or gives feedback/tweaks on something being built.
---

# /develop — build the solution (diverge, then settle)

Read `~/.claude/config/bmuz/PROJECT-FILES.md` if you haven't this session. Old GSD layout? Offer the conversion first.

## 1. Line up
- No SPRINT.md (or it's finished) → do `/sprint` B (plan the next sprint), get OK, then continue here.
- Tiny request that isn't in the sprint ("shrink it to 93%") → just do it on the current branch, commit, done. Not everything needs a task.
- Open `Ask Muzzy:` questions on the next task? Ask now (2–3 options + your pick), write answers into Notes.
- **Branch — one work branch per delivery, not per sprint:** on the default branch (main/master) → create `dev/<milestone-slug>` and switch (if the project auto-deploys from main, say once: "The live site now only updates when you `/deliver`."). Already on a `dev/…` or other work branch → stay on it, across as many sprints as it takes until `/deliver`.
- **UI task?** Compare the game's `src/ui/kit/VERSION` with `~/Documents/dev/framework/ui-kit/kit/VERSION`; behind → offer the update (install-kit `--dry-run` first, then run it). Same for the Dev Kit: `src/devkit/VERSION` vs `framework/devkit/kit/VERSION` (`devkit/scripts/install-devkit.mjs`).
- STATE (only if it changed): Stage = develop, Doing = "F08 — building".
- One-line kickoff: "Picking up F08 — hover lifts the card. 3 tasks left in this sprint."

## Focus rule (Muzzy asked to be kept on track)
- **One feature being built at a time.** If Muzzy starts steering to another feature, say so in one line and offer to park it.
- Mid-feature reports are sorted out loud in one line: a tweak to *this* feature → do it · a bug → `/bug` triage (fix now only if P0, it breaks this feature, or it's a two-minute fix in code being changed — else log it and continue) · a new idea → ROADMAP → Ideas.
- Endless noodling on one feature → point it out kindly: "F08 has been in tuning for a while — ship it as is and log the rest as a ✨ feature?"

## 2. Do the tasks
For each unticked 🤖 task, in order (skip 🙋 tasks — remind Muzzy of them at the hand-off):
- **Small tasks:** do them yourself. **Big ones** (lots of reading, or a fresh head helps): hand to a `general-purpose` subagent with the task, the feature's "Done when", relevant Key facts, and "report what changed and anything surprising." Tasks from different features that don't touch the same files can run in parallel.
- **After a helper's work is merged** → `bash ~/.claude/config/bmuz/cleanup.sh` (removes its finished workspace — they were 3.9 GB in Glyphtender by v0.3.0).
- **Helpers in worktrees** start from main, not the work branch: their brief's first step is `git merge --ff-only <work branch>`; tests, lint and git ignore `.claude/` (worktrees live there). Each helper's local servers use their own ports and storage (`wrangler dev --persist-to …`).
- **Helper briefs ask for the Area check, not Full** (PROJECT-FILES.md "Checks"): Fast + the e2e scripts for what they touched. Claude runs Full once after merging. A helper's report quotes its Area results; don't re-run them after a clean merge — run Fast.
- **Layout/UI briefs list every size** — 390x844, 360x780, 844x390, a short window ~768x343, ~1100 wide, 1440x900, 1920x1080 — with per-size checks; a layout ask applies at ALL sizes. Look at a desktop shot yourself before saying done.
- **UI sprints / multi-part work — default pattern:** a framework helper ∥ a game helper when their files don't overlap; one bigger game helper per sprint, not one per task; bugs grouped by the files they touch (one helper per file group, not per bug). A Monitor on SPRINT.md ticks (and framework commits) posts the progress bar as tasks land — re-arm it when it expires.
- **Design is open** (feel, look, feature behaviour)? That's the diverge part — try 2–3 quick variants when cheap (behind a toggle or tuning value) and let Muzzy pick. Don't guess on taste.
- **"Feels off" / a `(tuning)` task** → think it through with **mda-analyze** diagnose before touching numbers: name the feeling → look at what players actually do (Dev Kit Snapshots/Time, bot runs, proto) → sort the cause (feel · readability · dynamic · the rule can't do it → /gdd) → offer 2–3 real knobs in `content/tuning/` with a prediction each, one at a time. Log `Tuning: knob old→new — why — result` in SPRINT Notes.
- Cause is **feel** (it works but feels flat, weak, floaty, no impact) → reach for **game-feel**: juice tiers in `content/feel.json`, still one knob at a time.
- Reach for specialists when a task calls for it: **proto** (rules/odds), **tuning-setup** (live sliders for tuning tasks), **save-system**, **audio-setup**, **multiplayer-setup**, **r3f-best-practices** + **three-best-practices** (any 3D work)… R3F rule: never React state for per-frame updates — mutate refs in useFrame.
- Any screen, menu, settings, HUD, dialog, results or lobby (or UI that looks off / breaks on a phone) → **game-ui**: it builds from the Game Framework UI kit in the game's chosen style. Never hand-style game UI.
- Need placeholder art or audio? Follow the **placeholder ladder** in `~/.claude/references/indie-toolkit.md` (shapes → emoji/icons → Kenney/Quaternius kit → real art; ZzFX for sound), and log every asset we didn't make in `content/credits.json`.
- A project needs Claude to work inside another program (Unity Editor, Supabase, a live Cloudflare deploy…)? Check `~/.claude/references/mcp-card.md` — prefer a CLI; offer the MCP in one line when its trigger hits, set up so it syncs (plugin or the repo's `.mcp.json`).
- Features with rules or logic get **tests** as part of being done (rules/logic → unit tests; key flows → a Playwright smoke check). Feel isn't tested — Muzzy judges it.
- Tweakable values go into `content/` JSON (never hardcoded) so Muzzy can change them in the Dev Kit or Obsidian. A new data file or Dev Kit tool → update TDD §1/§3. A real "how should we build this" choice → TDD Decisions log.
- **Tools, tests and sims read `content/`, never restate it** (Glyphtender F46: three scripts + the Dev Kit hard-coded "Large for 3–4 players", so the award re-tune measured the wrong board). Changing a default → grep for copies of the old value in `scripts/`, tests, e2e and tools, and re-measure anything that was measured on it.
- **Changing a default players can save** (a New Game / lobby option): returning players keep their OLD saved value, so the new default never reaches them. Version the save (e.g. a `…Save` marker) so old saves take the new default once — and test it with an old save (Glyphtender v0.5.2, 2-letter words).
- **A random choice at game start** (turn order, first player, starting hand…) gets a fixed mode for scripted checks in the same task: browser e2e = `import.meta.env.DEV && navigator.webdriver` → fixed; server/unit tests = an explicit option. Otherwise e2e passes or fails by luck.
- **A test that got slow: find out why before raising its timeout.** Glyphtender 2026-10-08: client tests built their room server with the LIVE settings, so a clock jump fired the new idle takeover and the real AI played (26 s on GitHub → failed deploy); the fix was quiet test settings, and the timeout band-aid came out. A test that truly plays a whole game with the AI gets an explicit timeout (`}, 30_000)`) — the GitHub machine is ~2.5× slower than the PC.
- **"Don't run tests" still means typecheck before committing** (`npx tsc -b`, seconds): a quick no-test edit once pushed a broken build (Glyphtender b8758a1 — a `//` comment appended inside a one-line object).
- After each task: tick it in SPRINT.md, add surprises to Notes, commit `F08: <task>`. That's all — no STATE edits per task, no version.json (/save does that).
- A feature's build tasks are done and it works → if it has `(tuning)` tasks left, set it 🎛️ tuning in ROADMAP (features that `~need` it can start now); else go to §4.
- **Stuck** 3 times on one approach → stop, say so plainly, suggest another path (**systematic-debugging** method for real bugs). Found a bug too big to fix now → add it as a 🐞 feature in ROADMAP.

## 3. Prove it works (never "should work") — follow **verification-before-completion**: evidence before any "done"
- **Checks by tier** (PROJECT-FILES.md "Checks"): Fast after every task and merge; **Full once per feature** after its merges (`npm run check:full` — side by side, ~10–15 min; link `e2e-shots/checks.html`), then record `Last full check: <commit>` in STATE. No `check:full` yet? Add it from `~/.claude/config/bmuz/templates/check-all.mjs` (give every e2e script its own port first); until then run e2e scripts one at a time.
- Read a command's own exit code (`cmd; echo $?`), never the one after a `| tail` / `| grep` pipe.
- Visual change → start the dev server the way `/play` does (`--host`, the port from Key facts — write it there the first time), open it in Playwright, screenshot, look at it yourself, fix, re-shoot. Fixes are commits too (`F08: fix …`).
- Logic → play it via Playwright or a quick script; console must be clean (a missing-favicon 404 doesn't count).
- Check the feature's `Check:` line.
- **Review the feature before showing it:** run `/code-review` (low) on the feature's commits only (`<start>..<end>` — a whole-branch diff is too big to read in one pass) and fix real bugs now — cheaper than finding them at /deliver; record `Reviewed through: <commit>` in STATE. (Not in the project's repo folder? Hand the review to a subagent working in the repo.)
- Screenshots: also look for things **clipped inside boxes** (scroll areas, panels) — sideways-overflow checks don't catch those.

## 4. Hand to Muzzy (after each feature, or when he needs to look)
- Describe what changed from the player's side (3–6 bullets) and what the screenshots showed (he can't see Playwright's images — describe them). Say exactly what to try.
- Playwright MCP may drop a `.playwright-mcp/` folder in the directory Claude was started from — delete it when you're done checking.
- Feature has a `why:` line → end with its one feel question: "Did <moment> feel like <target, in players' words>?" Answer → SPRINT Notes.
- List his 🙋 tasks and any new `Ask Muzzy:` questions.
- **Links in the hand-off itself — never just "offer /play":** start the servers it needs (dev server `--host`, plus the online server if online is in it), curl them, and put the PC link, the phone (LAN IP) link and the checks results page in this message. Autonomous runs too: the morning report ends with the links. Then wait.
- Feedback → fix → re-check → show again. **"Approved"** → feature ✅ done in ROADMAP (one approval covers its tuning too), refresh which features became 🟢 ready, replace STATE RESUME HERE + Doing, commit `F08: done`.
- Sprint's features all done → if BUGS.md has open P0/P1 or several P2s, offer a **bug sweep** first (`/bug sweep`). Then archive SPRINT.md (`Sprint NN done`) and say one line: "Sprint done. Next: `/sprint` for the next one" — or "`/deliver` — the milestone/alpha musts are complete" when true. (/deliver saves on its own.)

Never merge to main here — that's `/deliver`.
