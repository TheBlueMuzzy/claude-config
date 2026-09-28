---
name: multiplayer-setup
description: Set up online multiplayer for your game — room codes, matchmaking, real-time sync. Covers PartyKit on Cloudflare (web default, free, used by Roll Better), Colyseus (self-hosted web), Unity Netcode + UGS (Unity), and Playroom Kit (quick P2P). Use when adding online play to any game.
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
| Turn-based web | React/Vite | **PartyKit** (default: free, authoritative server, proven in Roll Better) |
| Real-time web | R3F/Three.js | **PartyKit** (watch the daily request limit) or **Playroom Kit** (P2P, faster setup) |
| Web, needs a big always-on server | Any web | **Colyseus**, self-hosted (Colyseus Cloud has **no free tier**, from $15/month) |
| Turn-based Unity | Unity | **Netcode for GameObjects + UGS** (Lobby + Relay) |
| Real-time Unity | Unity | **Netcode for GameObjects + UGS** or **Photon** |
| Quick prototype | Any web | **Playroom Kit** (least code, P2P, free) |

## Step 2: Implement (based on chosen stack)

### For Web Games (PartyKit, the default)
PartyKit runs each room as a Cloudflare Durable Object: one small server per room code, holding that room's state.
**Free tier** (checked 2026-09-28, see `~/.claude/references/indie-toolkit.md`): ~100k requests/day, and every WebSocket
message counts. Over the limit → errors until 00:00 UTC. Fine for turn-based games; a busy real-time game can hit it.

**Setup (the Roll Better pattern):**
```bash
npm install partysocket && npm install -D partykit
```
- `partykit.json`: `{ "name": "<game>", "main": "party/server.ts", "compatibilityDate": "2024-12-01", "port": 1999 }`
- `package.json` scripts: `"party:dev": "partykit dev"`, `"party:deploy": "partykit deploy"`

**Files to create:**
```
party/server.ts            # export default class GameServer implements Party.Server — onConnect / onMessage / onClose
src/types/protocol.ts      # ClientMessage / ServerMessage types, shared by client AND server
src/utils/partyClient.ts   # PartySocket connection; host = import.meta.env.VITE_PARTY_HOST ?? "localhost:1999"
src/hooks/useRoom.ts       # lobby / room state for React
```
- **Server is authoritative.** It validates moves and broadcasts results (`this.room.broadcast(...)`). Pure game rules live in `src/utils/` so both the server and the client import the same code.
- **Room code = PartyKit room id.** `new PartySocket({ host, room: code, id })`.
- **Reconnects:** pass a stable `id` per tab (sessionStorage) so a reconnect keeps the same `conn.id`, and a persistent player id (localStorage) so a player can reclaim their seat.
- **Timing:** keep animation timing on the clients. Roll Better found server timers unreliable for that (use them only for backstops like AFK timeouts).

**Run and deploy:**
- Local: `npm run dev` + `npm run party:dev` (port 1999). Don't set `VITE_PARTY_HOST` in `.env` for local dev.
- Deploy the server: `npx partykit deploy` → `<game>.<user>.partykit.dev`. Do it by hand, only when `party/` changed, because a front-end release doesn't update it.
- The front-end build (CI or itch) sets `VITE_PARTY_HOST=<game>.<user>.partykit.dev`.
- Long-term option: deploy to Muzzy's own Cloudflare account with no platform fee (`CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… npx partykit deploy`).
- Record the run/deploy lines in STATE Key facts.

### For Web Games (Colyseus, self-hosted)
Use it only when PartyKit's limits don't fit. It needs an always-on server that you host yourself: **Colyseus Cloud has no free tier.**

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
