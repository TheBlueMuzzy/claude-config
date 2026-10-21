---
name: sprint
description: Show what's actionable right now in a game project — the current sprint's goal, features and tasks (Claude's and Muzzy's), or plan the next sprint from features that are ready. Use when Muzzy types /sprint, or asks "what's next?", "what are we doing now?", "what's on my plate?", "what do I need to do?", or wants to start a new sprint.
---

# /sprint — what's actionable now

Steps are marked by how they happen (F80): ① a script or hook does it · ② Claude's judgement, refused or sent back until it's on record · ③ judgement only.

Read `~/.claude/config/bmuz/PROJECT-FILES.md` (planning model + SPRINT format). Old GSD layout? Offer the conversion first. No ROADMAP.md? → "No feature map yet — `/define` makes one (or I can sketch a quick one if you already know the next few things)."

## A. A sprint is running → show it
```
Sprint 4 — Fanned hand you can play from   (2 features, 5/9 tasks)
F08 🎮 Splayed cards — 🔨 building
  ✅ 🤖 1 Arc layout   ▶ 🤖 2 Hover lifts card   ☐ 🙋 3 Stand-in card fronts   ☐ 🤖 4 Tune spread
F11 ✨ Card hover wiggle — after F08 works
Your tasks 🙋: stand-in card fronts · Ask Muzzy: should cards tilt on hover?
Next: /develop continues F08 step 2.
```
Keep it that short: wrap task rows after 4; ▶ marks the next unticked 🤖 task. Call out anything blocked on Muzzy.
A feature that became ready mid-sprint and fits the goal? Offer to pull it in ③ (plan-lint names features that became 🟢 ①).

## B. No sprint (or it's finished) → plan the next one
1. If a SPRINT.md is finished, ask Muzzy for the 3-line `Retro:` first (went well · went wrong · change), then `node ~/.claude/config/bmuz/scripts/archive-sprint.mjs` (it refuses while a feature isn't ✅ / 🎛️ or the retro is missing, moves it to `archive/sprints/sprint-NN.md`, commits `Sprint NN done`) ② (stop-plan-check sends a turn back while a finished sprint sits un-archived).
2. ROADMAP states follow the ready rule ① (plan-lint names every ⏳ whose needs are done — "set it 🟢" — and every 🟢 / 🔨 whose needs aren't). Candidates = 🟢 ready features in the current milestone (then the next one), **plus features whose only unmet needs are other candidates you're taking** (sprint rule — list them after what they need). Fewer than 2? Offer to promote a small Later item into a feature (give it an ID, type, scope, needs — plan-lint flags a missing type or scope ①).
3. Pick **1–4 features that make one visible goal** ("a fanned hand you can play from"). Prefer: ❓ decisions that unblock the most (ask Muzzy right now if he's here — then they're just done), then 🧱 foundations others wait on, then 🎮, then ✨. Must before Should before Could ③ (planning judgement).
4. A request to **show** something ("a modal with the settings") → first list what it would concretely contain and whether players can already see it — Glyphtender F53: the in-game "settings" were 5 things, 4 already visible → one line in Pause, not a button + modal (Muzzy: "this seems pointless"). Say the list in the plan ③ (design judgement).
5. Break each into 3–8 tasks ① (plan-lint counts them) — **look at the actual code first** (Explore agent for anything beyond a few files) so tasks name real files ② (plan-lint flags a task path whose file and folder don't exist). No code yet → first task scaffolds the project using the GDD's Technical Architecture (a web game then gets the Dev Kit: `node ~/Documents/dev/framework/devkit/scripts/install-devkit.mjs <game-folder>` + its printed steps). Owners: 🤖 / 🙋. Include stand-in art as tasks. Put tuning tasks last and mark them `(tuning)`. A new kit piece or Dev Kit tool → a framework-first task (build in `dev/framework`, then install), not "build in the game, copy back later" ③ (planning judgement; guard-edits refuses edits in a game's kit copy ①).
6. If a feature changes something the GDD describes, add a task "update GDD §X" ③. Open P0/P1 bugs go in as tasks ② (plan-lint flags a new sprint that doesn't name an open P0/P1 — a Notes line saying why it waits counts); P2/P3 only if they're in files this sprint touches ③. Work already finished (e.g. by a /bug fix) goes in as a ticked task with its commit.
7. Unknowns that could sink it → first task is a quick spike ③.
   **A new framework module or system (saves, audio, input, netcode…) → research the field first** (how indie and pro studios handle it, platform pitfalls, the full list of cases), not only what our games do today; plan from that map and say which layers this sprint takes and which come later (Muzzy, sprint 15: "i'm sure you researched indie game development standards… online saves, local saves, seed saves, etc?" — the first Saves plan covered only what 3 games already did) ③ (judgement; backed by the retro rule "lead on the technical side").
   **Leans on an outside host, store or account (Cloudflare, Steam, app stores…)?** → before planning, ask Muzzy which accounts and tools exist, look up the host's free-plan limits (how long it keeps things, CPU per request, writes per day), and make the first proof task measure CPU / write cost per request ③ (framework retros, sprints 18 · 20 · 21: an empty room forgotten after ~2 min, a replay over the CPU limit found late, a sprint planned twice for backends we couldn't test).
8. Show the sprint as in A, with the goal, **what Muzzy will see change — and what stays the same** (one line, so nothing surprises him), and any `Ask Muzzy:` questions. Purely technical choices are not questions: decide them and log them (TDD Decisions / Notes) ③. On OK: write SPRINT.md (task lines exactly `- [ ] 🤖 1. <task> — <file>` / `- [ ] 🙋 2. …` — the chat view above drops the dot; the file keeps it ① (plan-lint reads it)), set those features 🔨 in ROADMAP ① (plan-lint), update STATE (Sprint, Doing, replace RESUME HERE) and commit `Sprint NN: <goal>` on the current branch (numbered from 01) ② (guard-git refuses a `Sprint NN:` commit without STATE.md in it).

## C. Quick question ("what's on my plate?")
List only 🙋 tasks and open `Ask Muzzy:` questions across the sprint, ❓ decisions of his that block features, and every `Muzzy:` line in STATE's RESUME HERE. (The open `Ask Muzzy:` lines are also printed at every session start ①.)

End with: *"Say `/develop` (or 'go') to start."* — and suggest `/clear` first if the chat is long (everything's saved).
