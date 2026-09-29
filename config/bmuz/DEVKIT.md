# BMUZ Dev Kit — catalog

Developer tools that live **inside** every web game — in development, and in release builds until 1.0.
Press **`** (or triple-tap on a phone) to open the console. Tabs across the top, one per tool.

**The one rule:** every tool edits **data files** in `content/` (JSON), never code. So Muzzy's changes are saved,
versioned in git, readable by Claude, and also editable by hand in Obsidian.
Every panel has **Save** (write to the JSON file) and **Copy for Claude** (a plain-English summary of what changed).

**How tools get made:** a tool is built the first time a game needs it — as a 🔧 tool feature on that game's
roadmap, with proper time given to it — then moved into the shared kit (`dev/tools/bmuz-devkit`) for every
future game. Unity games use Unity's own editor instead.

**In release builds through beta, off at 1.0:** local dev always has the kit. Release builds (the live link) have it while `content/devkit.json` `inReleaseBuilds` is `true` (prototype/alpha/beta — friends testing can open it); /deliver sets it to `false` at the 1.0 full release, and then the live game has no Dev Kit code at all (build-time switch, dead-code-removed; `npm run check:devkit` proves both ways). Release builds have no dev server, so they can't Save: tools show **Copy for Claude** instead, with a note that changes last until a refresh. **Any tool that can affect play** — force dice, level loader, cheats — must be offline-only and disabled in online games.
**Existing games (retrofit):** don't stop everything to add the kit. /tdd lists the recommended tools; each becomes a 🔧 feature on the roadmap, pulled into a sprint when the work in front of us would benefit most (e.g. Multiplayer + Force tools right before a netcode sprint).

## Tier 1 — every game, from the first playable
| Tool | Does |
|---|---|
| **Console** | the ` overlay itself, tabs, quick-action buttons — ✅ built in Roll Better (F60, 2026-09): `src/devkit/` + save endpoint `vite-plugins/devkitSave.ts` + release-build check `e2e/devkit-release-check.mjs` (both ways) + switch `content/devkit.json` |
| **Tuning** | sliders/fields/toggles for any value in `content/tuning/` |
| **Time** | pause · slow motion 0.1×–2× · step one frame |
| **Snapshots** | save "this exact moment" and restore it; jump to any round/level/scene |
| **Bug capture** | ● record · 📍 mark "it happened here" · send → `/bug` with the last ~60 s of events, game state, version, device |
| **Perf** | fps, memory, warnings when something spikes |

## Tier 2 — when a game needs it
| Tool | Does |
|---|---|
| **Animation** | curve editor (ease in/out, bezier, stepped/hold) · timing & spacing · anticipation · overshoot/bounce · follow-through & overlap (child offsets) · squash & stretch · arcs · loop & scrub · named presets in `content/anim/` |
| **Inspector** | click anything in the game → see and edit its values |
| **Color** | palette swatches, pickers, colorblind preview, saved themes — ✅ built in Roll Better (F59, 2026-09): the 15 game-ui kit colours + game colours, live, Save/Copy for Claude, colour-blind preview (saved themes not yet) |
| **Audio** | click an object/event → assign a sound (upload or pick), volume, pitch variance, delay, preview |
| **Layout** | move/resize UI, phone/tablet/landscape frames, safe-area overlay |

## Tier 3 — specific needs
| Tool | Does |
|---|---|
| **Force & cheat** | force dice/card results, lock the random seed, give items, skip ahead |
| **AI** | bots play for you, AI-vs-AI at 10×, personality sliders |
| **Multiplayer** | open a second player, simulate lag/disconnect |
| **Content tables** | spreadsheet editing of cards/levels/units in `content/data/` |
| **Text & accessibility** | live-edit strings, extra-long fake translations, reduced motion, text scale |
| **Capture** | clean screenshots/GIFs for devlogs and store pages |
| **Feel** | screen shake, hit-stop, camera kick presets |

**Built so far** (move into `dev/tools/bmuz-devkit` when a second game needs them): Console + Color — Roll Better `src/devkit/`. Game-specific bits to split out when moving: the table-colour rows (`content/ui/table.json`, `src/store/tableColors.ts`) and the `document.title` game name.

Add new tools to this catalog as games discover the need.
