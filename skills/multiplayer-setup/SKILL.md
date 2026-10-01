---
name: multiplayer-setup
description: Set up online multiplayer for your game — room codes, matchmaking, real-time sync. Covers PartyServer + wrangler on Muzzy's own Cloudflare (web default, free, used by Glyphtender; PartyKit legacy for Roll Better), Colyseus (self-hosted web), Unity Netcode + UGS (Unity), and Playroom Kit (quick P2P). Use when adding online play to any game.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, WebSearch
---

# Multiplayer Setup

Set up multiplayer for: $ARGUMENTS

## What This Does

Adds online multiplayer to your game. Players can create rooms with codes,
invite friends, and play together in real-time. Covers the full stack:
authentication, lobbies, connection, state sync, and disconnect handling.

## Step 1: Choose Your Stack

Ask the user about their game:
1. What engine/framework? (React/Vite, R3F/Three.js, Unity)
2. How many players? (2, 3-4, 5+)
3. Real-time or turn-based?
4. Do players need accounts, or is anonymous fine?

### Recommendation Matrix

| Game Type | Framework | Recommended Stack |
|-----------|-----------|-------------------|
| Turn-based web | React/Vite | **PartyServer + wrangler** on Muzzy's Cloudflare (default: free, authoritative server, proven in Glyphtender) |
| Real-time web | R3F/Three.js | **PartyServer** (watch the daily request limit) or **Playroom Kit** (P2P, faster setup) |
| Web, needs a big always-on server | Any web | **Colyseus**, self-hosted (Colyseus Cloud has **no free tier**, from $15/month) |
| Turn-based Unity | Unity | **Netcode for GameObjects + UGS** (Lobby + Relay) |
| Real-time Unity | Unity | **Netcode for GameObjects + UGS** or **Photon** |
| Quick prototype | Any web | **Playroom Kit** (least code, P2P, free) |

## Step 2: Implement (based on chosen stack)

### For Web Games (PartyServer on Muzzy's own Cloudflare — the default since 2026-10-01)
PartyKit's shared `*.partykit.dev` zone is FULL — new projects can't deploy there (10,000-domain limit, 2026-09-30).
Roll Better keeps working on it; every NEW game uses **PartyServer** (PartyKit's open-source successor) deployed with
**wrangler** to Muzzy's own free Cloudflare account → `<game>.joebrogno.workers.dev`. Each room = one Durable Object,
same `/parties/main/<code>` path PartySocket already uses, so the client code is unchanged. Proven in Glyphtender (TDD D46).
**Free tier** (see `~/.claude/references/indie-toolkit.md`): ~100k requests/day; every WebSocket message counts.

**Setup (the Glyphtender pattern):**
```bash
npm install partysocket partyserver && npm install -D wrangler
```
- `wrangler.json` (plain JSON, so the client can import its dev port): `name`, `main: "party/worker.ts"`, `compatibility_date`,
  `durable_objects.bindings: [{ name: "Main", class_name: "Main" }]`, `migrations: [{ tag: "v1", new_sqlite_classes: ["Main"] }]`
  (SQLite-backed = free plan), `dev: { port: <unique per game>, ip: "0.0.0.0" }`. Text assets (word lists) → `rules: [{ type: "Text", globs: ["**/*.txt"] }]`.
- `package.json`: `"party:dev": "wrangler dev --persist-to .wrangler/state-dev"`, `"party:deploy": "wrangler deploy"`. Gitignore `.wrangler/`.
- One-time: Muzzy runs `! npx wrangler login` (free account, no card).

**Files to create:**
```
party/worker.ts            # class Main extends Server (partyserver) → hands each room to the game's room class; default export fetch → routePartykitRequest
party/server.ts            # the room itself (framework rooms module RoomServer) — knows nothing about Cloudflare, testable with fakes
party/liveConnections.ts   # the server's OWN live-socket list (see gotchas)
src/rooms/...              # framework rooms module (create/join, identity, rejoin, host migration) — dev/framework/rooms
```
- **Server is authoritative**; the same pure engine runs on client and server. Each player gets their OWN view (hidden info stripped) — test every view for secrets.
- **Room code = room name.** `new PartySocket({ host, room: code, id })` with a stable per-tab id + a persistent player id (localStorage) to reclaim a seat.
- **Timing:** animation timing on the clients; server timers only for backstops (turn timer, bot takeover).

**Gotchas (each cost us a bug):**
- **Late close on reconnect:** a phone that reconnects reuses its id and its NEW socket can open before the OLD one's close arrives; PartyServer's
  connection list then forgets the new socket too → seat marked away → a bot takes it. Keep the server's own `LiveConnections` (forget a socket only if it's still the live one) and wire `onError` too.
- **Eviction:** an empty in-memory Durable Object is evicted after ~1–2 min — "keep the empty room for 5 min" is an upper bound, not a promise.
- **Local storage lock:** two `wrangler dev` processes sharing `.wrangler/state` crash with `SQLITE_BUSY`. EVERY local instance gets its own
  `--persist-to` folder: party:dev → `.wrangler/state-dev`, /play → `.wrangler/state-play`, each e2e run → `.wrangler/state-e2e-<port>`.
- **Ports:** each game has its own dev port (Roll Better 1999, Glyphtender 1997); e2e runs start their OWN servers on other ports and never kill anyone else's.

**Run and deploy:**
- Local: `npm run dev` + `npm run party:dev`. Don't set `VITE_PARTY_HOST` locally (the client uses the page's host + wrangler.json's dev port).
- Deploy: `npm run party:deploy` → `<game>.joebrogno.workers.dev`. Only when `party/` (or the shared engine) changed — **server first, then the site**.
- The front-end build (deploy.yml) sets `VITE_PARTY_HOST: <game>.joebrogno.workers.dev`; unset = "Play online" hidden on live.
- Record the run/deploy lines in STATE Key facts.
- Legacy (Roll Better only): `partykit.json` + `npx partykit deploy` on the shared zone still works for projects that already have their address.

### For Web Games (Colyseus, self-hosted)
Use it only when Cloudflare's free limits don't fit. It needs an always-on server that you host yourself: **Colyseus Cloud has no free tier.**

**Server setup:**
```bash
npm create colyseus-app@latest game-server
cd game-server && npm install
```

**Key concepts:**
- **Room**: A game session (like a lobby)
- **Schema**: Shared state that auto-syncs to all clients
- **onMessage/broadcast**: Custom events between clients

**Architecture:**
```
[Client A] ←→ [Colyseus Server] ←→ [Client B]
                    ↕
              [Room State]
              (authoritative)
```

**Files to create:**
```
server/
├── src/rooms/
│   ├── GameRoom.ts      # Room lifecycle (onCreate, onJoin, onMessage, onLeave)
│   └── GameState.ts     # Schema-decorated state (auto-syncs)
├── src/index.ts          # Server entry, register rooms
client/
├── src/multiplayer/
│   ├── NetworkManager.ts # Connect, join, leave, send messages
│   ├── RoomState.ts      # Client-side state listener
│   └── types.ts          # Shared message types
```

**Room code flow:**
1. Host creates room → gets room code
2. Guest joins with code → enters room
3. Server validates moves → broadcasts state changes
4. On disconnect → offer AI takeover or pause

### For Unity Games (Netcode + UGS)

**Packages needed:**
- `com.unity.netcode.gameobjects`
- `com.unity.services.authentication`
- `com.unity.services.lobby`
- `com.unity.services.relay`

**Architecture (from Glyphtender):**
```
[Host Client] ←→ [Unity Relay] ←→ [Guest Client(s)]
     ↕                                    ↕
[Game Logic]         Lobby API        [Game Logic]
(authoritative)    (room codes)       (receives RPCs)
```

**Key patterns (proven in Glyphtender):**
- **Host-authoritative**: Host validates all moves before broadcasting
- **Relay for NAT traversal**: No port forwarding needed
- **Room codes via Lobby service**: 6-character codes, easy sharing
- **Client-player mapping**: Client ID 0 = Host, 1+ = Guests
- **NetworkVariable + RPC**: Sync state changes to all clients

**Critical fix (from Glyphtender v778):**
Host MUST call `StartHost()` immediately after relay allocation,
then wait 1 second before sharing join code. Prevents "join code not found"
on different networks.

**Files to create:**
```
Assets/Scripts/Network/
├── NetworkManager.cs          # Connection lifecycle
├── LobbyManager.cs           # Room creation, joining, room codes
├── RelayManager.cs            # NAT traversal setup
├── NetworkGameBridge.cs       # RPC handling, move validation
├── NetworkMessages.cs         # Serializable message structs
└── RematchManager.cs          # Post-game rematch flow
```

### For Quick Prototypes (Playroom Kit)

```bash
npm install playroomkit
```

**Simplest possible multiplayer (5 lines):**
```typescript
import { insertCoin, onPlayerJoin, myPlayer } from 'playroomkit';
await insertCoin(); // Shows join screen automatically
onPlayerJoin((player) => { /* new player connected */ });
myPlayer().setState('position', {x: 0, y: 0});
```

## Step 3: Handle Edge Cases

**Every multiplayer game needs:**
- [ ] Disconnect detection (heartbeat/timeout)
- [ ] Reconnection attempt
- [ ] AI takeover option on disconnect
- [ ] Forfeit handling
- [ ] Rematch flow
- [ ] Player count validation (wait for all players)
- [ ] Host migration (if host leaves) OR "host left, game over"
- [ ] Latency compensation (for real-time games)
- [ ] Cheat prevention (validate on server/host)

## Step 4: Report to User
```
MULTIPLAYER READY

Stack: [chosen stack]
Players: [2-4] supported
Type: [turn-based / real-time]

HOW TO TEST:
  1. Open game in 2 browser tabs (or 2 devices)
  2. Tab 1: Create a room → get code
  3. Tab 2: Join with code
  4. Play a full game through

ROOM CODE FLOW:
  Host creates → gets "ABC123" → shares with friend →
  Friend enters code → connected → game starts

WHAT HAPPENS IF SOMEONE DISCONNECTS:
  [describe based on implementation]
```
