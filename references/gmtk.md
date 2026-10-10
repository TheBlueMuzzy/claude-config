# GMTK (Mark Brown, Game Maker's Toolkit) — what BMUZ learned
Researched 2026-10-09 at Muzzy's request ("learn as much as you can from this guy… process, design decisions thinking, implementation").
Sources:
- ~110 full video transcripts: all 16 "Developing" episodes, How I Made Word Play, and design / craft / accessibility essays.
- 1,013 Word Play Steam reviews.
- Store pages, trailer and screenshot frames, thumbnails.

Full reports with quotes + video ids: `references/gmtk/` — process.md (his own games), design.md (44 design rules), craft.md (puzzles, feel, sound, UI, tutorials, accessibility A–G checklist), community-visual.md (jam, store, visuals).

**Who he is:** a design critic turned indie dev.
- **Mind Over Magnet:** 3 years, $9.99, 89% positive.
- **Word Play:** a roguelike *word game*, 7 months, $7.99, 89–90% positive. It started as a 2-day Patreon jam build.
- **Platformer Toolkit:** teaches game feel with live sliders.
- Runs **GMTK Game Jam**: 37k people, 10.5k games in 2026; 100+ became Steam games.

## 1. Process — how he actually works
- **Prove the fun in ~2 days, ugly** (jam build or paper: Scrabble tiles + hand-written perk cards), then throw the code away and rebuild clean.
  - "A 1–2 day prototype → a 1–2 year game."
  - A prototype answers **one named question**.
- **Build in layers:**
  1. the core verb feels great
  2. the whole loop playable (rough)
  3. content
  4. balance + QA
- **Scope tie-breaker:** "which choice is going to take the least amount of time", with every cut written down. Measure scope against a shipped peer game.
- **Plan after the fun is proven — but then plan.** No roadmap = 15 months of "noodling" (Mind Over Magnet).
- **Lock fundamentals before content** (camera/board size, art scale, core feel). Mind Over Magnet redid all its art.
- **Content lock before release:** "producing new content, the game was getting longer, but it wasn't really getting much better" → after the lock, "better and better with every update".
- **Lessons he learned twice:**
  - sound goes in *with* each mechanic
  - accessibility goes in when code becomes final, not at the end
- **Playtests:**
  - ≤3 fresh testers per build; **watch more than listen** (recordings, body language)
  - one feedback inbox + a sheet counting **independent reports**
  - fix small annoyances before a feedback round
  - test with a novice (his dad's test was "the most important")
  - "Data informed, not data driven."
- **Tools for *your* game**, never regretted: sliders, data-driven content.
- **Launch:**
  - demo 2+ weeks before Next Fest; "a demo is marketing" — easy, one rigged great moment, locked content teased
  - daily patches in week 1
  - don't promise post-launch content you haven't scheduled (Word Play's silence got "dev stopped" reviews)

## 2. His warning to himself (the biggest risk for BMUZ)
- Both games were called **"competent but bland… made with a checklist, not with heart."** Mark: "You don't get a lot of me in this game."
- Word Play's #1 complaints:
  - "sterile" — small numbers, perks worth "+1 bonus point"
  - score animations "like an early mobile game"
  - too many perks diluting combos (the demo with ~25 was "more fun" than the full game with 160)
  - letter-draw floods ("AAAE EEII IKOO OSUV")
  - missing common word forms
  - settings that didn't stick
- **A principle-driven process with an AI partner can produce exactly this.** Protect the odd, personal thing only Muzzy would make, and give key moments a real payoff: cozy ≠ flat.

## 3. Design lens — rules to judge with
- **MDA + one-line vision** that every mechanic, sound and image "sings". Name feelings precisely (not "fun").
  - **Borrowing test:** say why a mechanic works in its source game before copying it.
- **"Players will optimise the fun out of a game."** For each mechanic: what's the dull dominant route? Is it easier than the intended one?
- **Information audit:** each piece of state is shown · truly hidden · hidden-but-*attainable*.
  - The third is a trap: optimisers do busywork (calculators in Balatro). Pick show, hide, or gate.
- **Randomness:** luck *before* a decision (input) supports strategy; luck *after* (output) undercuts it.
  - Turn output into input, or make it favourable-only.
  - Constrain distributions (bags, pity, smoothing).
- **Feedback loops:**
  - Map positive/negative loops; check death spirals and runaway leaders.
  - "It is still better to win than to lose."
  - Skill rewards must not make the game easier.
- **Encourage, don't punish.** Pressure ladder: reward speed → optional expiring bonus → escalation → fail state. Use the gentlest rung that works.
- **Rewards that don't backfire:** unexpected, low value, tied to real performance, no power, never a checklist.
  - Ethics: **no streaks, daily rewards or FOMO**; measure "again?".
- **Elegance:**
  - dual purpose (one element, several jobs)
  - versatile verbs
  - the core idea shows up in every part ("or a good idea is just a good idea")
  - simple surface, deep combinations
- **Good AI = interesting play, not intelligence:**
  - telegraph its thinking; readable personalities
  - random pick among its top moves
  - let the player "cheat" unnoticed
  - measure how the *human* plays against it (aggressive AI → turtling)
- **Balance:** by match-up × skill tier, not overall win rate; pick rates; the *perception* of balance.
- **Difficulty:**
  - three connected pipes (easier/main/harder, switchable mid-game)
  - hints only after struggle; assists explained and respectful (Celeste)
  - don't ask for big choices before play
- **Problem solving:**
  - root cause as player behaviour; everyone agrees on the problem
  - list the levers and the identity you won't change
  - "**double it or cut it in half**", then refine
  - prefer one fix that solves two problems; check knock-on effects; re-test blind

## 4. Craft
- **HUD:**
  - every element is a **gauge** (hidden state) or a **preview** (what happens before you commit); cut "neither"
  - **Three Reads** (SpellTower, a word game): letters → rules that matter now → small modifiers
  - preview before any irreversible action
  - grow the HUD over time
  - exact numbers make players optimise
  - "if it can't be shown clearly, simplify the mechanic" (Into the Breach)
- **Tutorials:**
  - willingness to learn grows with investment → get into a real, gentle game fast
  - teach each rule when it first matters, with goals not "tap here" arrows
  - one element at a time, then combine
  - a fresh-eyes test: every stall > 30 s is a bug
- **Feel (Celeste):**
  - responsiveness and forgiveness first (on the input frame, no wind-up on player actions, buffers, generous targets, act on intent)
  - then subtle, short juice; big effects rare
  - every player state looks different
  - every effect has an off switch
- **Sound (BotW):** restraint and silence; layers that add as progress builds; a trailer without sound effects is "dry and lifeless".
- **Accessibility:**
  - never colour alone; recolour elements, not a whole-screen filter
  - the mute test
  - **dyslexia-friendly font is core for word games**
  - no auto-advancing text, no forced holds/rapid taps, timer opt-out
  - option combinations tested (big UI + big subtitles)
  - every option proven to work
- **Platformer Toolkit → Dev Kit:**
  - named feel presets with an A/B toggle
  - sliders in felt units, curves drawn
  - "replay this moment" buttons
  - 2–3 variants side by side so Muzzy picks by feel
- **Store/trailer:**
  - capsule art = "the YouTube thumbnail of game development"; build it from the game's own pieces
  - trailer = a verb chain spelled in the game's tiles (SPELL WORDS → PICK PERKS → STAY ALIVE → AND WIN!)
  - short description = verbs + a question
  - price against peers; ~10–20% of wishlists buy in week one
- **Jam winners:** familiar genre + one sentence-sized twist; a literal mechanical reading of the theme; readable in seconds; simple rules that escalate.

## 5. How Claude should show things to Muzzy (Mark's visual language)
- Labelled screenshots (what/where + a source tag), close crops of the exact element, side-by-side before/after.
- Headings as questions, each answered by a picture.
- Distributions as histograms.
- Two-to-three-word headlines.
- Offer the slider, not a description.

## Muzzy's calls on the BMUZ upgrades (2026-10-09 — nothing implemented until all groups are discussed)
**Big principle (Muzzy):** BMUZ is a guide AND a project manager for people who may be new to making games — it suggests the ideal order but stays flexible: if the developer wants to fix or try something off-plan, help them, then bring them back on track. How strict to be depends on the developer's goal (just prototyping vs. heading to a real release) — ask it.
Group 1 (process):
- ✅ Throwaway prototypes: one-off, simple builds of the main action to prove it out (any number, any length); never built on. (Glyphtender F01 move/cast sketch.)
- ✅ Teaching map — only when tutorials are actually being made (late).
- ❌ Hook sentence — dropped.  ❌ "Where's Muzzy in it?" — dropped.
- ✅ Build in layers (core feels great → whole game playable → content → balance/bugs) — as guidance, not a wall; balancing and fixing happen along the way.
- ⏸ "Least time" tie-breaker — dropped for now. Muzzy: final polish will be a whole flow of its own — in beta BMUZ should prompt the developer to consider more finalized art and then manage that (checklists, suggestions).
- ✅ Lock fundamentals before content — a guidance note only, scaled to the developer's goal.
- ✅ Content lock — not a hard lock: it's the must/should/could system — mid-step ideas get tracked, BMUZ says when to do them and asks how important they are.
