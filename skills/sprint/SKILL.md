---
name: sprint
description: Show what's actionable right now in a game project — the current sprint's goal, features and tasks (Claude's and Muzzy's), or plan the next sprint from features that are ready. Use when Muzzy types /sprint, or asks "what's next?", "what are we doing now?", "what's on my plate?", "what do I need to do?", or wants to start a new sprint.
---

# /sprint — what's actionable now

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
A feature that became ready mid-sprint and fits the goal? Offer to pull it in.

## B. No sprint (or it's finished) → plan the next one
1. If a SPRINT.md is finished (all its features done/tuning), archive it (`archive/sprints/sprint-NN.md`), commit `Sprint NN done`.
2. Refresh ROADMAP states (ready rule). Candidates = 🟢 ready features in the current milestone (then the next one), **plus features whose only unmet needs are other candidates you're taking** (sprint rule — list them after what they need). Fewer than 2? Offer to promote a small Later item into a feature (give it an ID, type, scope, needs).
3. Pick **1–4 features that make one visible goal** ("a fanned hand you can play from"). Prefer: ❓ decisions that unblock the most (ask Muzzy right now if he's here — then they're just done), then 🧱 foundations others wait on, then 🎮, then ✨. Must before Should before Could.
4. A request to **show** something ("a modal with the settings") → first list what it would concretely contain and whether players can already see it — Glyphtender F53: the in-game "settings" were 5 things, 4 already visible → one line in Pause, not a button + modal (Muzzy: "this seems pointless"). Say the list in the plan.
5. Break each into 3–8 tasks — **look at the actual code first** (Explore agent for anything beyond a few files) so tasks name real files. No code yet → first task scaffolds the project using the GDD's Technical Architecture (a web game then gets the Dev Kit: `node ~/Documents/dev/framework/devkit/scripts/install-devkit.mjs <game-folder>` + its printed steps). Owners: 🤖 / 🙋. Include stand-in art as tasks. Put tuning tasks last and mark them `(tuning)`. A new kit piece or Dev Kit tool → a framework-first task (build in `dev/framework`, then install), never "build in the game, copy back later".
6. If a feature changes something the GDD describes, add a task "update GDD §X". Open P0/P1 bugs always go in as tasks; P2/P3 only if they're in files this sprint touches. Work already finished (e.g. by a /bug fix) goes in as a ticked task with its commit.
7. Unknowns that could sink it → first task is a quick spike.
8. Show the sprint as in A, with the goal, **what Muzzy will see change — and what stays the same** (one line, so nothing surprises him), and any `Ask Muzzy:` questions. Purely technical choices are not questions: decide them and log them (TDD Decisions / Notes). On OK: write SPRINT.md, set those features 🔨 in ROADMAP, update STATE (Sprint, Doing, replace RESUME HERE), commit `Sprint NN: <goal>` on the current branch (numbered from 01).

## C. Quick question ("what's on my plate?")
List only 🙋 tasks and open `Ask Muzzy:` questions across the sprint, ❓ decisions of his that block features, and every `Muzzy:` line in STATE's RESUME HERE.

End with: *"Say `/develop` (or 'go') to start."* — and suggest `/clear` first if the chat is long (everything's saved).
