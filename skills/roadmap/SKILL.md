---
name: roadmap
description: Show the big picture of a game project — milestones, every feature and what it depends on, what's done, ready, blocked, and how close each release (alpha, 1.0) is. Also for changing it — adding, moving, cutting or reordering features. Use when Muzzy types /roadmap, or asks "what's left?", "how far along are we?", "what's blocking X?", "where does X fit?", or wants to add/move/cut a feature.
---

# /roadmap — the big picture

Read `~/.claude/config/bmuz/PROJECT-FILES.md` (planning model + ROADMAP format). Old GSD layout? Offer the conversion first. No ROADMAP.md? → "There's no feature map yet — `/define` builds it."

Steps are marked by how they happen (F80): ① a script or hook does it · ② Claude's judgement, refused until it's on record · ③ judgement only.

## Showing it (default)
States follow the ready rule in PROJECT-FILES (a need counts when it's ✅, or 🎛️ for `~` needs) ① (plan-lint names every ⏳ that should be 🟢 and every 🟢/🔨 whose needs aren't met, after each ROADMAP edit; `node ~/.claude/config/bmuz/hooks/plan-lint.mjs .` lists them all). Then show, compactly — shipped milestones as one line total, % = done features / features in that milestone:
```
Release target: alpha — musts 7/9 done
v0.3 Card play feels good  ← current   ███████░░░ 70%
  ✅ F07 🧱 Card hand system
  🔨 F08 🎮 Splayed cards          (sprint 4)
  🟢 F09 ❓ Decide discard rule     🙋 yours
  ⏳ F10 🎮 Discard pile            waits on F09
v0.4 Deck building                 ░░░░░░░░░░ 0%  — 5 features, 2 ready once F10 is done
Later: 6 items
Bugs: 5 open (P0 0 · P1 1) — /bug for the list
```
Then 1–3 lines of insight, only if true: what's on the critical path ("F09 is your decision and it's blocking 3 features"), what's ready to pull into a sprint, a milestone that's grown a lot, musts at risk for the release.

## Changing it
- **Add a feature:** give it the next ID, a type, scope (ask if unclear), and needs (ask "what has to exist first?" — suggest an answer) ② (plan-lint flags a duplicate ID, a missing type or scope, a need that isn't in the roadmap). Put it in the right milestone or Later. Bigger than a feature? Suggest `/define` for it ③.
- **Move / reorder:** check dependencies — a feature doesn't start before something it needs ② (plan-lint flags one that's 🟢/🔨/✅ while a need isn't done); say what would break ③.
- **Cut:** move it to Won't in the GDD (with the reason) or to Later; show what depended on it ② (plan-lint flags needs left pointing at nothing) · ③ the reason.
- **Scope creep check:** if a milestone has grown past ~1.5× its original size, say so and offer to split it or push Shoulds/Coulds out ③ until F81 (producer notices) — proposed: record each milestone's item count when it becomes `← current`, plan-lint warns past 1.5×.
Choosing between several features → rank by: must before should before could, then biggest effect on the experience targets for the least effort; show only the ranked list with one-line reasons ③ (planning judgement).
Before adding anything sizeable, three quick questions out loud: is it worth it (which target does it serve)? what's risky? what's unknown (→ a spike task)? ③
Each milestone's Mermaid graph stays in sync ② (plan-lint compares it with the needs lines). Commit `Roadmap: <what changed>` ③ (naming).
