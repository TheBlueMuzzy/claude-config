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
- STATE (only if it changed): Stage = develop, Doing = "F08 — building".
- One-line kickoff: "Picking up F08 — hover lifts the card. 3 tasks left in this sprint."

## Focus rule (Muzzy asked to be kept on track)
- **One feature being built at a time.** If Muzzy starts steering to another feature, say so in one line and offer to park it.
- Mid-feature reports are sorted out loud in one line: a tweak to *this* feature → do it · a bug → `/bug` triage (fix now only if P0, it breaks this feature, or it's a two-minute fix in code being changed — else log it and continue) · a new idea → ROADMAP → Ideas.
- Endless noodling on one feature → point it out kindly: "F08 has been in tuning for a while — ship it as is and log the rest as a ✨ feature?"

## 2. Do the tasks
For each unticked 🤖 task, in order (skip 🙋 tasks — remind Muzzy of them at the hand-off):
- **Small tasks:** do them yourself. **Big ones** (lots of reading, or a fresh head helps): hand to a `general-purpose` subagent with the task, the feature's "Done when", relevant Key facts, and "report what changed and anything surprising." Tasks from different features that don't touch the same files can run in parallel.
- **Design is open** (feel, look, feature behaviour)? That's the diverge part — try 2–3 quick variants when cheap (behind a toggle or tuning value) and let Muzzy pick. Don't guess on taste.
- **"Feels off" / a `(tuning)` task** → think it through with **mda-analyze** diagnose before touching numbers: name the feeling → look at what players actually do (Dev Kit Snapshots/Time, bot runs, proto) → sort the cause (feel · readability · dynamic · the rule can't do it → /gdd) → offer 2–3 real knobs in `content/tuning/` with a prediction each, one at a time. Log `Tuning: knob old→new — why — result` in SPRINT Notes.
- Cause is **feel** (it works but feels flat, weak, floaty, no impact) → reach for **game-feel**: juice tiers in `content/feel.json`, still one knob at a time.
- Reach for specialists when a task calls for it: **proto** (rules/odds), **tuning-setup** (live sliders for tuning tasks), **save-system**, **audio-setup**, **multiplayer-setup**, **r3f-best-practices** + **three-best-practices** (any 3D work)… R3F rule: never React state for per-frame updates — mutate refs in useFrame.
- Need placeholder art or audio? Follow the **placeholder ladder** in `~/.claude/references/indie-toolkit.md` (shapes → emoji/icons → Kenney/Quaternius kit → real art; ZzFX for sound), and log every asset we didn't make in `content/credits.json`.
- A project needs Claude to work inside another program (Unity Editor, Supabase, a live Cloudflare deploy…)? Check `~/.claude/references/mcp-card.md` — prefer a CLI; offer the MCP in one line when its trigger hits, set up so it syncs (plugin or the repo's `.mcp.json`).
- Features with rules or logic get **tests** as part of being done (rules/logic → unit tests; key flows → a Playwright smoke check). Feel isn't tested — Muzzy judges it.
- Tweakable values go into `content/` JSON (never hardcoded) so Muzzy can change them in the Dev Kit or Obsidian. A new data file or Dev Kit tool → update TDD §1/§3. A real "how should we build this" choice → TDD Decisions log.
- After each task: tick it in SPRINT.md, add surprises to Notes, commit `F08: <task>`. That's all — no STATE edits per task, no version.json (/save does that).
- A feature's build tasks are done and it works → if it has `(tuning)` tasks left, set it 🎛️ tuning in ROADMAP (features that `~need` it can start now); else go to §4.
- **Stuck** 3 times on one approach → stop, say so plainly, suggest another path (**systematic-debugging** method for real bugs). Found a bug too big to fix now → add it as a 🐞 feature in ROADMAP.

## 3. Prove it works (never "should work") — follow **verification-before-completion**: evidence before any "done"
- Tests if the project has them; `npm run build` must pass.
- Visual change → start the dev server the way `/play` does (`--host`, the port from Key facts — write it there the first time), open it in Playwright, screenshot, look at it yourself, fix, re-shoot. Fixes are commits too (`F08: fix …`).
- Logic → play it via Playwright or a quick script; console must be clean (a missing-favicon 404 doesn't count).
- Check the feature's `Check:` line.

## 4. Hand to Muzzy (after each feature, or when he needs to look)
- Describe what changed from the player's side (3–6 bullets) and what the screenshots showed (he can't see Playwright's images — describe them). Say exactly what to try.
- Playwright MCP may drop a `.playwright-mcp/` folder in the directory Claude was started from — delete it when you're done checking.
- Feature has a `why:` line → end with its one feel question: "Did <moment> feel like <target, in players' words>?" Answer → SPRINT Notes.
- List his 🙋 tasks and any new `Ask Muzzy:` questions.
- Offer `/play` for links. Then wait.
- Feedback → fix → re-check → show again. **"Approved"** → feature ✅ done in ROADMAP (one approval covers its tuning too), refresh which features became 🟢 ready, replace STATE RESUME HERE + Doing, commit `F08: done`.
- Sprint's features all done → if BUGS.md has open P0/P1 or several P2s, offer a **bug sweep** first (`/bug sweep`). Then archive SPRINT.md (`Sprint NN done`) and say one line: "Sprint done. Next: `/sprint` for the next one" — or "`/deliver` — the milestone/alpha musts are complete" when true. (/deliver saves on its own.)

Never merge to main here — that's `/deliver`.
