# Module contracts — what a game's architecture must provide for each framework module

A framework module only works as well as the game's hooks into it. /define writes these into the TDD (§2c "Module
contracts") for every module the game uses, the first milestone gets a 🧱 feature for them, and /develop keeps them
true for every new system. Each module's README has the details; this is the checklist.
Why this file exists (Muzzy, 2026-10-18): Goops got the Dev Kit installed but nothing in the game was wired to it —
"the purpose of the devkit is to affect things live. I thought that was clear."
**Checked, not just written down (framework F61, Dev Kit 0.19+):** `npm run check:framework` in the game runs every
installed module's own `conformance.mjs` against these promises and says what to wire and where. It's a row in check:fast
(`--static`) and check:full (browser), and /deliver runs it. The adapter's optional `conformance: { startPlay, query }`
lets the play checks get from the menu into live play.

## Dev Kit (every web game — `framework/devkit`)
The Dev Kit's job is to change the RUNNING game live. A game is wired for it when:
1. **Live content — by default.** The Dev Kit's Vite plugin (0.18.0) hands the game every `content/tuning/*.json`
   import as a live object (`liveFile`: a getter per key that reads the latest Dev Kit edit), so the game imports its
   tuning as usual and it follows the sliders. What the game must do: **read values where they're used**, never copy
   them once at load (`const speed = tank.cameraSpeed` at the top of a file, `{ ...file }` in a constructor, a `?raw`
   import, a named JSON import). Pure engine code that takes its config by reference and reads it per tick is live AND
   pure (seeded tests stay deterministic). Hot loops that read thousands of values a frame copy the file once per frame.
   - `liveTuning` / `useLiveTuning` stay for files outside content/tuning and for code that wants to know WHEN an edit
     arrives; words → `content/text/en.json` hot-reloads (Text tab); look → `content/ui/style.json` via `applyStyle`.
   - Guard: the game's own tests run `copiedAtLoad(srcFiles)` (`src/devkit/tuning/liveGuard.ts`) — it fails on the
     copies above; copies inside constructors/factories it can't see → prove a few knobs live in an e2e.
2. **Two clocks — the shared ones** (`src/devkit/gameClock.ts`, safe in every build). The **rules clock** runs
   anything that can change what happens (falling, timers, AI moves, physics that decides results); the **looks clock**
   runs presentation (blinks, pulses, glows, idle jiggle). Rule: *if the end of an animation changes the game, it's on
   the rules clock.* The game: ticks its engine by `dt × rulesClock.rate`, sets `rulesClock.scale` for its own pause /
   slow motion, uses `rulesClock.after/every/now` instead of `setTimeout`/`setInterval`/`performance.now` for game
   logic, and takes frame time and pulses from `looksClock` (so a full pause resumes without a jump).
3. **Adapter** (`src/devkit-game/<game>Adapter.ts`, registered in `tabs.ts`): `getState` / `setState` (plain JSON; junk
   refused with a plain reason) · `canRestore` · `onEvent` (short lines) · `describe` · `pauseModes: ['full','half']`
   (or just read rulesClock) · optional `pause(mode)` for machinery the clocks don't reach (a physics engine, an AI
   worker) · optional `canPause` (default `canRestore`). Online games: restore and pause greyed out.
4. **Pause buttons work** (Dev Kit 0.18.0, left of the panel title; P cycles): **⏸ Full pause** — the Dev Kit holds
   the page's animation frames, pauses CSS/Web animations, media and AudioContexts, and stops both clocks; a live edit
   while frozen redraws one frame · **◐ Half pause** — only the rules clock stops (watch a pulse while nothing moves
   on). Slow motion and step-one-frame (catalog "Time") will sit on the same clocks.
5. **Seeded randomness** with a fixed mode for checks (`?seed=`), so snapshots and captures replay.
6. **Screens previews** for gated screens (end report, rank-up, errors) — `src/devkit-game/previews.tsx`.
7. **Hotkeys skip text boxes** (input / textarea / select / contenteditable).
8. If the game uses Select (`content/devkit/select.json`): every tunable thing on screen carries `data-knobs`.

## UI kit (every web game with menus/HUD — `framework/ui-kit`)
- Words only from `content/text/en.json`, look only from `content/ui/style.json` (`applyStyle`, live), settings rows
  from `content/ui/settings.json` — and every row that's on is read by the game.
- Game fonts in `content/ui/fonts.json` + `public/fonts/` with their licences (font roles: title / heading / body / numbers).
- Page-wide game CSS wrapped in `@layer game-base`; the kit's checker (`check-ui`) runs in `check:fast`.

## Audio (`framework/audio`)
- Code says what happened (`playSound('seed.land')`); `content/audio.json` says what it sounds like.
- Full pause suspends it (the Dev Kit's pause reaches the audio module); the Sound tab edits play live.

## Table / AI / Rooms (turn-based and online games)
- Rules are the Table's pure `Rules` contract; the move record replays (snapshots + bug captures use it).
- AI seats think on the rules clock (half pause stops a bot mid-think); personalities live in `content/ai/`.
- Online (Rooms): the server owns the truth; Dev Kit tools that affect play are offline-only.

## When a new module is made
Add its section here (what the game must provide, how it's checked) in the same commit as the module, and a
"What a game must provide" section to the module's README.
