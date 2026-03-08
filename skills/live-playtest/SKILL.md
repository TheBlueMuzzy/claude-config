---
name: live-playtest
description: Watch a live multiplayer game session by monitoring browser console logs via Playwright. Use when Muzzy is playtesting an online game and wants Claude to observe, summarize rounds, and flag issues in real-time. Works with any Vite + PartyKit (or similar WebSocket server) game.
allowed-tools: Read, Grep, Glob, Bash, AskUserQuestion
allowed-mcp-tools: plugin_playwright_playwright__browser_navigate, plugin_playwright_playwright__browser_evaluate, plugin_playwright_playwright__browser_console_messages, plugin_playwright_playwright__browser_snapshot, plugin_playwright_playwright__browser_tabs
---

# Live Playtest Observer

Watch Muzzy play a multiplayer game and report what happens from the game logic perspective.

## When to Use
- Muzzy says "watch me play", "observe this session", "check the logs"
- During `/gsd:verify-work` for multiplayer features
- Any time Muzzy wants a second pair of eyes on a live game session

## Setup

### Step 1: Get Connection Info
Ask Muzzy (if not provided):
1. What URL is the game running on? (e.g., `http://localhost:5174`)
2. What's the room code? (e.g., QRPD)

### Step 2: Open Playwright to the Game URL
Navigate Playwright to the Vite dev server URL. Do NOT join the game or click anything — just open the page. The browser console captures logs from all tabs on that origin, including Muzzy's active game tab.

```
browser_navigate → http://localhost:<port>/
```

### Step 3: Wait for Muzzy to Play
Don't poll continuously. Wait for Muzzy to say "check now", "just finished a round", "game's done", etc.

### Step 4: Pull Console Logs
Use `browser_console_messages` with level `info`. If output is too large (it will be), it saves to a file automatically.

### Step 5: Filter for Game Events
Grep the saved log file for these key patterns (adapt per game):

**Roll Better patterns:**
| Pattern | Meaning |
|---------|---------|
| `round_start` | New round began, includes goal values |
| `setRollResults] goal` | Player rolled dice, shows locks and pool changes |
| `phase_change` | State machine transition (idle/rolling/locking/unlocking/scoring) |
| `scoring —` | Round winner(s) and points |
| `session_end` | Someone hit the win condition |
| `player_joined` / `player_left` | Connection events |
| `restart` | Play Again triggered |
| `unlock_result` | Player unlocked dice |

**Generic WebSocket game patterns:**
| Pattern | Meaning |
|---------|---------|
| `[useOnlineGame]` | Client-side multiplayer hook events |
| `phase_change` | Game state transitions |
| `player_lock_result` / equivalent | Server responses to player actions |
| `error` | Any error messages |

### Step 6: Summarize in Plain English
Report to Muzzy:
- How many rounds played
- Who won each round (translate player IDs to names if possible)
- Any errors, stalls, or unexpected phase transitions
- Whether reconnection / host migration / play-again flows worked
- Anything that looked off

## What Doesn't Work (Don't Try These)
- **Starting a second PartyKit dev server** — port is already in use by Muzzy's server. A second instance binds but doesn't get the traffic.
- **Passive WebSocket spectator** — connecting a raw WebSocket to `ws://localhost:1999/party/<room>` gets a `connected` ack but receives no broadcasts. Server only broadcasts to players who sent a `join` message.
- **Joining as a player** — would affect the game (extra player slot, receives game_starting, etc.)

## Adapting for Other Games
This skill works for any game where:
1. The client runs in a browser (Vite/webpack dev server)
2. Game events are logged to `console.log` with identifiable prefixes
3. Playwright can reach the same origin

For a new game, ask Muzzy what log prefixes to watch for, or scan the console output for patterns during the first round.

## Integration with GSD
- Can be used during `/gsd:verify-work` for multiplayer phases
- Log findings as issues if bugs are spotted
- Note edge cases for future testing in the project MEMORY.md
