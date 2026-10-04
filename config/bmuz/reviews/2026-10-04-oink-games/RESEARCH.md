# Let's Play! Oink Games — UI teardown for the Framework
2026-10-04 · research only, nothing in any project changed.
Companion to `../2026-10-04-modules/RESEARCH.md` (the module taxonomy this maps onto).

**How to read the evidence tags**
- **[SEEN]** — I looked at it in a screenshot / GIF frame in `images/`.
- **[DEV]** — the developers said it themselves (Oink's own 6-part "designer notes" on note.com, Japanese, translated by me). This is the best source: it's *why*, not just *what*.
- **[TEXT]** — store pages, official FAQ, patch notes, press/player reviews.
- **[INFERRED]** — my reading of the pictures; not confirmed. Treat as a hunch.

I couldn't play it or watch video frame-by-frame, so exact easing curves and timings are not known. Where the developers posted animated GIFs, I pulled 6 frames from each and read the motion from those.

---

## 1. The product

| | |
|---|---|
| **Name** | *Let's Play! Oink Games* (JP: レッツプレイ！オインクゲームズ). Steam app **1933490**. Apple Arcade edition: *Let's Play! Oink Games+* |
| **Not to confuse with** | "Oink & Collect" (Steam 4436530, Mar 2026) — an unrelated pig-card idle game by a solo dev. Ignore it. |
| **Released** | Switch 16 Dec 2021 (Kickstarter-funded as "Oink Games+", 1,689 backers, ¥6.5M) [DEV] · Steam 6 Jul 2022 (Ver 3.0) [TEXT] · iOS/Android 1 Dec 2022 (Ver 5.1) [TEXT] · PS5 (date not found) · Apple Arcade 3 Sep 2026 [TEXT] |
| **Current version** | 9.2.2 on iOS (22 Sep 2026; save-data fix). Last *new game* was Rafter Five, Dec 2023 [TEXT] |
| **Engine** | **Unity** [DEV — notes #3 talk about building the XD screens "on Unity" and a Unity Learning conference talk]. Core team of **3 programmers + director**, **under one year** [DEV] |
| **Platforms** | Switch, PS5, Steam (Windows only), iOS, Android, Apple Arcade — **full cross-play**, separate saves per platform [TEXT] |
| **Price** | Steam/Switch/PS5 $21.99–24.99 with 7 games; mobile free with Deep Sea Adventure, others as IAP; 5 DLC games $5.99 each; Steam "Complete Edition" bundle = 12 games [TEXT] |
| **Reviews** | Steam all languages: **Very Positive, 81%** (62 up / 15 down). English only: Mostly Positive (8/11). iOS 4.77★ (124). Siliconera 8/10, Nintendo World Report 8.5 [TEXT] |
| **Steam extras** | 53 achievements, full controller support, Remote Play Together, Steam Cloud, 10 languages [TEXT] |

**The 12 games** (base 7 + 5 DLC) and supported play [TEXT, official chart]:

| Game | Kind | Online | Offline | CPU |
|---|---|---|---|---|
| Deep Sea Adventure | dice + push-your-luck track | 1–6 | 1–6 | yes |
| A Fake Artist Goes to New York | drawing + hidden role | 3–8 | 3–8 | no |
| Startups | hidden-hand card majority | 1–4 | solo only | yes |
| Moon Adventure | co-op, action points | 1–5 | 1–5 | you run the bots |
| This Face, That Face? | make-a-face party guessing | 3–8 | 3–8 | no |
| In A Grove | deduction / bluff | 1–5 | solo only | yes |
| Fafnir | gem auction | 1–4 | solo only | yes |
| SCOUT (DLC) | climbing card game | 1–5 | solo only | yes |
| Nine Tiles (DLC) | real-time tile race | 1–8 | 1–4 | yes |
| Make the Difference (DLC) | draw + spot-the-difference | 2–8 | 2–8 | no |
| Kobayakawa (DLC) | betting card game | 1–8 | solo only | yes |
| Rafter Five (DLC) | 3D stacking/balance | 1–8 | 1–8 | yes |

Business twist worth knowing: **"Trial play"** — if one player at a table owns a game, everyone else at that table plays it free (the free mobile app is the guest client) [TEXT]. The lobby shows each seat as "Play" (owns it) or "Trial" ([`images/ios-table-lobby.png`](images/ios-table-lobby.png)) [SEEN].

---

## 2. Where the reuse came from (the developers' own story) [DEV]

This is the most useful part for Muzzy, because it's a small team doing exactly what the Framework is trying to do.

1. **They already had a shared base** from their previous Switch game (*Torakichi's Tora Kitchen*): **save data, sound playback, "master data" (game data tables), UI system, and an automatic build pipeline** (CI that builds Switch/iOS every few hours). They say this base is *why* a 3-person team shipped in under a year. → Same idea as our Foundations.
2. **Designer files became the real UI.** The UI was drawn in Adobe XD; programmer kyubuns wrote a converter so **the XD file *is* the final in-game UI** — "one screen update takes 5 seconds instead of hours". No hand re-building screens. → Same idea as Muzzy's `content/` + Dev Kit: the designer edits the real thing.
3. **Rules code was written so animations can be slotted in between steps** ("a flexible way of writing rules so we can insert presentation in the middle"). → Same as our Game core + event stream.
4. **One director sketch per game → one UI/motion person finishes it.** Jun Sasaki draws a single concept image of the layout; Yoshihiro Shindo (3D, UI, animation, effects) builds every game's screens and motion. One pair of hands = one family feel.
5. **Fixed shared UI rules**, decided once while building the first two games (Startups, Deep Sea), then reused on all later games: "your turn" banner, "you = yellow", "selectable = yellow frame", "instructions = white text on black". They explicitly say these rules "paid off hugely" on the more complex later games (Moon Adventure, Fake Artist).
6. **Design philosophy:** "The 3D table is real; the UI sits on top like mixed-reality (XR) glasses." Keep the information light, never hide the physical-looking table. Camera at the angle you'd see when *sitting at a real table*.
7. **Deliberately left out:** world rankings/leaderboards ("nobody cares about world rankings at a friend's house"), and in-game voice — they assumed people use Zoom/Discord. Text chat exists but **emotes turned out to carry almost all communication** (and pass parental controls).

---

## 3. What is identical across every game (the shared kit)

### 3.1 The screen frame (HUD layout) [SEEN across all 12 game screenshots]
Every game screen uses the same four-corner frame; only the middle (the table) changes.

| Zone | What's there in every game | Images |
|---|---|---|
| **Top-left** | Dark rounded "tab" hanging from the top edge: **ROUND x/y**. Next to it a matching **TIME** tab. The timer tab gets a **yellow outline + yellow number** in some shots (Deep Sea, Startups, In a Grove, Moon) and is plain in others (Make the Difference) — [INFERRED] yellow = *your* clock is running. Games without rounds show their own counter in the same slot (Rafter Five's "28 pieces left"). | [`steam-deep-sea-adventure.jpg`](images/steam-deep-sea-adventure.jpg), [`steam-in-a-grove.jpg`](images/steam-in-a-grove.jpg), [`steam-make-the-difference.jpg`](images/steam-make-the-difference.jpg) |
| **Top-right** | Fixed icon cluster: **menu** (☰ in a rounded square), a **log/list** icon, a **controller prompt** (Y on Steam/Xbox layout, face-button icon on Switch), and a white **speech bubble "…" = emotes/chat**. Some games add **"?" = rules reference** (Moon, SCOUT) and Switch shows **"−/+" = zoom**. | [`steam-moon-adventure.jpg`](images/steam-moon-adventure.jpg), [`steam-scout.jpg`](images/steam-scout.jpg), [`site-deep-sea-emote-bubble.jpg`](images/site-deep-sea-emote-bubble.jpg) |
| **Top-centre** | **Messages**: "Your Turn" (black pill, yellow outline, yellow text), rule reminders ("The Kobayakawa helps the lowest number", "Due to a monopoly, you cannot take that card"), and in some games a progress strip ("Tam's spot the difference ● 3/3"). | [`steam-moon-adventure.jpg`](images/steam-moon-adventure.jpg), [`steam-kobayakawa.jpg`](images/steam-kobayakawa.jpg), [`steam-startups.jpg`](images/steam-startups.jpg) |
| **Bottom-centre** | **What to do now**: black pill, white text ("Please choose a card to take.", "Choose where to place your chip.", "Choose a rafter to pick up"). In Rafter Five the pill also carries the **acting player's avatar** on its left and (Switch) a row of **step dots**. | [`steam-in-a-grove.jpg`](images/steam-in-a-grove.jpg), [`site-rafter-five-switch-prompts.png`](images/site-rafter-five-switch-prompts.png) |
| **Right edge** | **Action choices** slide in as big white pills from the screen edge ("Do Nothing" / "Drop"). | [`steam-deep-sea-adventure.jpg`](images/steam-deep-sea-adventure.jpg) |
| **Sides** | **Player panels** (see 3.2). | all |

The developers' rule [DEV]: *selectable things get an animated yellow frame; the thing you should do next is always written white-on-black.* Because the system (not the player) drives the flow in digital, players "lose track of what they're supposed to do" without that line.

### 3.2 The player panel ("seat chip") — the most reused element [SEEN]
Exactly the same construction in all 12 games:

- **Round avatar** with a thick white ring (icon picked from a library of cartoon faces/animals).
- A **dark translucent pill** ("capsule") joined to the avatar — on the avatar's right for left-side seats, mirrored for right-side seats. It holds the **headline number** (score, coins, 0/5 points, 0/30 target, 0/3 fallen).
- **Name** in small bold white text under the avatar.
- **You** = name in **yellow** and the capsule gets a **yellow outline** — in *every* game, the lobby list, and the final ranking ([`dev-me-is-yellow.png`](images/dev-me-is-yellow.png)) [SEEN + DEV: "on every screen, me = yellow" was a rule they added after testers kept confusing themselves with others].
- **Whose turn** = a **white vertical bar** to the left of that player's row, plus the avatar gently **growing and shrinking** (pulse) [DEV + SEEN in Deep Sea, In a Grove, SCOUT]. The devs admit the pulse alone "wasn't as effective as hoped" because players look at the board, not the side panel — but they kept it because "there should always be one place you can look in any game."
- **Leader** = small **crown** above the capsule (added in Ver 2.0 for Deep Sea & Startups; also seen in This Face, In a Grove) [TEXT + SEEN].
- **Role tag** = coloured pill on the avatar when the game has roles: "Guesser"/"Face Maker" (This Face), "Mechanic"/"Athlete"/… (Moon, purple tag above), "Artist"/"Fake Artist" (Fake Artist result) [SEEN].
- **Status tag** = small white bubble above the avatar: "Thinking…" (考え中) [SEEN in [`dev-this-face-speedlines-result.png`](images/dev-this-face-speedlines-result.png)].
- **Emote** = speech bubble popping off the avatar (or off the player's *piece* on the board — angel emoji over a meeple in [`site-deep-sea-emote-bubble.jpg`](images/site-deep-sea-emote-bubble.jpg)) [SEEN].
- **Game-specific "attachments"** sit next to the capsule, so each game adds what matters without changing the chip:

| Game | Extra info clipped to the seat chip [SEEN] |
|---|---|
| Deep Sea | the meeple in that player's colour (left of avatar) + the treasure chips they carry (right) |
| Startups | coins as number *and* a real pile of coin chips on the table next to them |
| Moon | role tag + an oxygen-tank track with tank cards and supply slots |
| In a Grove | their detective chip colour + three suspect-shaped tiles showing what they've seen |
| SCOUT | show-money + score ("5 \| 0"), their Scout&Show token, a fan of card backs = hand size |
| Nine Tiles | **a live mini 3×3 of their current tiles** — you watch rivals solve in real time ([`steam-nine-tiles.jpg`](images/steam-nine-tiles.jpg)) |
| Fafnir | "0/30" + gem count; chips run along the bottom ([`steam-fafnir.jpg`](images/steam-fafnir.jpg)) |
| Kobayakawa | coin count + their current bet, seat placed at their own card |
| Rafter Five | fallen-meeple count (red, x/3) + a cargo-colour square + count |
| This Face | role tag + score; guessers' avatars pin onto the answer card they picked ([`steam-this-face-that-face.jpg`](images/steam-this-face-that-face.jpg)) |

**Many players** — same chip, four layouts [SEEN]:
1. **Left column** (up to 5–6): Deep Sea, In a Grove, SCOUT, Moon.
2. **Left + right columns** (4–8): Fake Artist, This Face, Nine Tiles (8), Rafter Five (6).
3. **Bottom row** (4–8): Fafnir (4), Make the Difference (8 — the current "puzzle maker" is split off with a thin divider).
4. **Seated around the table** — chip placed at the player's real seat: Startups (4 corners), Kobayakawa (8 around a fan).

### 3.3 Lobby, table and matchmaking [SEEN + TEXT]
- **Main screen = a shelf of real game boxes** on a wooden table with a blurry, lively café behind it ([`site-game-shelf.png`](images/site-game-shelf.png)). [DEV] "Why is it backlit?" was the most-asked question; the idea is *the people playing behind the boxes are the star, not the box.*
- Under the box: **time / players / age icons** and **Rule Difficulty ★★☆**, designer credit, an **(i)** that **zooms to the back of the box** (rules summary like a real box back). A strip of game icons + a grid-view button to jump between games. Buttons: **Let's Play! · How to Play · Select multiple** (match me into *any* of several chosen games — Ver 5.1) [SEEN + TEXT].
- **Table lobby** ([`ios-table-lobby.png`](images/ios-table-lobby.png), [`dev-emote-picker-and-find-table.png`](images/dev-emote-picker-and-find-table.png)): left = **Player list "8/8"** with avatar + name pill (you yellow) + status button (Play / Trial); **CPU +/−** buttons at the bottom; centre = the box with **medals** (three badges) under it and the table's settings ("Time Limit: 30 sec", "Game Mode: Answer Anytime"); right = **With Friends / Code: CHP110 (hide-code eye toggle) / Copy code / How to Play / Game Options / Start Game**. Emote picker = a two-row tray of emoji-style stickers along the bottom.
- **Find a Table**: list of tables with stacked avatars, "In game 6/7" — you can **join a running game** to watch and enter next round (Ver 2.0) [TEXT].
- Modes: Online "With Anyone" / "With Friends" (code), Offline solo vs CPU, offline **one-device multiplayer (one controller passed around, or several)**, local wireless [TEXT].
- **Drop-out = CPU takes the seat silently; rejoin resumes the exact state.** "To everyone else it looks like you never left" [DEV].
- Social safety: block list (blocked players' tables hidden), host can turn text chat off, parental controls → emotes only, 10-second cool-down between public games [TEXT].

### 3.4 Profile and identity [TEXT + SEEN]
- Name + **icon** chosen from a library; **icon colour** too. New icons **unlock at random after playing** (each new game adds 2–6 themed icons) [TEXT, patch notes 3.0–9.0].
- **Your piece colour follows your icon colour** when possible ("a programmer quietly implemented it so you get your favourite colour") [DEV].
- **Medals** per game (Ver 6.0): earned for conditions, shown on the box in the lobby and in the player list — so strangers see your experience [TEXT + SEEN].
- **History** saved (Ver 3.0), friends list shows detailed play status, "users you have played with" fed to the Switch friend system [TEXT].
- Note: what Muzzy remembers as "profiles that hold lots of information" is, from the evidence, mostly the **in-game seat chip** (avatar + score + role + crown + turn bar + emote + per-game attachments). I found no evidence of a big profile *screen* with stats. [INFERRED]

### 3.5 Results [SEEN + DEV]
- **Shared ranking screen**: big rank number · avatar · name pill, stacked 1–6, you outlined in yellow ([`dev-me-is-yellow.png`](images/dev-me-is-yellow.png), right panel).
- **Plus a per-game "hero" result** designed to be screenshotted and shared:
  - Fake Artist: the group drawing **hung in a gilded museum frame** under a spotlight, voters' mini-avatars stacked on whoever they accused, "Fake Artist wins!!" banner, and a **button that hides the answer** so you can post "guess what this is?" ([`dev-fake-artist-museum-result.jpg`](images/dev-fake-artist-museum-result.jpg)) [DEV: made for streamers/SNS].
  - This Face: the finished face beside the line it was meant to say, on **manga speed-lines** ([`dev-this-face-speedlines-result.png`](images/dev-this-face-speedlines-result.png)) [DEV: "the answer-check moment — 'oh yeah, it *does* say that'"].
- Offline: **every player with a controller must press OK** before moving on (Ver 2.0) — so nobody's result gets skipped [TEXT].
- Ties: This Face gives equal places on purpose ("losing on a tie hurts more than winning feels good"); serious games (Startups) break ties [DEV].

### 3.6 How to Play / onboarding [TEXT + DEV]
- Every game has the same **How to Play** entry (shelf and lobby) → **short, tightly edited rules videos** "that get right to the point" [TEXT, Siliconera].
- **Rule Difficulty stars**, playtime and player-count on the box so you choose an easy one first [SEEN].
- **In-game "?"** opens the rules reference (Moon, SCOUT) [SEEN].
- **Rule reminders in the top banner** at the moment they matter ("Within the 3 suspects, the tile with the highest value is the criminal. However…", "Numbers used for 4 players: 2 3 4 5 6 7 8 X") [SEEN] — teaching by the table, not by a manual.
- **Live scoring rules printed on the table** (Fafnir: "#1 Gem = 3 points … Other Gems = −1 point") [SEEN].
- **The CPU is the tutorial**: tuned "intermediate — beats a beginner, loses once you learn a trick — so beating it means you're ready for online" [DEV].
- A starting **ritual** instead of a lecture (see 4.4).
- Steam reviewers: "rules are very well explained", "easy to learn the game rules" [TEXT].

### 3.7 Colour, type and materials [SEEN unless marked]
- **One accent colour does all the meaning: yellow** = you / your turn / selectable / your timer / primary button ("Finished", "Let's Play!"). [DEV] Black-and-yellow was chosen for "Your Turn" "so it stands out on any game's screen".
- **Black pill + white text** = instruction. **White pill + dark text** = choice/button. **Dark translucent pill** = data (scores, counters). Per-game coloured pills only for big phase moments (pink "Who is the fake artist?", green "If you find it, touch here!").
- **Rounded, heavy, slightly letter-spaced sans** for everything [INFERRED typeface family; not named anywhere].
- **Per-game background = a full-bleed "tablecloth"** with its own colour: water caustics (Deep Sea), pink felt (Fake Artist), teal felt with the logo printed in (Startups), grey moon dust (Moon), green paper (This Face), deep-blue felt (In a Grove), sunbursts (Fafnir, SCOUT), red felt (Kobayakawa), ocean (Rafter Five). This is the main per-game identity.
- **Pieces are honest 3D replicas** of the physical components — wood grain on meeples, embossed linen texture on cards, the punch-nick on cardboard chips [DEV]. Spare chips are kept on the table as objects, not just numbers ("money you can see piled up matters") [DEV].
- **Accessibility**: in Fake Artist each player's line carries their **turn number repeated inside the stroke**, so colour isn't the only cue ([`steam-fake-artist.jpg`](images/steam-fake-artist.jpg)) [SEEN + DEV]. Press called it out as colour-blind friendly [TEXT].

### 3.8 Sound [DEV + TEXT]
- A dedicated **"your turn" sound** so you notice even when looking away.
- **Per-game music**, chosen to be low-key (play your own music if you like); later party games got punchier music on purpose.
- Small care: pen-touch-down vs drawing have different sounds; music **resumes from where it was** when you leave a table instead of restarting.

---

## 4. Motion language

### 4.1 The rules they set themselves [DEV]
- **3D objects never scale.** "Real things don't grow or shrink" — so pieces move, slide, rotate, flip, fall; they don't pop bigger. **UI is allowed to scale** (the avatar pulse, choice bubbles).
- **No over-the-top digital effects.** But they discovered a faithful copy felt "flat and monotonous" — the fix was **camera moves and small signature animations at key moments**, which they call the turning point of the whole project.
- **Change the whole picture when the phase changes.** People read "a new phase" from the overall look of the screen; if only a small thing changes, they miss it. So each phase deliberately shows/hides different cards and parts.

### 4.2 Camera [DEV + SEEN]
- Default framing = **seated-at-the-table 3/4 view**, not top-down.
- **Zoom-in on the dramatic moment**: Deep Sea's shared air marker dropping (a tiny marker that is "a huge event for players" — camera pushes in so the feeling matches) ([`dev-camera-zoom-air.jpg`](images/dev-camera-zoom-air.jpg)); Startups' anti-monopoly chip being placed and cards hitting the table.
- **Small zoom when your turn starts** + the deck lifts slightly, so the screen visibly changes ([`dev-your-turn-banner-and-zoom.jpg`](images/dev-your-turn-banner-and-zoom.jpg)).
- Player camera tools only where a 3D pile needs it: Rafter Five has **rotate left / top-view / rotate right** buttons; Switch has "−/+" zoom ([`site-rafter-five-switch-prompts.png`](images/site-rafter-five-switch-prompts.png)) [SEEN].

### 4.3 Turn handover [DEV + SEEN]
- "**Your Turn**" banner (shared) + turn sound + camera nudge.
- Startups: a **glowing light bar along the table edge travels to the next player's side** — shows whose turn it is *and* that play goes clockwise. Press loved it: "builds the turn indicator into the table design, as a light bar that zooms around" [TEXT].
- Rafter Five / Make the Difference: acting player's avatar shown inside the prompt / progress strip [SEEN].

### 4.4 Making other players feel present — their single biggest finding [DEV]
They found online play "felt like playing a CPU" and downtime felt long, because you can't see faces, hands, hesitation. Their fixes, in order of how well they worked:
1. **Live choice mirror** (biggest win): when it's someone else's turn, *their* option buttons float over *their* piece on your screen, and **wobble like a balance scale** while they hesitate; the chosen one grows, the other shrinks ([`dev-live-choice-mirror.jpg`](images/dev-live-choice-mirror.jpg)). Not "Player is thinking…" — the actual choices. "Watching became fun in itself." It also fixed "whose turn is it?".
2. **Shadow hands**: Startups shows each rival's hand as a **shadow on the table that moves as they browse their cards** ([`dev-shadow-hand.jpg`](images/dev-shadow-hand.jpg)), plus a "Choosing a card" tag.
3. **Emotes** on avatars and pieces; join/leave emote pops automatically.
4. **Live mini-boards** of rivals (Nine Tiles) [SEEN].

### 4.5 Rituals and physical moments [DEV + SEEN]
- **Place your own piece**: Deep Sea starts with your meeple shown **huge, floating in empty space**; you press "Place piece" and it drops onto the submarine ([`dev-place-your-piece.jpg`](images/dev-place-your-piece.jpg)). Purpose: you learn which colour you are — and "you step into the piece; the game starts *with* you".
- **Shuffle and deal on screen** (Startups) — without it "the game starts too suddenly, as if you sat down and the cards were already dealt."
- **Dice rattle until you throw them** (Momotaro-Dentetsu-style) — you get the "come on, good roll!" moment instead of an auto-roll.
- **Big decisions get a pause**: devs muse that a confirm step for risky moves might restore the "weight" physical effort gives.

### 4.6 Celebrations and reveals [SEEN + DEV]
- Result screens are **cinematic** on purpose (museum spotlight, speed-lines) — the one place they go "rich"; everywhere else is flat to save weight.
- Scores mostly live as numbers in the capsules plus physical piles (coins, gems) that grow on the table. I found **no evidence** of flying "+N" score pops [INFERRED from screenshots only — could exist in motion].

---

## 5. What is per-game — and why it still feels like one family

| Per-game | Still family because… |
|---|---|
| The table/background "cloth" and its colour | Same four-corner HUD, same chip, same pills sit on top of every cloth |
| The components (3D, faithful to the box) | Same camera angle, same "no-scaling" motion rule, same lighting/shading approach |
| Attachments on the seat chip | Chip itself never changes; attachments sit in the same place beside the capsule |
| Prompts' wording | Same black pill, same position |
| Hero result screen | Same shared ranking afterwards |
| Music | Same restrained approach, same "your turn" SE |
| Input details (Fake Artist pen, This Face part rotation) | Same controller-cursor vs touch rules |

Where they *broke* the "faithful component" rule on purpose [DEV]:
- **Fake Artist** drops the physical look entirely (easel, brushes, brass topic plaque) — the game needs no component metaphor and 8 people around a paper didn't fit.
- **Startups cards were redesigned**: full-colour faces instead of the physical edge stripes (stripes only existed to help humans stack cards; on a small screen, colour matters more). Rule: "remove what the computer now does for you; add what digital needs."
- **Moon's oxygen tank** became a gauge beside the avatar instead of little cards stacked on cards ([`steam-moon-adventure.jpg`](images/steam-moon-adventure.jpg)).
- But **Startups' 1-point/3-point flip chip was kept** — the physical metaphor explains itself better than any UI.

**Secret information** [SEEN + DEV]:
- Your private info lives in a **fixed bottom-left plaque/hand**: Fake Artist "You are the Artist / This Round's Topic: Pegasus" brass plate; your fanned hand along the bottom (Startups, SCOUT); your detective tiles bottom-right (In a Grove).
- Others' secrets shown as **backs** (card-back fans next to their chip in SCOUT, shadows in Startups).
- In a Grove (Ver 6.0) added an indicator that "the next player can't see this suspect after your chip".
- **Anti-cheat layout**: in This Face, topic cards are arranged differently for the maker and the guessers so nobody can say "it's the third one" over voice chat.
- Offline one-screen hidden info is weak: players must "close their eyes" — one Steam reviewer refunded over this [TEXT]. Deep Sea was picked first partly *because* it has no hidden info and works on one screen [DEV].

**Making a tiny board readable** [SEEN + DEV]: tilted 3/4 camera, chunky simple 3D shapes, labels floating above pieces (player names over meeples), big pills for choices, colour-first card faces, camera zoom on the important bit, AP-cost badges above every reachable tile in Moon ([`dev-moon-ap-move-badges.png`](images/dev-moon-ap-move-badges.png)), and two clearly different words for two easily-confused choices ("Pass to market" vs "Make it mine") with the controller-highlighted one also bigger ([`dev-two-distinct-choices.png`](images/dev-two-distinct-choices.png)).

---

## 6. Inputs and platforms [DEV + TEXT]
- Built for **touch and controller at once**: a cursor appears only when you press a controller button; touch hides it. "UI that works with or without a cursor was hard."
- Fiddly inputs got **separate tuning per input type** (This Face: the part follows the cursor on controller but the reverse on touch; tap-then-hold to rotate slowly; "finish" became a long-press so mashing doesn't end your turn early).
- **Button prompts swap per platform** ("If you find it, touch here!" on mobile vs "If you spot it, press the button!" with a button icon on Switch) [SEEN: [`steam-make-the-difference.jpg`](images/steam-make-the-difference.jpg) vs site Switch shot].
- Switch was the **performance floor** ("if it runs on Switch it runs on phones"); the Startups CPU once froze the Switch for 5 minutes until optimised.
- **The weak spot on Steam**: reviewers say controls are "a bit wonky — clearly made for mobile", **mouse doesn't work in menus** (arrow keys only), drawing with a mouse is "nearly impossible", and they want a host-on-PC / join-from-phone "Jackbox mode" [TEXT].

---

## 7. What players say [TEXT]
**Praise**: "clean UI, great art, and smooth animations"; "interface and graphics are excellent and represent the physical game quite well"; "animation, shading and camera angles sufficiently remind us of playing in person" (Siliconera); boxes-on-a-shelf menu with the real box back (NWR); lots of profile icons + emoji chat; great Steam Deck/controller support; trial play lets friends join free; "works like an alternative to Jackbox".
**Complaints**: PC mouse/keyboard clunky; mobile-first feel; local play needs eyes-closed for secrets; some games have no CPU so offline is limited; SCOUT round count was locked to 1 at launch (fixed via "With Friends" settings); public tables were sometimes empty or slow to start (NWR); no new games since Dec 2023 ("might have been abandoned").

---

## 8. Mapping to Muzzy's taxonomy

### 8.1 Element → module

| Oink element | Goes in | Notes |
|---|---|---|
| Shared base: save, sound playback, master data, UI, CI builds | **Foundations** (Settings & save, Audio core, Game core data, UI kit, Testing & release) | Exactly their reuse story — strong confirmation of the Foundation layer |
| XD file = live UI (designer edits the real thing) | **Dev Kit** + **UI kit** | Validates `content/` + Dev Kit editing |
| Rules written with "slots" for animation | **Game core** (event stream) | Same shape as Glyphtender's engine |
| Four-corner HUD frame (round/time tabs, top-right cluster, top message, bottom instruction) | **UI kit** (a "Game HUD frame" recipe) | Every game used the same frame |
| Black instruction pill / white choice pill / dark data capsule / yellow = selectable | **UI kit** tokens + parts | The meaning-of-colour system |
| "Your Turn" banner + sound + camera nudge, turn bar on chip, travelling turn light | **Turn & phase flow** | Uses Motion + Audio |
| Phase changes "change the whole picture" | **Turn & phase flow** (phase intro) + **Motion** | |
| Rule-reminder banner at the right moment | **Turn & phase flow** (contextual hint) | Not Tutorial — it's always on |
| Seat chip (avatar, capsule, name, you=yellow, crown, role tag, status tag, attachments slot) | **Seats & pass-and-play** (owns the chip) using **UI kit** `PlayerChip` | Kit already has PlayerChip — extend it with these slots |
| Four player layouts (left column / two columns / bottom row / around the table) | **Seats** (layout option) | A designer knob: `seatLayout` |
| Live choice mirror, shadow hands, "Thinking…" tag | **Seats** (presence) fed by **Turn flow** | Works vs CPU and online — not an Online-only feature |
| Emotes on avatar/piece, emote tray, join/leave emote, text-chat toggle, block, parental mode | **Online play** (optional parts) — but the *display slot* is on the seat chip | |
| Lobby (player list, CPU +/−, code, copy code, options, start), find table, join running game, drop → CPU → rejoin | **Online play** (Rooms) + **Game options** + **AI opponents** | Rooms already does most of this ✅ |
| Game options (time limit per game, rounds, expansion dice, answer-anytime mode, max players) | **Game options** | |
| Place-your-piece ritual, shuffle-and-deal, hold-to-throw dice | **Pieces & placement**, **Deck/bag & draw**, **Dice** (each owns its ritual), using **Motion** | |
| "3D objects don't scale; UI may" | **Motion & feel** rule | |
| Camera zoom on key moments, seated 3/4 framing, rotate/top-view buttons | **Board** (viewport) + **Motion & feel** (moments) | See 8.2 — maybe a named "Camera director" part |
| Live mini-board of each rival (Nine Tiles) | **Seats** attachment + **Board** (mini render) | |
| AP cost badges over reachable tiles | **Pieces & placement** (legal-move hints) | |
| Shared ranking screen + per-game hero result + hide-answer screenshot button + everyone-press-OK | **Scoring & results** | Hero result = a slot each game fills |
| Crown on leader, tie handling per game | **Scoring & results** (knob: `tieRule`) | |
| Medals per game, Steam achievements, unlockable icons | **Achievements & moments** + **Progression & economy** (cosmetic only) | |
| History saved, friends' play status | **Stats & history** / **Online play** | |
| How to Play videos, rule difficulty ★, box back zoom, in-game "?" | **Tutorial & onboarding** | Video-first, cheap to make |
| CPU tuned "intermediate = graduation test" | **AI opponents** | A good default target for difficulty |
| Turn-number pattern in the pen line | **UI kit** accessibility rule ("never colour alone") | |
| "Your turn" SE, per-game music, music resumes mid-track | **Audio** | |
| Touch vs controller cursor, per-input tuning, platform button prompts | **Not in the taxonomy** → see 8.2 | |
| Box shelf, game library, select-multiple matchmaking | **Not in the taxonomy** → see 8.2 | |
| Trial play / DLC ownership | **Not in the taxonomy** → see 8.2 | |

### 8.2 Gaps and better boundaries this suggests

1. **Input & controls is missing — add it as a Foundation part** (inside App shell, or its own small foundation). Touch / mouse / keyboard / controller, a cursor that appears only for controllers, per-input tuning for fiddly moves (hold-to-rotate, long-press to confirm), and **button-prompt glyphs per platform**. Oink's single biggest player complaint (PC mouse in menus) lives exactly here. Today our games are touch+mouse only; the moment one goes to Steam/Steam Deck this matters.
2. **Player profile (identity) should be a Foundation part, separate from Seats.** Profile = *who I am, saved*: name, icon, icon colour, unlocked icons, medals, history. Seats = *who's at this table right now*. Oink keeps them apart (profile in settings, chip at the table) and the "piece colour follows icon colour" trick links them. Suggest putting Profile inside **Settings & save**.
3. **"Presence" belongs to Seats, not Online.** Live choice mirror, shadow hands, thinking tags and emote display make a CPU game *and* a local game feel alive too. Online only supplies the network messages and the emote picker. Better boundary: Seats owns the chip *and everything drawn on it*; Online plugs data into it.
4. **Seat chip needs designed "slots"**: headline number, role tag, status tag, crown, turn bar, emote bubble, and **one game-defined attachment area**. That one rule is how 12 different games kept one chip. Add these slots to the UI kit's PlayerChip.
5. **Camera director** — a named part inside Motion & feel (or Board) for 3D/R3F games: default seated framing, "push in on this moment" (tied to the Medium/Big feel tiers), your-turn nudge, optional rotate/top-view. Our taxonomy only has 2D "board viewport (fit/zoom/pan)".
6. **Results = shared ranking + game-filled hero slot.** Make the hero slot explicit in Scoring & results, plus a "hide the answer / screenshot" option.
7. **Contextual rule hints** belong in Turn & phase flow (always-on reminders), distinct from Tutorial (first-time teaching). Two different jobs.
8. **Collection shell / library** — only needed if Muzzy ever bundles several games in one app (a "Muzzy's table" app?). It would be an App-shell variant: box shelf, per-game icon strip, difficulty/time/players badges, select-multiple matchmaking, shared profile + lobby. Not urgent — note in Ideas.
9. **Entitlements (ownership / trial play)** — only if games are sold with DLC. "One owner unlocks the table" is a clever growth trick; it would sit in Online play + App shell. Later.

### 8.3 Concrete things to copy

**Into the UI kit**
- One accent colour with fixed meaning (**you · your turn · selectable · primary**). Make it a token, not a per-screen choice.
- Three pill types with fixed jobs: **instruction (black/white text)**, **choice (white/dark text)**, **data capsule (dark translucent)**.
- **Game HUD frame** recipe: round + timer tabs top-left, system cluster top-right (menu · log · emotes · ? · zoom), message top-centre, instruction bottom-centre, choices from the right edge.
- **PlayerChip v2**: avatar ring + capsule + name; slots for you-highlight, turn bar, crown, role tag, status tag ("Thinking…"), emote bubble, attachment area; mirrored for right-side seats; four seat layouts.
- **Ranking result** recipe (rank · avatar · name, you highlighted) + a hero slot.
- **Lobby** recipe additions: CPU +/− under the list, per-seat status button, hide-code toggle, copy code, rule-difficulty stars + time/players/age icons.
- Accessibility rule: **never colour alone** (numbers/patterns inside player colours).

**Into Motion & feel (`content/feel.json`)**
- Rule: **world objects don't scale; UI does.** (Lift/slide/flip/settle for pieces; pulse/pop for UI.)
- **Your-turn package**: banner + sound + small camera nudge + avatar pulse — one call, every game.
- **Moment push-in**: camera/zoom on Medium/Big moments (tie to existing tiers), with reduce-motion fallback.
- **Hesitation wobble** for mirrored choices; **chosen grows / others shrink**.
- **Turn light that travels** around the table edge to the next seat.
- **Start ritual** helpers: show-your-piece-then-place, shuffle-and-deal, hold-to-roll dice.
- **Phase change = whole-screen change** (a phase-intro transition all games use).

**Into BMUZ habits**
- Oink's lesson matches MDA perfectly: a faithful rules copy felt *dead* until they fixed **player behaviour cues** (noticing your turn, seeing others hesitate) and **feeling** (camera on dramatic moments). Add "does the other player feel present?" and "does the big moment *look* big?" to `/develop` playtest checks.
- They found every issue only through **lots of quick playtests** — matches our "prove it" loop.

---

## 9. Summary
1. The product is **Let's Play! Oink Games** (Steam 1933490, Switch Dec 2021 → Steam Jul 2022 → mobile, PS5, Apple Arcade 2026): 12 small-box games, Unity, cross-play, built by ~3 programmers + a director in under a year, Very Positive (81%) on Steam.
2. Their speed came from a **shared base from an earlier game** (save, sound, data, UI, auto-builds) and a tool that made **designer UI files the real UI** — direct confirmation of our Foundations + `content/`/Dev Kit approach.
3. Identical everywhere: a **four-corner HUD frame**, **three pill types**, **yellow = you / your turn / selectable**, and one **seat chip** (avatar + score capsule + name + turn bar + crown + role/status tags + emote) with a slot for game-specific extras.
4. Per-game: only the **tablecloth colour, faithful 3D components, the chip's attachments and a hero result screen** — the frame and rules of meaning never change.
5. Their biggest finding: a faithful copy felt dead until they added **presence** (others' live choices wobbling over their piece, shadow hands, emotes) and **camera push-ins on dramatic moments** — plus a your-turn banner/sound/zoom.
6. Motion rule worth stealing: **world objects never scale; UI does**; rituals (place your piece, shuffle-and-deal, hold-to-roll) make the start feel real.
7. Gaps for our taxonomy: an **Input & controls** foundation (their #1 complaint), **Player profile** separate from Seats, **presence owned by Seats** (not Online), a **camera director** in Motion, explicit **hero-result** and **chip slots**; a collection shell/entitlements only if Muzzy ever bundles games.
8. Easiest wins to copy now: accent-colour meaning token, PlayerChip v2 slots, HUD frame recipe, your-turn package, moment push-in, and "never colour alone".

---

## Sources
- Steam store + API: https://store.steampowered.com/app/1933490/ · DLC apps 2095240, 2259010, 2373820, 2391220, 2472980 · reviews API · Steam news (patch posts 3.0.2–Rafter Five)
- Official page + FAQ: https://oinkgames.com/en/games/digital/lets-play-oink-games/
- Official release notes Ver 2.0–9.0: https://oinkgames.com/en/news/4FRRDQrDIWGMYHtr2N0goC/ (2.0) · /6KZuy5WJSKbNXZ5cKfWYlu/ (3.0) · /34gXbxI4UZbMtiuGp8SXii/ (4.0) · /7gEZFC76Ya33VyJjL7dQ9S/ (5.1) · /5dH6qsM3C9yyYUWnXUdySN/ (6.0) · /4a8TKLk0BnpubU0FY3EvFh/ (7.0) · /2ztA2QBGqN2CVM3bFjDcco/ (8.0) · /3JbTmDZ5YumQOzDGUWtA74/ (9.0)
- Developer UI article (Shindo, Dec 2021): https://note.com/oinkgms/n/n14dc74c24086
- Designer-notes series #1–#5 (Apr 2022): https://note.com/oinkgames/n/n89636f1dae93 · /nc48f34e02efa · /nd46f61a92a7c · /nf73b3134687b · /nfc854c17d7fe
- Unity Learning talk page: https://learning.unity3d.jp/8848/
- App Store: https://apps.apple.com/app/id1564193305 · Apple Arcade edition https://apps.apple.com/app/id6755094405
- Reviews: https://www.siliconera.com/review-lets-play-oink-games-does-justice-to-japanese-tabletop-gems/ · http://www.nintendoworldreport.com/review/60105/lets-play-oink-games-switch-review
- Not reached: BGG thread (403), Reddit (no useful hits), PS5 release date, exact typeface, exact animation timings.
