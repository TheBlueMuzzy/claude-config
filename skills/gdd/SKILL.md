---
name: gdd
description: Show the game's design (the GDD) as a one-screen digest — pitch, pillars, core loop, scope status per release, open design questions, recent changes — or one section of it, or discuss a design "what if". Use when Muzzy types /gdd, or asks "what's the game again?", "what's in scope?", "what did we decide about X?", or floats a design idea for an existing game.
---

# /gdd — the game design, at a glance

Read `.planning/GDD.md` (old projects may still call it PRD.md — offer the conversion from `~/.claude/config/bmuz/PROJECT-FILES.md`). No GDD? → "No design doc yet — `/discover` or `/define` starts one."

## `/gdd` (no words) → the digest, one screen
```
EXAMPLE GAME — "<one-line pitch>"      (example only — every line comes from the real docs)
Pillars: <3–7 pillars>
Core loop: <verb → verb → verb → win condition>
Feels like: <primary target> · <secondary> (players' words; ✅/⚠️ if playtested)
Scope: alpha musts 7/9 ✅ · should 3 · could 5 · won't: <list>
Open design questions: 2 (<from ROADMAP ❓ features + GDD open questions>)
Changed lately: <from `git log` on GDD.md>
Full doc: .planning/GDD.md (open it in Obsidian)
```
Pull every line from the GDD, ROADMAP ❓ features, and `git log -- .planning/GDD.md` — never invent. Flag stale sections if Key facts lists "GDD out of date: §…".

## `/gdd <section or topic>` → that part
Show the section in plain English, trimmed to what matters, with the file + heading so Muzzy can open it in Obsidian.

## `/gdd what if … / I think … / let's change …` → a design discussion
1. Say what it would change (which sections, which features in ROADMAP, which principles it serves or strains) — and a one-line **mda-analyze** trace: what players would end up doing, and which experience target that serves or strains.
2. Give an honest take — including when his idea is simpler or better than what's there.
3. Small and agreed → edit the GDD section, update ROADMAP if features change (new IDs, needs), commit `GDD: <change>`.
   Big (new system, new direction) → suggest `/define` for it (or `/discover` if it's still fuzzy).
4. Not for now → VISION.md with the date.
