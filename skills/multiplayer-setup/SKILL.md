---
name: multiplayer-setup
description: Set up online multiplayer for your game — room codes, matchmaking, real-time sync. Covers Colyseus (web), Unity Netcode + UGS (Unity), and Playroom Kit (quick P2P). Use when adding online play to any game.
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
| Turn-based web | React/Vite | **Colyseus** (authoritative server, schema sync) |
| Real-time web | R3F/Three.js | **Colyseus** or **Playroom Kit** (P2P, faster setup) |
| Turn-based Unity | Unity | **Netcode for GameObjects + UGS** (Lobby + Relay) |
| Real-time Unity | Unity | **Netcode for GameObjects + UGS** or **Photon** |
| Quick prototype | Any web | **Playroom Kit** (least code, P2P, free) |

## Step 2: Implement (based on chosen stack)

### For Web Games (Colyseus)

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
