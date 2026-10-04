# The Table: research for the Framework foundation

*2026-10-04 · research only, no project code changed · sources are linked at the end of each section*

**What this is.** This document compares Muzzy's memory of the BlokParty PlayTable system (Zones, Components, PlaySpace, Snapshots, States, Tags) with how established engines handle the same problems. It also checks what Glyphtender and Roll Better already do, and recommends a foundation for the web stack (React + TS, online through a server that sends each player their own view).

**Evidence note.** The local code was read first-hand. The web findings come from official docs, fetched or searched today. A few points come from general engine knowledge and are marked *(general knowledge)*.

---

## 1. Hidden information and ownership

### How others do it
| System | How secrets work | Where it's enforced |
|---|---|---|
| **boardgame.io** | A `playerView(G, ctx, playerID)` function returns the state with secrets removed. The built-in `STRIP_SECRETS` deletes any key called `secret` and every other player's entry in `players`. `playerID` is null for spectators. Moves that need secret data are marked `client: false` so they only run on the server. | Server, per player |
| **Colyseus** | `StateView`: a field marked `.view()` is invisible unless that client's view has been told `.add(thisObject)`. The older `@filter` decorators are **deprecated** (since 0.16). | Server, per client |
| **Board Game Arena** | `getAllDatas($currentPlayerId)` returns only what that player may see. `notifyAllPlayers` is public and goes to spectators too. `notifyPlayer` is private. The docs say: "NO private data must be sent with notifyAllPlayers, as a cheater could see it even if it is not used by the interface." | Server, per player, **including messages** |
| **Unity Netcode** | Server-side "object visibility": `CheckObjectVisibility(clientId)` and `NetworkShow/NetworkHide`. A hidden object is never created on that client. | Server ("interest management") |
| **Tabletop Simulator** | Hand zones show their contents only to their colour. Hidden zones hide from chosen colours. Fog of war hides areas. Tags filter which objects a zone affects. | Mostly **drawing** on each client. TTS has a long history of "see everyone's hand" exploits and visibility bugs. |

### The answer to the key question
**Yes. The standard is "rules declare who may see what, and the server cuts each seat's copy before sending it."** Tags (or zone settings) are where a designer *declares* visibility. They are not where it is *enforced*. Drawing something face-down is only presentation. If the data reached the browser, a cheater can read it. TTS is the cautionary tale: it hides by drawing, and it leaks. Glyphtender already does this correctly (`party/views.ts`: "a modified browser can't show what it never got").

### Pitfalls (where secrets leak even with redaction)
1. **Counts.** "Opponent has 5 cards" is usually public on purpose. Decide it per zone (Glyphtender does: "you may know how many, never which").
2. **IDs.** If a card keeps the same id while it moves from a public place into a hidden one, a client can follow it. Real case: a card game on GitHub (meccg, PR #3232) leaked the order of an opponent's reshuffled deck because hidden cards kept ids that had been public earlier. **Fix:** hidden pieces get stand-in ids for each view, or fresh ids whenever they cross into hidden.
3. **Order.** The order of a hidden hand or deck can leak draw order. Shuffle or sort what you send, or send only "N hidden".
4. **Animations and events.** The message "card X flies from deck to Blue's hand" must itself be cut per seat. In the rooms kit, `broadcastEvent` sends the same event to everyone, so any event that carries a secret must use `sendEvent` per seat instead.
5. **Logs and history.** Glyphtender empties the log until the game ends. That's correct.
6. **Undo and replay.** Undo history holds past secrets. Keep it on the server only.
7. **Random seed.** The seed plus the moves rebuilds the deck. Glyphtender zeroes it.
8. **Derived hints.** "Legal moves" or "can't play" highlights computed from secret data, timing, scores worked out from hidden values. Glyphtender hides Magic for this reason.
9. **Dev tools in live games.** Snapshots, debug panels and console logs must not expose the full state online. Glyphtender already turns Restore off online.
10. **Pass-and-play is different.** Everything is on one device anyway, so hiding there is only drawing plus a handoff screen. That's fine, because nobody is trying to cheat against themselves. Glyphtender's `needsHandoff` is exactly this.

Sources: [boardgame.io secret state](https://github.com/boardgameio/boardgame.io/blob/main/docs/documentation/secret-state.md) · [Colyseus StateView](https://docs.colyseus.io/state/view) · [BGA Game.php (getAllDatas, notify)](https://en.doc.boardgamearena.com/Main_game_logic:_yourgamename.game.php) · [Unity Netcode object visibility](https://docs.unity3d.com/Packages/com.unity.netcode.gameobjects@2.5/manual/basics/object-visibility.html) · [TTS zone tools](https://kb.tabletopsimulator.com/game-tools/zone-tools/) · [TTS hidden-zone leak report](https://tabletopsimulator.nolt.io/533) · [TTS "revealing hands cheat"](https://steamcommunity.com/app/286160/discussions/0/365172547943593291/) · [meccg id-leak fix](https://github.com/wigy/meccg/pull/3232)

---

## 2. Seat and player identity

**Common practice is a clean split between the chair, the person in it, and who is watching.**
- **boardgame.io:** `playerID` is the seat ("0", "1"…). `credentials` is a secret token proving you're allowed in that seat. The first connection for a seat sets it, and later connections must match. A client with no playerID is a spectator: it sees the public state and can't move.
- **Steamworks lobbies:** lobby data (owner-set: mode, map) is kept separate from member data (each user sets their own). Seats or slots are a game-level idea built on top.
- **Jackbox:** there's a fixed number of player slots (4–8). Everyone after that becomes the *audience*, who can vote but aren't needed for the game to carry on. "Spectator" is a role with its own small set of actions.
- **Your rooms kit already does this.** `persistentId` = the person, who owns a seat. `tabId` = this connection. A seat has `kind: human | bot`. A bot takes over a dropped seat, and the person takes it back by making a move.

**Recommendation.**
- Visibility is keyed by **seat**, never by person. That way a bot taking over, a reconnect, or a second tab changes nothing about what's hidden.
- The occupant of a seat (human, bot, or empty) is room business.
- Spectators are "seat = none" and get the public view only. Optionally, the game could allow "spectators see everything after a delay".
- Pass-and-play = several seats on one device, plus a **viewer seat** that switches at each handoff.
- Teams or shared hands later: let a zone say "visible to seats [0, 2]".

Sources: [boardgame.io multiplayer](https://github.com/boardgameio/boardgame.io/blob/main/docs/documentation/multiplayer.md) · [boardgame.io changelog (credentials)](https://github.com/boardgameio/boardgame.io/blob/main/docs/documentation/CHANGELOG.md) · [Steam matchmaking API](https://partner.steamgames.com/doc/api/isteammatchmaking) · [Jackbox audience](https://www.jackboxgames.com/blog/how-audience-play-along-differs-in-each-jackbox-game)

---

## 3. Zones inside zones, with inherited and overridable settings

**Prior art**
- **Unity:** children inherit the parent's position, rotation and scale. "Active" is split into `activeSelf` (my own switch) and `activeInHierarchy` (the real result after the parents) *(general knowledge)*.
- **Godot:** `visible` only counts if every parent is visible. `modulate` (tint) passes to children, `self_modulate` doesn't. `top_level` lets a child opt out of the parent's transform.
- **CSS:** some properties are inherited (text colour) and most aren't (borders). A child can say `inherit` or set its own value. Browser dev tools show the **computed value and where it came from**, and that's what makes the cascade bearable *(general knowledge, MDN)*.
- **TTS:** zones are flat, not nested. Tags on a zone narrow what it affects.

**Pitfalls**
- **Surprise inheritance.** "Why is this hidden?" Because a grandparent says so. CSS and Godot cope by keeping the inherited list *short* and by offering "self-only" variants.
- **Security-relevant inheritance.** Visibility is the riskiest thing to inherit. A sub-zone that accidentally makes things *more public* than its parent is a leak.
- **Performance.** This isn't a real concern at board-game scale (dozens of zones, a few hundred pieces). Just work out the effective values when asked.

**Best pattern for us**
- Keep a **small, fixed list of inheritable settings**: owner seat, visibility, and maybe "interactive". Everything else (layout, accepts, size) is per zone.
- Every zone has a value that is either "inherit" or its own.
- The Dev Kit shows the **effective value + "from: Blue's area"**, like browser dev tools do.
- **Making something more private than its parent is always allowed. Making it more public must be spelled out.** For example, a "public row" inside a player area has to say `visibility: everyone` explicitly, and the redaction test checks it.

Sources: [Godot CanvasItem](https://docs.godotengine.org/en/stable/classes/class_canvasitem.html) · [TTS zone tools](https://kb.tabletopsimulator.com/game-tools/zone-tools/)

---

## 4. Tags

**Unreal GameplayTags** are the strongest model:
- They're dotted and hierarchical: `Piece.Card.Spell`.
- They're registered in one dictionary, so typos are caught.
- Objects hold a *tag container*.
- `MatchesTag` counts parents (`Piece.Card.Spell` matches `Piece.Card`). `MatchesTagExact` doesn't.
- Queries combine **Any / All / None**, and can be nested.

**Unity tags** are one string per object (too weak). Unity layers are a fixed list of 32 used for physics and cameras. ECS uses "tag components", which are empty markers you query by *(general knowledge)*.

**Recommendation**
- **Yes, hierarchical, but shallow** (2–3 levels): `card`, `card.spell`, `die`, `token.coin`. A parent tag matches its children, so "accepts card" takes spells too.
- **One registry file**, `content/tags.json`, so the Dev Kit can offer a dropdown and catch typos.
- **Accepts rules** use the three Unreal words in plain English: `accepts: { any: ["card"], none: ["card.huge"] }`, plus an optional `all`. This covers almost everything without becoming a programming language.
- **Keep three things apart** that the PlayTable memory lumps together as "tags":
  1. **What it is** (tags: `card.spell`, abilities `flippable`, `rotatable`). These are static and live in content.
  2. **Who owns it** (a single `owner` field). It has exactly one value, the server's security depends on it, and a typo must not be possible.
  3. **What's happening to it now** (states: face-down, locked). These change during play. See section 7.

Sources: [Unreal Gameplay Tags](https://dev.epicgames.com/documentation/en-us/unreal-engine/using-gameplay-tags-in-unreal-engine) · [MatchesTag](https://dev.epicgames.com/documentation/en-us/unreal-engine/API/Runtime/GameplayTags/FGameplayTag/MatchesTag) · [MatchesTagExact](https://docs.unrealengine.com/4.26/en-US/API/Runtime/GameplayTags/FGameplayTag/MatchesTagExact/)

---

## 5. Drag-and-drop: who decides acceptance, and the feedback

**Prior art**
- **HTML5 drag-and-drop:** the *target* decides, by cancelling `dragover`. `dropEffect` sets the cursor. It **doesn't work on most phones** (it's built on mouse events). Avoid it.
- **react-dnd:** the target declares `accept` (types) and an optional `canDrop(item, monitor)` function. Both the target and the dragged item can read the shared **monitor** (`isOver`, `canDrop`). That's one answer that everyone reads.
- **dnd-kit:** the droppable carries `data: { accepts: [...] }` and the draggable carries `data: { type }`. **One central context** works out what's under the pointer ("collision detection") and hands `active` + `over` to everyone.
- **Unity UI:** `IDropHandler.OnDrop` sits on the target. The item gets `IEndDragHandler`. **TTS:** snap points, and the hand zone's tag filter.

**The pattern they converge on** answers the question "did the zone message the card, or did the card read the zone?" **Neither.** A central drag system owns one answer, and both sides read it:

```
pointer moves → Drag referee: "which zone is under it?" (geometry)
             → "may this piece go there?" = zone.accepts (tags, from content)
                                           AND rules.canDrop(piece, zone, table)  ← changes live with the rules
             → stores ONE verdict: { piece, zone, ok: yes / no / none }
zone highlight ← reads verdict      piece scale-down ← reads verdict      cursor ← reads verdict
```
- The rules hook is how "can't build a house until you have the resources" works: it's re-checked whenever the zone under the pointer changes. It's a pure function of the table, so it's cheap.
- **The server has the final say.** The client verdict is a *prediction* for feedback. The server re-checks the move (`onAction` throws "not allowed"). Glyphtender already works this way.
- Per-frame visuals change refs/DOM directly, never React state. Both games already do this.

**Touch vs mouse**
- **Phones have no hover.** So on **pickup**, light up *every* zone that accepts the piece ("these are your options"). The one under the finger lights *brighter*.
- **The finger covers the target.** Float the piece above the finger, as Glyphtender's `dragLift` does.
- Use a drag threshold so taps aren't drags (Glyphtender's `dragStartDistance`).
- A refused pickup gets the "no" shake (`nope.ts`).
- Use Pointer Events (one code path for finger and mouse). Glyphtender already does.
- **Mouse only:** cursor `grab` / `grabbing` / `not-allowed`, and hover highlights before pickup.
- Tap-tap (tap the piece, then tap the zone) is a good accessibility alternative to dragging, and it uses the same referee.

Sources: [react-dnd useDrop](https://react-dnd.github.io/react-dnd/docs/api/use-drop) · [dnd-kit droppable concepts](https://dndkit.com/concepts/droppable/) · [dnd-kit useDroppable (accepts example)](https://dndkit.com/legacy/api-documentation/droppable/use-droppable/) · [HTML5 DnD on mobile](https://github.com/drag-drop-touch-js/dragdroptouch) · [Unity IDropHandler](https://docs.unity3d.com/Packages/com.unity.ugui@1.0/api/UnityEngine.EventSystems.IDropHandler.html)

---

## 6. Zone layouts (fan, rack, grid, stack, free)

**Prior art**
- **BGA's `bga-cards`** is the closest match to the "Hand module". One card manager, plus *stocks* that differ only in layout:
  - `LineStock` (row)
  - `HandStock` (fan)
  - `SlotStock` (fixed slots)
  - `ManualPositionStock` (free)
  - `Deck` (stack)
  - `AllVisibleDeck` (spread pile)
  - `VoidStock` (off-screen)
  - `DiceStock`

  Moving a card between stocks animates it automatically, and an `isCardVisible` function picks which face shows. It replaced the older `Stock` component.
- **TTS layout zones:** direction, spacing, grouping, sorting, face-up/down, "split decks", "instant refill" are all **settings on the zone**, not code.

**Recommendation.** A layout is a **pure function**: `(how many pieces, zone size, settings) → a position + rotation for each piece`. It has presets (`free`, `stack`, `row`, `fan`, `grid`, `slots`) and settings (spacing, max width → overlap, fan angle, sort, gaps stay or close up). The animation module just tweens pieces to their new spots (the FLIP technique).

So "the same hand, a different layout" means switching one preset in content, and a seed tray (row, slots, gaps stay, which is Muzzy's 2026-10-01 rule) and a mahjong rack (row, sort, groups) become two presets of one zone type. Pure functions make the layouts easy to test and to preview in the Dev Kit with fake piece counts.

Sources: [BGA BgaCards](https://en.doc.boardgamearena.com/BgaCards) · [BGA Stock (older)](http://en.boardgamearena.com/doc/Stock) · [TTS layout zone](https://kb.tabletopsimulator.com/game-tools/zone-tools/)

---

## 7. Snapshots and States

**Snapshots.** Three different things share the word, so keep them apart:
- **Setup / scenario:** a designer-saved starting layout, in `content/setups/`. This matches PlayTable "Snapshots".
- **Save game:** the full state, with a **version number + migrate step**. Glyphtender has `migrate.ts`, and the `save-system` skill does versioned saves.
- **Dev snapshot:** "this exact moment", for bugs and tests. The Dev Kit already has this.

All three are possible only because the state is **plain JSON data**, as Glyphtender's `GameState` is.

**States.** Split by *who needs to know*:
- **Game states** are shared, saved, and go through the server: `faceDown`, `rotation`, `locked`, `exhausted`. **Face-down is also a visibility rule.** A face-down card's identity is cut for every seat (with an optional "owner may peek"). Flipping it is a server action that reveals the identity.
- **Local UI states** are per device, never saved, never sent: `hovered`, `held/dragging`, `selected`, `planned`, `refused (shaking)`. Glyphtender's SeedTray already draws held / planned / waiting this way.
- BGA's stocks have selection modes (none / single / multiple) as a stock setting, which is worth copying for zones.

---

## Recommended architecture for "the Table" (plain English)

**The few core ideas**
1. **Table:** the whole game as plain data. It lives on the server online, and on the device for pass-and-play.
2. **Seats:** the chairs (0, 1, 2…). The rooms kit decides who sits in them (a person, a bot, nobody). Spectators have no seat.
3. **Zones:** places, which can sit inside other zones. Each has an owner seat and a visibility (inherited unless it sets its own), an `accepts` rule, and a layout preset.
4. **Pieces:** cards, dice, seeds, meeples. Each has tags (what it is), an optional owner, and game states (face-down, locked).
5. **Tags:** a short, shallow, dotted list in one file.
6. **The game's rules:** the plug-in that says what moves are allowed (`canDrop`, `onAction`). The Table never knows the game.

**How they talk**
- A player drags a piece. The **drag referee** asks the zone's `accepts` and the rules' `canDrop`, stores one verdict, and the zone glow, the piece scale and the cursor all react to it.
- On drop, an action goes to the server. The server's rules check it and change the Table.
- **The redactor** then builds each seat's view by walking the zones: anything a seat may not see becomes "hidden, with a stand-in id", counts stay or go per zone, and secret events and logs are held back. Only that view is sent.
- The browser draws the view: layouts place pieces, and the animation module moves them.

**Where visibility is enforced: in one place, the server's redactor.** It reads the zone and piece visibility settings, so designers declare visibility and the code enforces it. Pass-and-play uses the same redactor on the device, with the "viewer seat" switching at each handoff. One code path, so it's tested once.

**What the designer edits** (in `content/` + the Dev Kit)
- `tags.json`
- `table.json`: zones, nesting, owner/visibility, accepts, layout preset + sliders (spacing, fan angle, overlap)
- `feel.json`: drop scale-down, highlight style and colour (Roll Better already has tint/outline), pickup lift

Names stay **identical across games**, which is the "same attribute names, game to game" ideal. The Dev Kit shows each zone's *effective* settings and where they came from.

**Build order (slice by slice, only from proven games)**
1. **Slice 1, harvest what exists:**
   - Glyphtender's pointer input (threshold, lift, tap-tap, nope shake) and drop-target glow
   - Roll Better's highlight settings
   - the "secrets out of the data" `viewFor` pattern, made into a reusable redactor with the leak checklist above as **tests**

   Flat zones, owner, visibility, a drag referee.
2. **Slice 2:** layout presets (`row`/slots, `fan`) + animated moves, proven by rebuilding Glyphtender's seed tray on them.
3. **Slice 3:** tags + `accepts` queries, and nested zones with inheritance, but only when the second game actually needs them.
4. **Later:** context menus (right-click / long-press), setups/scenarios, selection modes, teams/shared visibility, fog-of-war-style areas.

**Guard against the inner-platform effect** (building a do-everything system that becomes a worse copy of the programming language underneath):
- Rules stay **TypeScript in the game**, never a rules language in JSON.
- JSON holds *numbers, names and presets*, not logic. `accepts` stops at any/all/none, and anything cleverer goes in `canDrop`.
- Generalise a part only when a **second real game** needs it.

---

## What Glyphtender and Roll Better already have (harvest list)
| Already built | Where | Becomes |
|---|---|---|
| Secrets removed on the server per seat: hidden hands become `?` (count kept), bag hidden, seed and rng zeroed, log empty until the end, derived scores hidden | `glyphtender/party/views.ts` | The **redactor** + leak tests |
| Server plug-in `viewFor(state, seat)`; sender's seat comes from the connection, never from the message | `framework/rooms` | Already Framework, so the Table sits on it |
| Seats: local / online / ai; handoff only between two humans on one device | `glyphtender/src/store/seats.ts` | Seat + viewer-seat for pass-and-play |
| One pointer handler for finger + mouse, drag threshold, lift above finger, tap-tap | `glyphtender/src/game/usePieceInput.ts` | Table input layer |
| Legal targets worked out centrally from the rules (`dropKind` → `boardHighlight`), with the zone glow driven by DOM attributes and no React state | `glyphtender/src/store/turnPlan.ts`, `src/game/dropTarget.ts` | Already the **drag referee** pattern. Add the piece scale-down reading the same verdict |
| Refused tap or drag → "no" shake, with a clear list of refusal reasons | `glyphtender/src/store/nope.ts` | Referee's "no" answer on pickup |
| Tray with held / planned / waiting looks, gaps stay, refresh animation | `glyphtender/src/game/SeedTray.tsx` | First `slots` layout preset + local UI states |
| Drop-zone glow (tint/outline, colour, fade, padding) in `content/tuning/drag.json`, read per frame | `roll-better/src/components/DropZoneHighlight.tsx`, `utils/dropZone.ts` | Highlight settings in `feel.json` (3D version) |
| Versioned state migration | `glyphtender/src/engine/migrate.ts` | Snapshot/save versions |
| Dev snapshots (save/restore/send to Claude; restore off online) | `framework/devkit/kit/snapshots` | Already Framework |

**Missing in both:** tags, `accepts` rules, nested zones, layout presets, and the piece reacting to the drop verdict (only zones glow today). Neither game has piece ids that move between hidden and public, but card games will, so the stand-in id rule must come before the first card game. Note also: the rooms kit's `broadcastEvent` goes to everyone, so it should get a warning (or a per-seat version) before games put secret cues in events.

---

## Where common practice suggests doing it differently from the PlayTable memory
1. **"Ownership and hidden info via tags."** Keep it as the designer's *language*, but enforce it on the server by cutting data per seat, never by drawing. If the PlayTable was one shared device, drawing-only was fine there. Online it isn't. Make owner a single field, not a free tag.
2. **"Zone messaged the card, or the card read the zone?"** Neither. A central drag referee holds one verdict that both read (react-dnd monitor, dnd-kit context). It's simpler to debug, and rules can change the answer live.
3. **"A zone can refuse a tag."** Keep it (as TTS does), but pair the static `accepts` with a rules hook for live conditions, and let the server re-check every drop.
4. **"Drag feedback on hover."** Phones have no hover. Show all valid zones on pickup and float the piece above the finger.
5. **"Sub-zones inherit visibility and can override."** Fine, but inheritance on a *security* setting needs guard rails: making something more public must be explicit, the Dev Kit shows effective values, and redaction tests cover it.
6. **"A seat has its camera and sees what it owns."** The camera is only presentation. *What reaches the seat* is decided by the redactor. Keep seats ≠ player profiles (rooms already does), and add spectators as "no seat".
7. **"One Hand module for seed tray and mahjong rack."** The right instinct (BGA does exactly this), but build it from two real cases, not ahead of them.
8. **"States."** Split shared game states (face-down, locked, which are synced, and face-down also hides) from local UI states (held, selected, hovered, which are never sent).

---

## Summary
1. Industry standard: tags and zones *declare* who sees what, but **the server enforces it** by removing secrets from each seat's copy. Glyphtender already does this right. TTS hides by drawing only, and it leaks.
2. Watch the sneaky leaks: reused piece ids, hand order, animation events, logs, undo, random seed. Make each one a test.
3. Seat ≠ person ≠ spectator: visibility follows the seat, rooms decides who sits there (human/bot), pass-and-play switches a "viewer seat".
4. Tags: short dotted hierarchy (`card.spell`) in one file, "accepts" as any/all/none. Owner is its own field. States (face-down, held) are not tags.
5. Drag: one central referee holds one yes/no verdict (zone tags + live rules) that the zone glow, the piece scale and the cursor all read. Show all valid zones on pickup for phones. The server re-checks.
6. Build slice by slice from Glyphtender/Roll Better (redactor, pointer input, glow, tray → layout presets). Add tags and nested zones only when a second game needs them, and keep rules in code, not JSON.
