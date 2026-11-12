---
name: ideate
description: Stage 1 of 6, Ideate — gather the material for a game idea (or a big new feature) before anything is decided — everything Muzzy already has (notes, Drive folders, rulebooks, old prototypes) read in full, then per need what's already fixed, what ideas he has and what's still open. Never "which one?"; ends by writing back "the game so far". Starts a new project if there isn't one. Use when Muzzy types /ideate or /discover, has a new game idea, says "I have an idea", "what if…", "let's explore", "discover", "here's what I have", or wants to gather his material before deciding anything.
---

# /ideate — gather the material

Read `~/.claude/config/bmuz/PROJECT-FILES.md` first. No `.planning/STATE.md`? Do the quick setup from `~/.claude/config/bmuz/SETUP-AND-CONVERT.md`.
Muzzy is an artist/designer: be a design partner, not a form. A few questions at a time.
Steps are marked by how they happen (F80): ① a script or hook does it · ② judgement, refused until it's on record · ③ judgement only.

**What Ideate means** (framework `research/bmuz-vision/stages.md`): gather the loose idea and capture it. Nothing gets chosen here — Define chooses, Design works it out. Ideate does **not** create `.planning/GDD.md`; it ends with "the game so far" in `.planning/IDEATE.md`.
The six stages: **Ideate** gather · **Define** decide what the game is, on one page · **Design** rules, content, screens, sketches for the risky parts, then the build plan · **Develop** sprints he plays and approves · **Deliver** each milestone as a build to play and share · **Release** 1.0 goes public. Research is callable from any stage.

## 1. A brand-new project — the opening ③
The opening is the BMUZ engine's (F225 — Where are you starting?, as the script's 1.0–1.3 say it: `~/Documents/dev/bmuz/plugin/script.md`, "Stage 1 · Ideate"). Follow its meaning, in this order:
1. **Welcome** — the six stages in one line each (above), and: say anything any time (an idea, a worry, "stop"); everything decided goes into one design document, the GDD.
2. **Your idea** — "Tell me about your game in your own words: what it is, what you love about it, anything you remember. Half an idea is fine. If you're not sure yet, just say so." One free answer, nothing else asked. Not sure yet → the three spark questions (a game you love lately and why · a moment from a game, film or life you'd turn into play · a theme, mechanism or feeling you keep coming back to).
3. **Your material** — ask for his links: Google Drive folders and docs (gws, `~/.claude/references/gws.md`), GitHub, folders and files on this PC. Read **all** of it ③.
4. **Where it stands** (nothing yet · a concept · written down · a prototype) is worked out from what he shared — never asked ③. When his material already answers most of Define's questions, offer once: carry on in Ideate (recommended) or jump to `/define`.

An existing project with a GDD → skip the opening; go to §2.

## 2. What are we gathering? ③
- **A whole game** → `stages/ideate.md`.
- **A big feature inside an existing game** ("I want a crafting system") → the same, feature-sized: what's fixed, his ideas and what's open for that feature (read the GDD's pillars and feelings first). Write it to `.planning/research/<feature>.md`, then hand to `/define` for that feature.
- **Just an itch** ("what if the dice could melt?") → talk it through; park it in ROADMAP → Ideas with the date if it's not for now.

## 3. Gather, never choose ③
- Per need (`stages/ideate.md`): **already clear · your ideas · still open**. Never "which one?", never his own answer read back to him as options, no fiction questions for a game without fiction. Frame first (platform, players, session length) ③ (judgement: a question's shape can't be checked).
- Feelings and hopes in his words — loose; `/define` turns them into **mda-analyze** experience targets.
- A feel or look question → it goes on the **sketch list** (built and played in `/design`; `/sketch` any time he asks to try one now).
- **Research** only when it helps (a creative block, a worry about being unique, "has this been done?"), sourced, and brought back as "here's what I found — does it change anything?", never as a menu ③ (judgement: when it helps). A rules or odds hunch → **proto**.

## 4. Hand-off
Write "the game so far" (format in `stages/ideate.md`) to `.planning/IDEATE.md` ③ and show it to him in short lists.
STATE: Stage = ideate, RESUME HERE → "Ideate done — next: /define", then commit `Ideate: the game so far` (or `Research: <feature>`) with STATE.md in it ③.
Say ② (handoff-check: the card, ending with Next `/define`): *"That's everything you have, gathered — nothing decided yet. Say `/define` when you want to decide what the game is, on one page."*
