
# Game GDD Generator (Fast Track)

Create a GDD for the concept Muzzy described.
**Size it to the game.** A tiny one-screen game gets ~1 page: sections 2 (audience/competitors), 5, 9 and 12 can be one line or "n/a yet". Skip web research unless Muzzy wants it. A big game gets the full treatment.

This is the fast-track alternative to the Double Diamond. It fills all 12
sections of the GDD in one pass instead of building it incrementally across
3 parts. The output is the same `.planning/GDD.md` living document.

## Required Input (ask for any missing):
1. Game concept (one-paragraph pitch)
2. Target platform (Web / Mobile / Steam / All)
3. Target audience
4. Art style (references or description)
5. Core loop (what does the player DO every 30 seconds?)

## Output

Create `.planning/GDD.md` with all 12 sections filled:

```markdown
# [Game Name] — Game Design Document

> Living document. Created via fast-track /define.
> Current phase: **Complete**


## 1. Vision & Goals
- Elevator pitch (1 sentence)
- Target feeling/experience
- Platform targets
- Target audience

## 2. Audience & Player Personas
- 2-3 player personas with Bartle types, motivations, play habits
- Competitive landscape (5+ reference games)
- Genre opportunity map
- Inspiration & references

## 3. Design Principles
- Concept statement
- 3-5 design principles
- Experience targets table (primary/secondary/not-this-game, players' words, we'll know when) — **mda-analyze** targets
- Success criteria
- Scope: Must (per release: alpha / 1.0) · Should · Could · Won't

## 4. Core Gameplay
- Core loop diagram (ASCII)
- Session flow (5 min of play)
- Mechanics table with a `why:` trace per core mechanic
- Rules (if game has formal rules — turn structure, win conditions, edge cases)
- Progression system

## 5. Game Systems
- Per system: purpose, data, connections, key rules
- Balance data (if /proto has been run)
- Content reference (what content/data/ files define)

## 6. Art & Audio Direction
- Visual style, color palette, character design, UI style
- Music mood, SFX style, key audio cues

## 7. Technical Design
See TDD.md (written by /define's build plan).

## 8. Product
- **Platforms & release path:** <web first, then app stores / Steam?>
- **Audience:** general (not made for kids) · <who>
- **Business:** <free / paid / cosmetics / none yet>
- **Success looks like:** <e.g. friends ask to play again>
- **Milestones:** see ROADMAP.md
See ROADMAP.md.

## 9. Testing Strategy
- Automated test plan
- Manual playtest plan
- Quality gates

## 10. Known Issues & Bugs
See .planning/ROADMAP.md (Later / Watch lines).

## 11. Future Ideas
See .planning/VISION.md (the parking lot).

## 12. Glossary
Game-specific terms and their definitions.
```

After the GDD: write the feature map exactly as in `build-plan.md` ("Write ROADMAP.md — the feature map"), set the GDD header to `Current phase: Complete`, then do the hand-off in /define.
