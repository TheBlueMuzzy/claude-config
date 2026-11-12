# BMUZ-2 — Quick Start

Forget the commands? Type **`/bmuz`**. Or just say what you want in plain English.

## The six stages
```
/ideate → /define → /design → /develop → /deliver → /release
 gather    decide    work out   build      share each   1.0 goes
           (1 page)  + sketch   + tune     milestone    public
```
Research any time: "has this been done?", "look into …"

| Stage | Type | You get |
|---|---|---|
| 1. Gather it | `/ideate` | everything you have, read — per need what's clear, your ideas, what's open ("the game so far") |
| 2. Decide it | `/define` | GDD Part 1: the one-page concept, scope per release — locked |
| 3. Work it out | `/design` | GDD Part 2 (rules, systems, screens, look), sketches for the risky parts, TDD + **feature map with dependencies** |
| 4. Build it | `/develop` or "go" | the sprint built, tested, tuned, waiting for your "approved" |
| 5. Share it | `/deliver` | each milestone smoke-tested, merged, versioned, on its share link |
| 6. Release it | `/release` | 1.0 public on the platforms you pick, first reactions, a look back |

More time in 1–3 = fewer loops in 4.

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
<game>/.planning/BUGS.md      the bug list      (ideas: bottom of ROADMAP.md)
<game>/content/               the numbers the game reads — edit freely
```
