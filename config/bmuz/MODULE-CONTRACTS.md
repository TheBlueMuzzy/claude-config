# Module contracts — what a game's architecture must provide for each framework module

A framework module only works as well as the game's hooks into it. /define writes these into the TDD (§2c "Module
contracts") for every module the game uses, the first milestone gets a 🧱 feature for them, and /develop keeps them
true for every new system. Each module's README has the details; this is the checklist.
Why this file exists (Muzzy, 2026-10-18): Goops got the Dev Kit installed but nothing in the game was wired to it —
"the purpose of the devkit is to affect things live. I thought that was clear."

## Dev Kit (every web game — `framework/devkit`)
The Dev Kit's job is to change the RUNNING game live. A game is wired for it when:
1. **Live content.** Every value the game reads from `content/` follows Dev Kit edits without a reload:
   - tuning → `liveTuning('file', json)` / `useLiveTuning` (read `.current` at the moment of use, never copied at load);
   - pure rules/engine code takes its config by reference or through a setter, so it stays pure AND live (seeded tests
     stay deterministic);
   - words → `content/text/en.json` hot-reloads (Text tab); look → `content/ui/style.json` through the UI kit's `applyStyle`.
   - Guard: the Dev Kit's live-tuning guard test runs in the game's own tests (a direct `content/tuning` import fails it).
2. **Two clocks.** The game separates the **rules clock** (anything that can change what happens: falling, timers, AI
   moves, physics that decides results, rule-carrying animations) from the **looks clock** (blinks, pulses, glows, idle
   jiggle). Rule: *if the end of an animation changes the game, it's on the rules clock.* Game-logic timers never use
   raw `setTimeout`/`setInterval` — they run on the rules clock, so pausing it stops them.
3. **Adapter** (`src/devkit-game/<game>Adapter.ts`, registered in `tabs.ts`): `getState` / `setState` (plain JSON; junk
   refused with a plain reason) · `canRestore` · `onEvent` (short lines) · `describe` · **`pause('full' | 'half' | null)`**
   + the modes it supports. Online games: restore and pause greyed out (can't pause other players).
4. **Pause buttons work** (Dev Kit "Time" tool): **⏸ Full pause** — everything frozen (the Dev Kit holds rAF, CSS/Web
   animations and audio itself; the adapter stops the game's own rule timers and its frame clocks so nothing jumps on
   resume) · **◐ Half pause** — the rules clock stops, the looks clock runs (watch a pulse while nothing moves on).
   Slow motion and step-one-frame (catalog Tier 1 "Time") sit on the same rules clock.
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
