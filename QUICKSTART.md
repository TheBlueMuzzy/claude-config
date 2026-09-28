# BMUZ-2 — Quick Start

Forget the commands? Type **`/bmuz`**. Or just say what you want in plain English.

## The Double Diamond
```
   problem                        solution
/discover  ◇  /define         /develop  ◇  /deliver
 explore      lock it in       build + tune   release
```
| Stage | Type | You get |
|---|---|---|
| 1. Explore an idea | `/discover` | research, references, the start of the GDD |
| 2. Lock it in | `/define` | GDD (design + scope per release), TDD (engineering plan), **feature map with dependencies** |
| 3. Build it | `/develop` or "go" | the sprint built, tested, tuned, waiting for your "approved" |
| 4. Put it out | `/deliver` | smoke-tested, merged, versioned, released, live link |

More time in 1 and 2 = fewer loops in 3.

## Views (anytime)
| | |
|---|---|
| `/roadmap` | what's left, what's blocking what, "alpha musts 7/9", open bugs |
| `/sprint` | what's happening now — my tasks 🤖 and yours 🙋 |
| `/gdd` | the game design on one screen · `/gdd what if…` to change it |
| `/tdd` | the engineering plan on one screen · `/tdd what if…` to pitch a better way |

## Tools (anytime)
| | |
|---|---|
| `/play` | run the game, desktop + phone links |
| `/save` | commit + push — before `/clear`, bed, or switching machines |
| `/bug` | "the dice pulse forever" → logged P0–P3 · `/bug` = the list · "bug sweep" |
| Esc Esc / "undo that" | undo what Claude just did |

## In the game: press ` for the Dev Kit
Tuning sliders · slow-mo / pause / frame-step · snapshots · ● bug capture · performance — plus animation, color, audio, layout tools as games need them. Everything saves to `content/*.json`, which you can also edit in Obsidian.

## Staying focused (the rule we agreed)
While building a feature: **fix a bug now only if it's P0, it breaks this feature, or it's a two-minute fix in the code being changed.** Everything else gets logged in 10 seconds and fixed in the bug sweep at the end of the sprint. Claude will call it out — you can always say "fix it now".

## How planning works
```
RELEASE     prototype → alpha → beta → 1.0     done = all its musts done
 MILESTONE  v0.3 — Card play feels good
  FEATURE   F08 🎮 Splayed cards   needs: F07 Card hand system
   TASK     🤖 Arc layout · 🙋 stand-in card art · 🤖 tune the spread
```
Feature types: ❓ decision · 🧱 foundation · 🎮 player-facing · ✨ polish · 🔧 Dev Kit tool · 🐞 big bug
Features go: ⏳ waiting → 🟢 ready → 🔨 building → 🎛️ tuning → ✅ done
Bugs: P0 crash/broken live · P1 feature broken · P2 minor · P3 cosmetic

## In Obsidian (vault = Documents/dev)
```
<game>/.planning/STATE.md     ▶ RESUME HERE — read this if you're lost
<game>/.planning/ROADMAP.md   milestones + dependency graph (draws itself)
<game>/.planning/SPRINT.md    what's being built, your 🙋 tasks
<game>/.planning/GDD.md       the design        TDD.md  the engineering plan
<game>/.planning/BUGS.md      the bug list      VISION.md  ideas for later
<game>/content/               the numbers the game reads — edit freely
```
