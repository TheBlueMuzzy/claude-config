# Ideate — gather the material

Goal: everything Muzzy has about the game, read and captured per need, sharper than what he walked in with — and nothing chosen. Size it to the game: a one-screen arcade toy needs a short chat.

## The needs (the spine of Ideate, Define and Design — framework `research/bmuz-vision/stages.md`)
1 core loop in verbs · 2 things in play + their states · 3 rules (how it ends, how it scores) · 4 decisions + why they're hard (the real skill) · 5 feel target + how we'll know · 6 what changes over time · 7 frame (platform, which way up, players, online incl. leaving/joining, session length, controls) · 8 smallest version worth playing · 9 look and sound direction.
Ideate gathers material on these nine. The rest (opponents, who sees what when, screens, names, HUD, teaching) is Design's.

## Do
1. **Read everything first** — his idea, every shared file and folder, a remake's old docs and code. Sort each piece under a need.
2. **The game so far** — per need: what's already clear (his words, quoted) · his ideas (loose, all of them kept) · what's still open. Anything you worked out yourself is marked "my reading".
3. **A few gap questions**, frame first, one need at a time: "what do you have for …?", never "which one?". Stop when the open list is the real open list.
4. **Feelings and hopes** — how he hopes it feels, in his words; reference games he names, with what he takes from each.
5. **The sketch list** — each feel / look / "is it fun?" question as one line (what the sketch would settle). Built in Design.

**A remake of an existing game:** carry the old design docs (story, progression, systems) into `design/` *before* asking Muzzy anything. Only ask what the old docs leave open. "Not built" ≠ "not designed" (Goops, 2026-10-16).

**He asks to try a feel or look now? → `/sketch`** (rules in `~/.claude/skills/sketch/SKILL.md`). **Comparing approaches (a "lab")?** Write one shared brief first (same board, controls, knob names, checks) so each sketch differs only in what's being tested; build them in parallel; each lands as a tab in the planner's Sketches section (`/ppp`, list only finished ones with `--only=`). Ask Muzzy for his two endpoints early: it cut Goops' goo round from 5 guesses to A vs B (2026-10-16). Tuning knobs never cover what they tune: dock the panel beside the sketch (Muzzy tunes on the PC) and keep the view full size; give it 3 presets (+ Preset, tap to load) and a "Copy values for Claude" button so his tuning reaches the plan.

## Output — `.planning/IDEATE.md`
```
# <Name> — the game so far (Ideate, <date>)
Where it stands: <nothing yet · a concept · written down · a prototype> — from <what he shared>
## <need>   (one heading per need that has anything)
- Already clear: "<his words>"
- Your ideas: <…>
- Still open: <…>
## Feelings & hopes
## Sketch list
- S01 <what it would settle>
## The three questions that matter most for Define
1. …
```
Longer notes (reference breakdowns, a remake's old docs) → `.planning/research/` or `design/`, linked from it. Commit `Ideate: the game so far` with STATE.

## Done when
- Everything he shared is read · every need has its clear / ideas / open · the sketch list is written · nothing was chosen for him.
