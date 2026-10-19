---
name: sketch
description: Make a throwaway playable sketch (one HTML file) to prove a feel, look or idea before it goes in the plan — with knobs Muzzy can tune, 3 presets, and a "Copy values for Claude" button — and show it as a tab in the planner. Use when Muzzy types /sketch, says "sketch it", "let me try it", "prototype it" (his prototype = a sketch), or when a design question can only be settled by playing (feel, motion, look, "is it fun?"). Several rival approaches → a lab. Not for rules balance with numbers (that's proto).
---

# /sketch — prove it by playing it

A sketch is **throwaway**: one self-contained HTML file that answers one question by being played. It doesn't become game code ③ (judgement); what it proves goes into the GDD/TDD, and Muzzy's tuned values go into the plan.

Steps are marked by how they happen (F80): ① a script or hook does it · ② Claude's judgement, refused or sent back until it's on record · ③ judgement only.

## When
- Muzzy asks, or a ROADMAP/❓ question is about **feel, motion, look or fun** that words can't settle ("does the goo feel right?", "is free goo fun?"). Suggest one in a line; build it if he says yes, or just build it if he asked for it.
- Rules/odds/balance with numbers → **proto** instead (Python sims).

## Steps
1. **The question, in one line**, plus Muzzy's words on what he wants (quote them). Ask for his **two endpoints** if the target is fuzzy ("A or B?"); it turns guesses into a comparison.
2. **One sketch or a lab?** Several rival approaches → a lab: write one shared brief first (`.planning/research/<topic>/LAB-BRIEF.md`: same board, controls, knob names, checks) so each sketch differs only in what's being tested; build them in parallel with helpers; name them `lab-L<n>-<slug>.html`.
3. **Start from** `~/.claude/config/bmuz/templates/sketch/sketch-starter.html` → `.planning/research/sketches/<name>.html`. Keep its sketch kit as is ② (sketch-lint tells Claude after every write when the title / description are still the starter's, or "Copy values for Claude", the presets or the knob help lines are gone):
   - `<title>` (tab name) + `<meta name="description">` (one sentence: what it tries, what to look for)
   - all values in one object at the top; 5–8 knobs; **one help line per knob** saying what it does *in this sketch* and when you'd notice it
   - knobs **dock beside the view at full size** (Muzzy tunes on the PC; bottom sheet on a phone), open by default on wide screens
   - **3 presets** (+ Preset, tap to load, ×), **Default**, and **Copy values for Claude**
   - fps counter, fixed timestep, phone portrait first, 16px gutters, safe areas
   - borrow the game's real rules/controls when the question is about feel inside the game; keep visuals from deciding rules
4. **Check it yourself** (Playwright's bundled Chromium — Muzzy's Chrome asks him first ①, a permission prompt): desktop 1280×800 and phone 390×844 screenshots, every knob moves something you can see, presets save/load, no console errors, fps. Look at every screenshot. A knob you can't see working → fix it or cut it ③ until sketch-check.mjs (proposed: loads both sizes, console clean, moves each knob min/mid/max and compares the canvas).
5. **Show it:** commit, then `/ppp` (the sketch goes in the planner's Sketches tab as a `files` entry; it opens in his browser) ② (stop-plan-check sends the turn back while a sketch changed this turn hasn't gone out with the planner). Mention "Open full screen" for the biggest view.
6. **Hand-off** ② (handoff-check: the card): say what to try (2–3 knobs worth moving), the question it answers, and ask for **Copy values** pasted back.
7. **When he answers:** save his values to `.planning/research/<topic>/picks.json`, make the pick the sketch's defaults, write the decision + his words into the ROADMAP item and GDD (TDD when it exists), tick the steps, `/ppp`. Something he likes but that's for another game → ROADMAP parking lot ("keep the tech").
8. **He reports a problem in a sketch** ("it lurches") → find the cause in the code (often a structural thing a knob can't fix), fix it, and measure before/after; don't hand him more sliders.

Lesson lines for sketches go here (one checklist line each, marked with its kind ①/②/③ — rule-kind flags a new one without).
- Every knob visibly changes something across its range ③ until sketch-check.mjs (proposed): measure its effect at min / middle / max in Playwright (e.g. how far goo reaches, how long strings get) before handing it over. Goops L3 "tension"/"merge" did almost nothing against the grid springs and Muzzy had to find out (2026-10-17). Use his names for knobs when he offers better ones.
- Rival sketches share knob names, meanings and scales (same number = same effect), then calibrate each by measuring: the same Magnetism pull moved Goops L4 Jelly's looser skin ~4× further than L3's particles (2026-10-17).
- Fix the cause, not with a new knob: Goops' jelly "heavy lurch" was the piece being yanked one grid cell per step; making it glide fixed it, where viscosity only traded one feel for another (2026-10-17).

- **Shader random numbers:** the usual GLSL `fract(sin(x)*43758)` trick has only ~256 distinct values at large inputs, so a "chance" test like `step(h, chance)` still fires at chance 0. Use an integer hash and a strict `h < chance` (Goops visor-glitch sketch, 2026-10-18).
