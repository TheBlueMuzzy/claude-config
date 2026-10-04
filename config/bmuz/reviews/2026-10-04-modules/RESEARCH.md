# Framework modules — research + proposed taxonomy
2026-10-04 · research only, nothing in any project changed.
Read first: `dev/framework/README.md`, `ui-kit/CATALOG.md`, `devkit/README.md`, `rooms/README.md`, `dev/HUB.md`, Glyphtender + Roll Better ROADMAP/src (to see what already exists).

---

## 1. How others slice "modules" — and what granularity they pick

| Who | What a "module" is there | Granularity | Lesson for us |
|---|---|---|---|
| **Unreal — Game Features + Lyra** | Two tiers. *Shared plugins* every game uses (CommonUI, CommonGame, CommonUser = login/online, GameSettings, UIExtension, ModularGameplayActors). *Game Feature plugins* that switch a whole slice of gameplay on/off (ShooterCore, TopDownArena) and inject components into the game at load. An "Experience" = a list of which feature plugins a mode turns on. | Features are **big** — a whole mode or system. The shared tier is infrastructure. | Exactly the two layers Muzzy described: foundations underneath, features on top. Features depend on the core; **the core never depends on a feature.** An "Experience" ≈ BMUZ reading the GDD and listing modules. |
| **Unity — Game Creator 2** | Core + paid modules: Inventory, Dialogue, Stats, Quests, Behavior (AI), Perception, Melee, Shooter. "Core + Inventory + Dialogue = an escape game." | **"Does this game have X?" level** — each is something a player would name. | The closest match to Muzzy's idea. Modules are sold/added whole; they talk through shared core pieces (variables, conditions, actions). |
| **Unity Asset Store kits** (CCG Kit, Single-Player CCG Kit, Turn-based Game Kit) | Whole genre kits. | **Too big** — you buy a game, then fight it. Single-Player CCG Kit is an *extension* of CCG Kit: they split when a second shape of game needed different halves. | Avoid genre kits. Split exactly where two games want different halves (our "second game makes it general" rule). |
| **Godot addons** (card-framework, CardPileFramework, deckbuilder-framework) | Card **piles + hands + drag-drop**, JSON card data. Rules stay in your game. | Mechanic-level: "cards in piles, a fanned hand, dragging between them". | Hand / Deck / Drag are the reusable bits; rules are not. Data in JSON = our `content/` rule. |
| **boardgame.io** | One engine shape: state `G` + **moves** (pure functions) + **events** (end turn/phase) + **phases → turns → stages** + turn order; `playerView` hides secrets; plugins wrap moves (randomness, per-player state); built-in bots (random + MCTS) and lobby/multiplayer that work *because* everything is pure moves. | Small core, everything else plugs into it. | The biggest lesson: if every game keeps its rules as **pure state + moves + seeded random**, online play, AI, undo, replay, snapshots and bug capture all come almost free. Glyphtender already does this (`src/engine/`); Rooms' `GameRules` is the same shape. Make it a foundation. |
| **Board Game Arena Studio** | Server: Deck/ItemManager (cards in locations), Counters, state machine (`states.inc.php`), game stats, game options + preferences, "zombie mode" (dropped player). Client: Stock, Zone, Draggable, Scrollmap, Counter, bga-cards, bga-dice, bga-animations, bga-zoom, bga-score-sheet. | Component-level, ~15 parts, shared by 1000+ games. | Proves a *small* set covers most tabletop games: **pieces-in-places (zones), cards, dice, counters/scores, drag, board viewport (zoom/scroll), animations, end score sheet, stats, options.** Animations are one shared library, not per-game. |
| **Tabletop Simulator** | Physical objects (deck, bag, dice, tokens, boards) + **zones** (hand, hidden, randomize, layout, snap points, fog of war, scripting). | Object + zone. | A "hand" is just a private zone; a "bag" is a container you draw from; layout zones auto-arrange. That's the vocabulary for our Hand / Bag / Board modules. |
| **Fortnite UEFN / Roblox** | Fortnite "devices": Score Manager, Timer, Player Spawner, Elimination Manager, Tracker, HUD Message… wired by events. Roblox: engine services (TextChatService, VoiceChat, DataStore, BadgeService = achievements, Leaderboards). | Devices are **small and single-purpose**; services are platform-level. | Devices are too fine for us (that's "button-level") but show the right *knobs-in-a-panel* idea. Roblox puts chat/voice/achievements/save at **platform level** — confirms they're foundations or optional services, not gameplay. |
| **Construct / GameMaker behaviours** | Platform, 8-Direction, Drag & Drop, Tween, Timer, Physics, Pathfinding, Tile movement. | Fine — one behaviour per object. | Good for *parts inside* our modules (Drag & Drop lives inside Pieces & Placement; Tween inside Motion). Too fine to be BMUZ modules. |
| **PlayTable / TapTop** (public info is thin) | Public write-ups mention platform modules: launcher, game library, marketplace, accounts, chat, analytics, DRM, content distribution, display/power drivers, plus an SDK for third parties; object recognition (figures/cards) for hybrid play. | Platform + SDK. | Muzzy remembers the gameplay-module side better than anything public — his memory is the main source here. The camera/recognition idea lives on in Wind Chime. |
| **Entity–Component–System** | Things are bags of small components (Position, Owner, Draggable, Face-up…); systems run over them. | Very fine, engine-level. | Good *inside* a module (a piece has states: idle/hover/held/placed/locked), wrong level for the catalog. |
| **Game Programming Patterns** (Nystrom) | Command (undo/replay), State (piece and turn states), Observer/Event Queue (sounds, achievements listening to events), Type Object (data-driven defs), Component. | Pattern-level. | Explains *why* foundations matter: Achievements, Audio, Stats, Log and Bug capture all just **listen to game events** → one shared event stream is a foundation. |
| **Mechanics taxonomies** (BGG ~190 mechanics; Engelstein & Shalev *Building Blocks*: Game Structure, Turn Order, Actions, Resolution, Game End & Victory, Uncertainty, Economics, Auctions, Worker Placement, Movement, Area Control, Set Collection, Cards) | Design vocabulary, not code. Top BGG mechanics: Dice Rolling, Hand Management, Variable Player Powers. | Design-level. | Use the book's **chapters** as the checklist of what modules must cover (turn order, resolution, end/victory, uncertainty = random/dice/draw, economics). Most *mechanics* (set collection, area control, worker placement) are **rules** — they live in the game, using our modules. |

**What the research agrees on**
1. **Two tiers** everywhere it works well (Lyra, Game Creator, BGA, Roblox): shared foundations + switchable features. Features lean on foundations, never on each other's insides.
2. **The winning feature size is "a thing a player could name"** (Inventory, Dialogue, Dice, Cards, Scoring) — not a genre (CCG Kit = too big) and not a widget (Button, Timer device = too small).
3. **Rules stay in the game.** Every good kit gives the *things* (cards, dice, zones, turns) and lets the game plug in its rules (boardgame.io moves, BGA states, our Rooms `GameRules`).
4. **Animation is shared** (BGA has one bga-animations, Construct one Tween) — features call it, they don't each invent motion.
5. **Online is a platform service with optional parts**, not five gameplay modules.

---

## 2. Proposed taxonomy

### Layer A — Foundations (every game gets them; never a "does it have X?" question)

| Foundation | What it gives | Knobs (content/) | Status |
|---|---|---|---|
| **App shell** (display) | Full screen, phone-sideways/upright handling, safe areas (notch), "game box" letterbox, install as an app (PWA icon/manifest/offline), keep-screen-awake, version stamp, "new version — reload". Per platform recipe (web/PWA now; Capacitor/Steam/Unity later). | orientation, aspect, theme colour, app name/icon | Partly exists, scattered: game box is in the UI kit (0.1.7), Glyphtender is a PWA. Not a module yet. |
| **UI kit** | Screens, HUD, dialogs, 5 styles | `content/ui/style.json`, `settings.json` | ✅ exists (kit 0.2.x) |
| **Dev Kit** | Tuning, colours, snapshots, bug capture, screen previews | `content/tuning/`, `devkit.json` | ✅ exists (0.5) |
| **Motion & feel** | The shared motion vocabulary: durations, easings, **small/medium/big tiers**, helpers (glide, pop, shake/"nope", pulse, hit-stop, haptics buzz), reduce-motion switch, "pair a sound with this" hook | `content/feel.json` (the game-feel skill already defines it) | Bits exist per game: Glyphtender `feel.ts`, `glide`, `useNopeShake`, `useTurnPulse`; Roll Better `haptics.ts`; kit transitions. Not unified. |
| **Game core** (rules shape) | The boardgame.io lesson: state + actions + **seeded random** + undo + **event stream** + game log + headless sim/test harness. Everything else plugs in here. | none (it's a shape) | Proven once: Glyphtender `src/engine/` (rng, log, sim, testkit). Rooms' `GameRules` already expects this shape. |
| **Settings & save** | Settings storage (sound, motion, colour-blind, language), save/continue a game, versioned saves that don't break on update | settings list (already in kit `settings.json`) | Kit has the Settings screen; `save-system` skill exists; Glyphtender has `migrate.ts`. Not a module. |
| **Testing & release** | Tests, phone + desktop screenshots, release check, version stamp | — | Lives in BMUZ skills + Dev Kit release check. Keep it as process, not code. |
| **Text & language** | All player words in `content/text/`, optional translations | `en.json` | Skills exist (`externalize-text`, `localize`). Small; fold into Settings & save or keep as a skill. |

### Layer B — Feature modules ("does this game have X?")

Size: **S** ≈ a day or two · **M** ≈ a sprint · **L** ≈ several sprints. Status: ✅ module exists · ① proven once (lives in one game, harvestable) · ② proven in two games (ready to generalise now) · ○ not built.

**Table & turns**

| Module | Player-facing | What's inside | Designer knobs | Needs | Size | Could prove it | Status |
|---|---|---|---|---|---|---|---|
| **Turn & phase flow** | "Whose turn is it, and what can I do now?" | Turn order (clockwise, snake draft, simultaneous, real-time), phases/rounds, legal-move highlights, undo-this-turn, end-turn, turn banner/pulse, round intro | turn order type, rounds, undo allowed, auto-end turn, highlight style | Game core, UI kit, Motion | M | Glyphtender (alternating + snake draft) → Roll Better (simultaneous) → a mahjong-tile game | ① Glyphtender (`turn.ts`, `draft.ts`); Roll Better has the simultaneous shape |
| **Seats & pass-and-play** | "2–4 of us on one device" | Seat list, colours, names, bot-or-human per seat, "pass to Blue" handoff screen that hides secrets, random first player | max seats, colours, handoff on/off, hide-hand-on-handoff | Turn flow, UI kit | S | Glyphtender → any second hot-seat game | ① Glyphtender (F11 `Handoff.tsx`) |
| **Clocks & timers** | "Hurry — 10 seconds left!" | Turn clock, game clock, chess-clock, idle detection, timeout → auto-move | seconds per turn, warning point, what happens at 0 | Turn flow, Motion, Audio | S | Roll Better online (turn clock) | ① lives in Rooms games; kit has `TimerRing` |

**Things on the table**

| Module | Player-facing | What's inside | Designer knobs | Needs | Size | Could prove it | Status |
|---|---|---|---|---|---|---|---|
| **Pieces & placement** | "Pick it up, drop it where it goes" | Tap-or-drag input, drop targets/zones, snap, piece states (idle · hover · held · planned · placed · locked · illegal "nope"), ghost preview, throw/glide to a spot | snap distance, drag vs tap, lift scale, nope shake, glide time | Motion, Game core | M | **Both games already do it** | ② Roll Better drag-to-unlock (`dropZone.ts`, `DropZoneHighlight`) + Glyphtender (`usePieceInput`, `dropTarget`, `glide`) → **harvest first** |
| **Board** | "The play area" | Grid / hex / free / track / modular tiles, board viewport (fit, zoom, pan), coordinates, neighbours, board shapes from JSON, jump-to | shape, size, tile layout, zoom limits | Pieces, App shell | M | Glyphtender hex → Escape Pod Scramble modular compartments → mahjong push-grid | ① Glyphtender (`hex.ts`, `boards.ts`, fit/zoom shell) |
| **Hand / rack** | "My cards/tiles, private to me" | Fanned or rack layout, reorder, shuffle-my-hand, select one/many, hidden from others, overflow on phone | hand size, layout (fan/rack/grid), sort rule, show count to others | Pieces, Seats | S–M | Glyphtender seed tray → Stillpoint cards → mahjong tiles | ① Glyphtender (`SeedTray`, `trayLayout`) |
| **Deck, bag & draw** | "Draw from the deck / pull from the bag" | Deck/bag/market contents from JSON, shuffle (seeded), draw, discard, refill/refresh, reshuffle discards, market row, visible count | contents + counts, hand refill size, reshuffle rule, market size | Game core (seeded random), Hand | S–M | Glyphtender bag (120 tiles) → Stillpoint deckbuilder → Escape Pod crew cards | ① Glyphtender (bag + refresh) |
| **Dice** | "Roll!" | 3D physics dice (settle detection, read the face) **or** flat 2D dice, hold/lock, reroll, custom faces, gather-and-release throw | dice count, faces, physics damping/bounce, roll time | Motion, Pieces, Audio | M–L | Roll Better → any second dice game (small: a Knucklebones-style sketch) | ① Roll Better (`PhysicsDie`, `diceUtils`, `matchDetection`) |
| **Words** (Muzzy-specific) | "Is that a word?" | Dictionary loader, word finder on a grid, min length, blanks/Qu, word highlight spotlight | word list, min length, special letters | Board | M | Glyphtender → a second word game | ① Glyphtender (`words.ts`, `wordFinder.ts`, spotlight) |

**Scoring & ending**

| Module | Player-facing | What's inside | Designer knobs | Needs | Size | Could prove it | Status |
|---|---|---|---|---|---|---|---|
| **Scoring & results** | "How am I doing, and who won?" | Score tally per seat, +N pops, live/hidden/secret scores, tie-break, breakdown by source, end reveal, end scorecard, score-over-time story chart, rematch hook | hidden or open scores, tie rule, breakdown categories, reveal pacing | Game core (event stream), UI kit (Results, PlayerChip), Motion | M | Glyphtender (secret Magic + story chart) + Roll Better (live race) | ② the *display* side is in both + the kit; scoring **rules** stay in each game |
| **Stats & history** | "My lifetime record" | Per-game stats from the event stream, lifetime stats screen, game history list, personal bests | which stats, what counts as a best | Game core, Settings & save, UI kit (Stats recipe) | S | Glyphtender (`stats.ts` per game; lifetime planned for 1.0) | ① partly |
| **Achievements & moments** | "Ooh — I got one!" | Achievement list in JSON (condition = an event pattern), progress, unlock toast + popup, "moments" detected mid-game (big word, comeback, tangle) to celebrate | the list, rarity, hidden or shown, celebration size (Motion tier) | Game core (event stream), Stats, UI kit (Achievements recipe, RewardPopup), Motion, Audio | S–M | Glyphtender's key moments (tangle, two-birds cast) → Roll Better ("insane roll") | ○ (Glyphtender `EndHighlights` is a seed) |

**Who you play with**

| Module | Player-facing | What's inside | Designer knobs | Needs | Size | Could prove it | Status |
|---|---|---|---|---|---|---|---|
| **AI opponents** | "Play against the computer" | Goal-selection personality model (skill `ai-opponent`), difficulty, think time, fuzzy perception, banter lines, bot fills an empty/dropped seat | personalities, difficulty, think delay, mistake rate | Game core (legal moves + sim), Seats, Turn flow | L | Glyphtender beta (7 personalities from the original) → Roll Better (`aiDecision.ts`) | ① Roll Better simple bot; Glyphtender original (Unity) has the full model |
| **Online play** | "Play with friends far away" | **Core:** Rooms (codes, lobby, seats, rejoin, host migration, bot takeover, rematch, per-player views). **Optional parts** (switches): quick chat / emotes · spectators · async (play-by-turns) · invite link/QR | min/max seats, idle timeout, bot takeover, which optional parts are on | Game core, Seats, UI kit (Lobby) | L (core done) | Roll Better + Glyphtender | ✅ Rooms 0.1.1 — **proven in two games** |

**Around the game**

| Module | Player-facing | What's inside | Designer knobs | Needs | Size | Could prove it | Status |
|---|---|---|---|---|---|---|---|
| **Audio** | "It sounds good" | Sound manager, buses (music/sfx/ui), ducking, variation, voice limits, code-made placeholder SFX (ZzFX), mute/volume in Settings, listens to the event stream | volumes, which event → which sound | Game core (events), Settings, Motion (paired sounds) | M | Roll Better (`soundManager.ts`) → Glyphtender 1.0 audio pass → Wind Chime (audio-first) | ① Roll Better + `audio-setup` skill |
| **Tutorial & onboarding** | "Teach me as I play" | Scripted first game (seeded setup), coach marks pointing at things, step gating, "try it" checks, skip, How to Play pages | steps (JSON), skip allowed, when it triggers | Game core (snapshots/seeded setup), UI kit (coach-mark recipe, HowToPlay), Turn flow | M–L | Goops (Tutorial v3 rank-0 training — old project) → Glyphtender 1.0 tutorial | ① Goops (not on the framework) |
| **Progression & economy** | "Unlock things, earn stuff" | Currencies, XP/ranks, unlocks, upgrades, shop, daily reward (kit recipes exist for screens) | costs, curves, unlock list | Settings & save, UI kit, Achievements (often) | L | Goops (40 ranks, 20 upgrades) → DoomDial remake | ① Goops (old) |
| **Game options** | "House rules / new game setup" | New Game screen built from a list (players, board, variants, toggles), host options online, sent to the rules as `Options` | the option list | UI kit, Game core, Online (host options) | S | Glyphtender New Game (players, board, 2-letter) + Roll Better | ② mostly — close to a kit recipe |
| **Camera & scan** (niche) | "Point your phone at the real cards" | Camera permission, QR/marker scan, live detection | scan rate, sound mapping | App shell, Audio | M | Wind Chime | ① Wind Chime — the PlayTable "hybrid table" idea |

Things deliberately **not** modules: set collection, area control, worker placement, auctions, word scoring rules, Magic, tangles — these are **rules** (the game's own `party/rules.ts`/engine). Modules give the table, the pieces, the turns; the game brings the rules.

---

## 3. The four specific questions

### Where do animation / motion standards live?
**One shared foundation (Motion & feel) for the *vocabulary*; each module owns its *choreography*.**
- Foundation holds: the tiers (small/medium/big), durations, easings, reduce-motion, and helpers (glide, pop, nope-shake, pulse, hit-stop, haptic buzz, "play paired sound"). Values in `content/feel.json`, tunable in the Dev Kit.
- A module decides *what* moves (Dice decides how a die tumbles; Hand decides how a card fans) but must use the shared tiers and helpers — so every game feels like one family and one Dev Kit slider changes the whole game's snappiness.
- The UI kit's screen transitions should read the same tokens (today they're kit-only).
- Why: BGA (one bga-animations for 1000+ games) and Construct (one Tween) both do this; Glyphtender already grew `feel.ts` because it needed one place. The `game-feel` skill already defines `content/feel.json` tiers — this makes that real code.

### Where does display / full screen belong?
**Its own small foundation, the App shell, installed alongside the UI kit (same installer run), not inside it.**
- The UI kit is "what screens look like" and should stay the same on web or Unity. Full screen, orientation, PWA install, wake lock, safe areas, offline and "update available" are **platform** jobs — they change per platform recipe (web / Capacitor / Steam / Unity) while the kit doesn't.
- The kit keeps the "game box" sizing it already has; the shell *provides* the box size. Every game gets both automatically, so to Muzzy it still feels like one thing.

### How fine-grained is online play?
**One module, "Online play", with Rooms as its required core and optional parts as switches** (quick chat/emotes, spectators, async turns, invite link). Not separate Rooms / Chat / Voice modules.
- All the parts share identity, seats, connection and the server — splitting them would mean three modules that can't live without each other.
- The GDD question is one question: "Is this game online?" Then smaller follow-ups ("chat? spectators?").
- **Voice: don't build it.** Players already use Discord/FaceTime; if ever needed, it's an optional part using a hosted service. (Unity/Roblox split voice into a separate *service* because they sell it separately — that's a business split, not a design one.)
- **Split only when a part works without rooms**: e.g. leaderboards or cloud save also help solo games → they'd be their own module (or part of Stats / Settings & save), not part of Online.

### Rule of thumb for granularity
> **A module is one line on the GDD's "Does this game have…?" checklist — something a player would notice and name.**
> - **Too small** if no player would name it ("button", "timer ring", "drop zone") → it's a *part* inside a module or the UI kit.
> - **Too big** if two real games want different halves of it → split along that seam (that's how Single-Player CCG Kit split from CCG Kit).
> - **Same module** if the parts always ship together and can't work alone → make the extras *options* (switches in its `content/` file), not new modules.
> - **Rules are never modules.** A module gives things and flow; the game plugs in its rules (like Rooms' `GameRules`).
> - Plus the existing rule: **one game proves it, a second game makes it general.**

Each module's card (BMUZ-PLAN already wants this) should carry: player-facing line · what's inside · knobs file · needs · **"stays in the game"** (Rooms' README does this well) · platforms · proven in.

---

## 4. Suggested order to prove modules

Principle: harvest what **two games already do** first (cheap, safe), then foundations everything leans on, then modules that unlock a new kind of game. Each step names the game that proves it.

| # | Module(s) | Why now | Proven by |
|---|---|---|---|
| 1 | **Motion & feel** (foundation) + **Game core** shape (foundation) | Every later module pulls from them; both already exist in Glyphtender | Harvest from Glyphtender; check against Roll Better (haptics, dice feel) |
| 2 | **Pieces & placement** | Already in **both** games → it's the "second game makes it general" case today | Roll Better + Glyphtender |
| 3 | **Seats & pass-and-play** + **Turn & phase flow** + **Game options** | Glyphtender proved them; Online play already leans on seats | A **small new mahjong-tile game** (e.g. the "Catching the Tortoise" push-tile duel in `research/mahjong`) — also proves Board (grid) and Bag |
| 4 | **Hand / rack** + **Deck, bag & draw** | Glyphtender has tray + bag; a card game makes them general | Same mahjong game (tiles in hand, bag) → then **Stillpoint** (deckbuilder; its folder isn't on this PC yet) |
| 5 | **Scoring & results** + **Stats & history** + **Achievements & moments** | All listen to the event stream from step 1; Glyphtender 1.0 wants lifetime stats | Glyphtender 1.0 → Roll Better or the mahjong game |
| 6 | **AI opponents** | Glyphtender beta is waiting for it; needs Game core + Turn flow first | Glyphtender beta (goal-selection, 7 personalities) → mahjong game bot |
| 7 | **Audio** | Glyphtender's 1.0 audio pass; Roll Better has a manager to harvest | Roll Better → Glyphtender → Wind Chime |
| 8 | **Board (modular)** + **Dice** generalised | Needs a second board shape / second dice game | **Escape Pod Scramble web remake** (modular compartments, crew cards, hazards, tokens) — proves modular Board, Deck, Pieces in a new genre |
| 9 | **Tutorial & onboarding**, **Progression & economy**, **Clocks & timers** | Bigger, needed for 1.0s and real-time games | Glyphtender 1.0 tutorial (Goops is the reference) → **DoomDial remake** (real-time, waves, upgrades) |
| later | **App shell** formalised, **Camera & scan** | Shell is small — fold in whenever a game ships to a new platform; Camera only if another hybrid game appears | Glyphtender PWA now; Wind Chime |

Good small "proof" games (a weekend sketch each, per the "prototype = code sketch" rule): a mahjong push-tile duel (Board grid, Bag, Hand, Turn, AI) · a Knucklebones-style dice duel (Dice 2nd game, AI, Scoring) · a tiny solitaire/patience (Deck, Hand, Pieces, Undo).

---

## Sources
- Unreal Game Features: https://dev.epicgames.com/documentation/en-us/unreal-engine/game-features-and-modular-gameplay-in-unreal-engine · Lyra: https://dev.epicgames.com/documentation/unreal-engine/lyra-sample-game-in-unreal-engine · https://unrealist.org/lyra-part-2/ · https://www.jaydengames.com/posts/ue5-black-magic-plugins-strcture/
- Game Creator 2: https://docs.gamecreator.io/gamecreator/ · https://en.senkohome.com/gamecreator2-overview/
- Unity kits: https://assetstore.unity.com/packages/templates/systems/ccg-kit-52739 · https://assetstore.unity.com/packages/templates/systems/single-player-ccg-kit-150156 · https://bogakit.com/
- Godot: https://github.com/chun92/card-framework · https://github.com/db0/godot-card-game-framework
- boardgame.io: https://github.com/boardgameio/boardgame.io (docs/documentation/concepts.md, plugins.md)
- BGA Studio: https://en.doc.boardgamearena.com/Development · https://en.boardgamearena.com/doc/Zone · http://en.boardgamearena.com/doc/Your_game_state_machine:_states.inc.php
- Tabletop Simulator: https://api.tabletopsimulator.com/object/ · https://api.tabletopsimulator.com/built-in-object/
- Fortnite devices: https://dev.epicgames.com/documentation/fortnite/using-devices-in-fortnite · https://fortnite.fandom.com/wiki/Devices_(Creative)
- Construct behaviours: https://www.construct.net/en/make-games/manuals/construct-3/project-primitives/objects/behaviors
- PlayTable: https://medium.com/@john_dempsey/what-goes-into-playtable-304b1738f517 (blocked to fetch; summary via search) · https://www.digitaltrends.com/computing/blockchain-playtable/
- Mechanics: https://www.routledge.com/Building-Blocks-of-Tabletop-Game-Design-An-Encyclopedia-of-Mechanisms/Engelstein-Shalev/p/book/9781032015811 · https://jlmc.medium.com/weird-trends-in-board-game-mechanics-59b255f4bda6
- Game Programming Patterns (Nystrom): https://gameprogrammingpatterns.com/ (from knowledge, not fetched)
- Not fetched / from general knowledge (flag): Roblox services, Unity Gaming Services split (Lobby/Relay/Vivox), ECS.

---

## Summary
1. Everyone who does this well uses two layers: shared **foundations** + switchable **features** (Lyra, Game Creator 2, Board Game Arena); features lean on foundations, never on each other's insides.
2. Right module size = **"a thing a player would name"** (Hand, Dice, AI, Online) — not a genre kit, not a widget; **rules always stay in the game**.
3. Foundations: App shell (display/full screen/PWA), UI kit ✅, Dev Kit ✅, Motion & feel, Game core (state + moves + seeded random + event stream), Settings & save, Testing.
4. Motion = one shared vocabulary (tiers, easings, reduce-motion, helpers in `content/feel.json`); each module choreographs its own moves with it. Display = its own App shell foundation, installed with the kit.
5. Online = **one** module (Rooms core ✅ + optional switches: quick chat, spectators, async); skip voice; split only parts that work without rooms (leaderboards).
6. Prove next: Motion + Game core → Pieces & placement (already in both games) → Seats/Turns/Hand/Bag via a small mahjong-tile game → Scoring/Stats/Achievements → AI (Glyphtender beta) → Audio → Escape Pod remake (modular board) → DoomDial (tutorial/progression).
