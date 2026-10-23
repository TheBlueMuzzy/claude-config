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
- AI arena (ai 0.3.0): the Personality Check plays through the framework arena — the game gives only `src/ai/arenaGame.ts` (rules, board choice, bot, meters, winners; `kit/arena.ts` ArenaGameFile) and `content/ai/arena.json` + `feel-targets.json`; `npm run ai:arena` on the PC, and the Dev Kit's Run check plays in a Web Worker (`devkit/ai/checkWorker.ts`), never on the page's main thread ③ (the installer lists the missing steps; a balance tool, not a check:framework promise).
- Online (Rooms): the server owns the truth; Dev Kit tools that affect play are offline-only.
- Online (Rooms 0.10.0): the server game state is plain JSON (`jsonProblem(state)` null — it's saved in storage), the game's own timers come back in `rules.onRestore`, and `content/rooms.json` says `keepMatchDays` (chosen at /define) ③ (the installer lists the missing ones).

## Saves (any game that remembers anything — `framework/saves`)
- Every save goes through `createSave` (key starts with the game's name); game code never touches `localStorage` / `sessionStorage` itself — except the rooms module's `rooms:` ids and files listed in `content/saves.json` `storageAllowed` with why ② (check:framework Saves "the game saves through the module" lists every other line and fails).
- A default change that should reach old saves is an **upgrade step** (`version` + 1), never just a new `fresh` value ③ (whether a default should reach old saves is a design call) — then ② (check:framework fails until the new version has a golden save, and a golden save's `expect` proves the old one gets the new default).
- A **golden save per version** in `tests/saves/<key>-v<N>.json`, each save listed in `tests/saves/saves.test.ts` ② (check:framework Saves: a missing version fails; the save test — golden saves load, round trip, damaged saves, full storage — runs inside it).
- A **phone / desktop build opens its saves before the first read** — `await openSaves(backend, { game })` in main.tsx before rendering (saves 0.6.0); a web build needs nothing. Other formats (C# for Unity) are built from `saves/FORMAT.md` and tested on the same golden saves ③ (no store build yet — F97 / F99 add the checks).

## Version (every web game — `framework/version`)
- **One source:** `version.json` (`/save` bumps the build) read only by `versionPlugin()` in vite.config — it bakes in `import.meta.env.APP_VERSION` and puts `<meta name="app-version">` in the page ② (check:framework Version: the plugin in vite.config, a readable version.json, and any other file importing version.json is named and fails).
- **One format, the same places:** `versionLabel` ("vX.Y.Z.B") on the main-menu footer (`<MainMenu version>`), the bottom of every Settings tab (`<Settings version>`, UI kit 0.24.0) and the Dev Kit adapter's `version` (snapshots + bug files) ② (check:framework Version: each one names the line that passes something else, or nothing).
- **No test on a stale build:** an e2e script calls `checkVersion(page)` after `page.goto` — a stale build or a cached service worker stops it with a plain message ② (check:framework Version: an e2e file calls it; the browser check compares the page's meta tag with version.json).

## Crashes (any game players play away from Muzzy — `framework/crashes`)
- **Errors are caught from the start:** `startCrashes({ config: readCrashesConfig(crashesJson), version: versionLabel })` in main.tsx, before the first render; a React game passes `crashRootOptions()` to `createRoot` (a broken screen says "Something broke · Reload", never a blank page) ② (check:framework Crashes: startCrashes in the game's code + content/crashes.json; createRoot without crashRootOptions fails).
- **The player can turn it off:** the `crashReports` toggle (CRASH_SETTINGS_ROWS) in Settings, and `applyCrashSetting(values)` at start-up and on change ② (check:framework Crashes: the row and the call, or it fails). The privacy page carries the crash paragraph (design/crashes.md "Privacy wording") ③ (release-check privacy line).
- **Moments are code names + numbers only** — `moment('roundStart', 3)`, never a player's name or typed text ① (the module drops any name that isn't a code name).
- **No source map ships:** `crashesMaps()` in vite.config; `releases/<version>/maps/` is committed ② (check:framework Crashes: any .map in public/ or dist/ fails).
- **Going live is Muzzy's call** (a public server): token per machine in `~/.config/bmuz/crashes/<server host>.token`, `npm run crashes:deploy`, `client.url`, and `Crashes: <address>` in STATE Key facts for session start ③.

## Emotes (any game where players share a table — `framework/emotes`)
- **One path for every seat:** people, bots, local and online all go through `createEmotes(…)` (`sendEmote` / a bot's `say`), and the words live only in `content/text/en.json` `"emotes"` — never typed into the game's code ② (check:framework Emotes: every phrase id in content/emotes.json has words; a phrase's English words in `src/` fail, named).
- **Never a nuisance:** a spam limit on the device and on the server (`content/emotes.json` `limits` / `server`; the server never looser) · a mute per opponent (`EmoteMenu` on their seat) · the "Hide everyone's emotes" switch (`EMOTE_SETTINGS_ROWS` + `applyEmoteSetting`) ② (check:framework Emotes: the limits are sane; the switch is in Settings and reaches the module).
- **The picker opens from the player's own seat** (`emoteSeatProps(seat, mine)` on each tappable seat, `<EmoteMenu>`), and the bubbles (`<EmoteBubbles avoid="<HUD>, [data-emote-seat]">`) keep the UI kit's bars — fixed size, room round the words, clear of the HUD ② (check:framework Emotes, in live play at every size: the picker opens from `data-emote-mine`; after two sent phrases the UI kit's checks pass and the bubble never changes size).
- **Online, the room relays them:** `party/server.ts` passes `{ emotes }` (content/emotes.json) to RoomServer (Rooms 0.12.0+) and never handles `emote` itself; the screens pass `onEmote: (m) => emotes.receive(m)` and `send: (seat, id) => online.sendEmote(id)` ② (check:framework Emotes: the server check names a missing `{ emotes }` or a game's own `'emote'` handler).
- **Kept with the saves module:** `createSave({ ...EMOTE_SAVE, key: '<game>:emotes', version: 1 })` (the switch + this match's mutes), listed in `tests/saves/saves.test.ts` with its golden copy (the installer writes it) ② (check:framework Saves, like every save). Pause closes the picker ③.

## When a new module is made
Add its section here (what the game must provide, how it's checked) in the same commit as the module, and a
"What a game must provide" section to the module's README.
