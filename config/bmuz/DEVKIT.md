# BMUZ Dev Kit — catalog

Developer tools that live **inside** every web game during development (never in the released build).
Press **`** (or triple-tap on a phone) to open the console. Tabs across the top, one per tool.

**The one rule:** every tool edits **data files** in `content/` (JSON), never code. So Muzzy's changes are saved,
versioned in git, readable by Claude, and also editable by hand in Obsidian.
Every panel has **Save** (write to the JSON file) and **Copy for Claude** (a plain-English summary of what changed).

**How tools get made:** a tool is built the first time a game needs it — as a 🔧 tool feature on that game's
roadmap, with proper time given to it — then moved into the shared kit (`dev/tools/bmuz-devkit`) for every
future game. Unity games use Unity's own editor instead.

**Kept out of the released game:** the kit loads only in development builds (`import.meta.env.DEV`); /deliver's smoke test checks the ` key does nothing on the live build.
**Existing games (retrofit):** don't stop everything to add the kit. /tdd lists the recommended tools; each becomes a 🔧 feature on the roadmap, pulled into a sprint when the work in front of us would benefit most (e.g. Multiplayer + Force tools right before a netcode sprint).

## Tier 1 — every game, from the first playable
| Tool | Does |
|---|---|
| **Console** | the ` overlay itself, tabs, quick-action buttons |
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
| **Color** | palette swatches, pickers, colorblind preview, saved themes |
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

Add new tools to this catalog as games discover the need.
