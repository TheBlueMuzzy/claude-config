---
name: roadmap
description: Show the big picture of a game project — milestones, every feature and what it depends on, what's done, ready, blocked, and how close each release (alpha, 1.0) is. Also for changing it — adding, moving, cutting or reordering features. Use when Muzzy types /roadmap, or asks "what's left?", "how far along are we?", "what's blocking X?", "where does X fit?", or wants to add/move/cut a feature.
---

# /roadmap — the big picture

Read `~/.claude/config/bmuz/PROJECT-FILES.md` (planning model + ROADMAP format). Old GSD layout? Offer the conversion first. No ROADMAP.md? → "There's no feature map yet — `/define` builds it."

## Showing it (default)
Refresh states first using the ready rule in PROJECT-FILES (a need counts when it's ✅, or 🎛️ for `~` needs). Then show, compactly — shipped milestones as one line total, % = done features / features in that milestone:
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
- **Add a feature:** give it the next ID, a type, scope (ask if unclear), and needs (ask "what has to exist first?" — suggest an answer). Put it in the right milestone or Later. Bigger than a feature? Suggest `/define` for it.
- **Move / reorder:** check dependencies — never place a feature before something it needs; say what would break.
- **Cut:** move it to Won't in the GDD (with the reason) or to Later; show what depended on it.
- **Scope creep check:** if a milestone has grown past ~1.5× its original size, say so and offer to split it or push Shoulds/Coulds out.
Choosing between several features → rank by: must before should before could, then biggest effect on the experience targets for the least effort; show only the ranked list with one-line reasons.
Before adding anything sizeable, three quick questions out loud: is it worth it (which target does it serve)? what's risky? what's unknown (→ a spike task)?
Keep each milestone's Mermaid graph in sync. Commit `Roadmap: <what changed>`.
