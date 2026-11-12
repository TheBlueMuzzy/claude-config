---
name: bmuz
description: Show Muzzy's game-making menu — the 15 BMUZ commands (the six stages Ideate · Define · Design · Develop · Deliver · Release, views, tools) and, on request, the specialist skills Claude uses behind them. Use when Muzzy types /bmuz, asks "what can you do", "what are my commands", or seems unsure what to do next.
---

# BMUZ — the menu

Print this, then ONE line suggesting the command that fits where the current project is (read `.planning/STATE.md` ▶ RESUME HERE if it exists).

```
STAGES (in order)
  /ideate     Show me what you have — gather the idea, nothing decided yet
  /define     Decide what the game is, on one page — then lock it
  /design     Work out the rules and screens, sketch the risky parts, plan the build
  /develop    "Go" — build the sprint, test it, tune it, check it yourself
  /deliver    Turn each milestone into a build to play and share
  /release    1.0 goes public — stores, launch, first reactions

VIEWS (anytime)
  /ppp        The project planner page — opens in your browser
  /roadmap    What's left and what needs what
  /sprint     What's happening now — my tasks 🤖 and yours 🙋
  /gdd        The game design, one screen   (/gdd what if …)
  /tdd        The engineering plan, one screen   (/tdd what if …)

TOOLS (anytime)
  /play       Run it — desktop + phone links
  /sketch     Try a feel or idea as a quick playable sketch, with knobs
  /save       Commit + push — safe to walk away
  /bug        Report a bug, see the list, or "bug sweep"

IN THE GAME
  ` key       Dev Kit console — tuning, time, snapshots, bug capture…

Plain English works for all of it: "go", "what's next", "it's broken", "save".
Research any time: "has this been done?", "look into …"
Your docs in Obsidian: dev/<game>/.planning/ (STATE.md = where we are)
```

## `/bmuz specialists` (or "what else can you do?")
List the specialist skills — Claude uses these on its own inside the commands; Muzzy never needs to remember them ③ (Claude picks them by judgement; checkup §4 flags one nothing calls ①). Read each skill's `description` in `~/.claude/skills/` (skip the 15 BMUZ skills above and `synced/`), grouped:
- **Design (in /ideate, /define, /design, /develop tuning):** mda-analyze, proto, game-economy, ai-opponent
- **Building (in /develop):** game-ui (every screen, menu and HUD), tuning-setup, game-feel, save-system, audio-setup, multiplayer-setup, externalize-text, localize, systematic-debugging (behind /bug)
- **Releasing (in /deliver, /release):** optimize, accessibility-check, organize-assets
- **Playtesting (in /play):** live-playtest
- **Upkeep (monthly — the session start says when it's due):** checkup, verification-before-completion (behind /develop, /bug, /deliver, /release)
- **Reference packs (automatic):** r3f / three / vite / vitest / web-design
Any skill found that isn't listed → **Other**, so nothing is hidden.

## `/bmuz devkit`
Show `~/.claude/config/bmuz/DEVKIT.md` as a short table: tool — what it does — which tier — whether this game has it yet (from TDD §1).
