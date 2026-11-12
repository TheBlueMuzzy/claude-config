# <Name> — Game Design Document (GDD)
> What the game is, how it plays, how it should feel. Two parts, as the BMUZ engine writes it: **Part 1, the concept** (one page — /define writes and locks it) and **Part 2, the design** (/design works it out). Aim for ~150 lines — detail lives in `design/` docs linked from here.
> Current phase: <Define | Part 1 locked <date> | Design | Complete>   ·   The game so far: IDEATE.md   ·   Engineering plan: TDD.md   ·   Milestones, ideas, known issues: ROADMAP.md

# Part 1 · The concept (one page)

## 1. Pitch
- **One line:** <what it is, why it's fun>
- **The story:** <3–5 lines written to "you": what you do and why it's fun>
- **Familiar + new:** <the part players know already · the part that's new>
- **Platform:** <web (desktop + phone) / app stores / Steam>   **Audience:** general (not made for kids) · <who>
- **References:** <2–5 games and what we take from each — deeper research in research/>

## 2. Experience targets  (MDA — what players should feel; used by tuning and playtests)
| | Target | In players' words | We'll know when… (watchable) | Seen? |
|---|---|---|---|---|
| Primary | <e.g. Challenge> | <"one more try — I almost had it"> | <asks for a rematch within 10 s> | — |
| Secondary | | | | — |
| Not this game | | | | — |
**Key moments** (2–4 that must land): <…>
**Watch-outs** (behaviours that would kill the targets): <runaway leader · waiting around · …>

## 3. Pillars
3 rules that decide arguments: **<Pillar>** — <why> — <example decision it settles>

## 4. Core loop & play
- **Core loop:** <verb → verb → verb → win>
- **Play structure:** <solo / together / online / by turns / against the computer · session length · which way up>

## 5. Scope
| Must — alpha | Must — beta | Must — 1.0 | Should | Could | Won't (and why) |
|---|---|---|---|---|---|
**Vertical slice:** <the smallest version worth playing>
Release stages: prototype → alpha → beta → 1.0. **Done** for a release stage = all its musts done.

## 6. Risks & unknowns
- <what could stop it being great · the cheapest test for it (a sketch, a sim, research)>

## 7. Product
- **Release path:** <web first, then…>   **Business:** <free / paid / cosmetics / none yet>
- **Success looks like:** <e.g. friends ask to play again>

# Part 2 · The design

## 8. Rulebook
- **Rules:** <the real rules, numbered, short — overview, components, how to win, setup, the flow, each action, game end, scoring, keywords>
- **Controls:** <desktop / phone>
- **Mechanics** (one row per core mechanic):
| Mechanic | What players end up doing → Target |
|---|---|

## 9. Content & balance
<every card, unit, ability and number: a summary + a link to the tables in content/ or design/>

## 10. Change over time
<what changes within a game and between games · progression · pacing>

## 11. Players & opponents  (only what this game has)
<the computer opponent · online play (leaving, joining, idling) · saves, accounts — a few lines each, or a link to design/<system>.md>

## 12. Look & sound
<style in one paragraph + references; UI tone; audio mood — or link design/look-and-sound.md>

## 13. Screens & menus
<UI style · the screen map · what the player must see (HUD) · names of things>

## 14. Teaching
<what a new player must learn (notes here; the tutorial itself is built in Develop after playtests)>

## Open questions
- <design questions not yet settled — each becomes a ❓ feature in ROADMAP when it blocks work>
