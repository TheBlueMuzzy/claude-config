# GMTK as a community and a visual body of work: research for BMUZ

Researched 2026-10-09. The sources are transcripts I pulled myself (yt-dlp captions), the Steam store API (app details plus review summaries and samples), itch.io, gamemakerstoolkit.com, the GMTK Substack, and images I downloaded and looked at.
Image evidence is in `scratchpad/gmtk/D_img/`:
- `sheet_headers.jpg`: both Steam headers
- `sheet_wp1.jpg` and `sheet_wp2.jpg`: all 11 Word Play screenshots
- `sheet_mom.jpg`: all 7 Mind Over Magnet screenshots
- `trailer_wp.jpg` and `trailer_mom.jpg`: 25 timed key frames per trailer
- `sheet_thumbs.jpg`: 20 recent video thumbnails
- `essay_8tHJgtbj6rs.jpg` and `essay_zk3S3o1qOHo.jpg`: 30 frames each from two essays
- `glyph_now.jpg`: current Glyphtender e2e shots, desktop and phone

I deleted the video files after extracting frames.

---

## 1. GMTK Game Jam

### Format
- **Duration:** started at 48 hours. In 2023 (*Roles Reversed*) Mark says "in just 48 hours". From 2024 it runs **four days / 96 hours** (2025 video: "race to make a game in just four days"; 2024: "What you lot can achieve in just 96 hours").
- **Theme** is revealed at the start. You may only begin when the countdown ends. Pre-owned or licensed assets are allowed with credit.
- **Rules for 2027** ([itch.io/jam/gmtk-2027](https://itch.io/jam/gmtk-2027)):
  - The game must be free.
  - It must run on Windows with keyboard and mouse.
  - It must be hosted on itch.io and be safe for work (around PEGI 16).
  - **No AI-generated art or audio**, and that includes the thumbnail.
  - No limit on team size.
- **Rating:** the community rates entries on 5 criteria: **Creativity, Enjoyment, Narrative, Artwork, Audio**. There is **no overall ranking**.
- **Mark's role:** since 2025 he no longer picks "winners". He says: "it doesn't make sense for the whole thing to come down to a single judge who really likes puzzle platformers… I'll let the community pick the winners." He plays the community's top ~100 and makes a "My Favourite 20" video.
- **Funding:** patrons pay for the jam ("we never need to bother with corporate sponsors").

### Scale ([gamemakerstoolkit.com/jam](https://gamemakerstoolkit.com/jam))

| Year | Theme | Participants | Games |
|---|---|---|---|
| 2022 | Roll of the Dice | 22k | 6,000+ |
| 2023 | Roles Reversed | 23k | 6,800 |
| 2024 | Built to Scale | 32k | 7,600 |
| 2025 | Loop | 37k | 9,600+ |
| 2026 | Count Down | 37k+ | 10,500+ |

In 2026 it overtook Global Game Jam ("I guess that means we're the biggest jam now?"). Godot overtook Unity as the most-used engine in 2026. The 2027 jam is already announced for **11 Aug 2027**, a year ahead, because people asked for more notice.

### What the standout jam games have in common
This is a synthesis of the 2023–2026 favourites videos.

1. **One small twist on a familiar genre, stated in one sentence.**
   - "Veggie Brawl is an autobattler… but you buy fighters by choosing when to stop a countdown clock."
   - "Null Rush is the Balatro successor… where you fight a number by playing cards that make it count down."
   - "Two-Timin' Towers: your towers have friendly fire."

   Mark's descriptions are nearly always *genre + one rule change*.
2. **A literal, mechanical reading of the theme beats a decorative one.**
   - *7 Segments* turns the digits of a countdown clock into platforms.
   - *1 2 3 D* counts down dimensions, from 3D to 2D to 1D.

   Mark also rewards cheeky readings: "scale" as fish scales, and "Count" Dracula. Quote: "it's always totally fine for people to interpret the words of the theme in whatever way they like."
3. **Simple rules that escalate.** "Simple enough, but things escalate." "Things escalate elegantly from there." The best puzzle entries add a second meaning to the first rule. In *Circuit Breaker* the fuse becomes an electrified wall, then the spark triggers switches.
4. **Readable from the first seconds; complexity comes later.** Mark praises "simple design, easy controls, and clever concept". *Princess Paladin* earns praise because "cute thought bubbles help make the princess's decision-making more transparent". *Count Your Clones* gets the critique: "it all gets a little bit much."
5. **The idea beats the presentation, but polish gets noticed.** On *7 Segments*: "a good example of why presentation doesn't really matter in game jams. This one has no audio and the main character is a rectangle." He also repeatedly calls out "absurdly polished", "sharp presentation", "generous undo", and music that "turns your level layout into a song".
6. **Game-feel words recur:** "feels great", "nippy and bouncy, without ever feeling slippery", "satisfying", "addictive feedback loop", "number goes up". In 2026 he admits the count-down games still drift into upgrade shops: "oh my god we're counting up again… But it's so much fun!"

### From jam game to commercial game ("100 Steam Games that started life during GMTK Game Jam")
- **More than 100** GMTK jam games have Steam releases. Examples:
  - *A Little to the Left* (top-rated "Cozy" game and the only physical release)
  - *Rollerdrome* (from 2017; a top-down jam game rebuilt in 3D for Roll7)
  - *Boomerang X* (Devolver)
  - *Slider* (IGF Best Student Game 2023)
  - *Omelet You Cook* (1,000+ Overwhelmingly Positive reviews)
  - *Scale the Depths* (800+ Very Positive)
  - *Sol Cesto* (100k+ copies)
- **The usual path:** "the developer thinks — hey, this game is pretty good. This thing has the sauce. So they… add more features. Add more levels. Replace the programmer art with professional assets." Several titles grew from a Mark favourites pick into a Steam demo, then a release (*Blueprint Bob*, *Nested*, *Threadbound*).
- **The cautionary tale:** BenBonk "made minus 200 dollars" on *Wrangle Ranch*.
- **Mark's own *Word Play*** started as "Wordy", made for the **secret Patreon-only GMTK jam** (December 2024). He reached Steam in 7 months.
- **Word games keep turning up in the jam:**
  - *Word Factori* (a Zachtronics-style letter factory)
  - *Push the Cat with WASD* (Baba Is You-style letter pushing)
  - *I Was Seen as the Weakest Hero…* (delete words to whittle a sentence while it still reads as English; Mark: "I'd like to see an expanded version of this idea")
  - *Love Letters* (2025)
  - *Blood Typers*

  Mark plainly enjoys language mechanics where words *are* the board.

---

## 2. GMTK's games and store presence

Publisher page: [store.steampowered.com/publisher/gmtk](https://store.steampowered.com/publisher/gmtk). It lists 2 games. itch.io ([gmtk.itch.io](https://gmtk.itch.io)) hosts Mind Over Magnet ($9.99), **Platformer Toolkit** (free, 4.9/5 from about 990 ratings) and a free **Zelda UI demonstration** (from the video "Can I fix Zelda's UI using Unity?").

### Word Play: Steam app 3586660
- **Price and release:** $7.99, 14 Jul 2025, Win/Mac, Steam Deck Verified. Later also on iOS (video "Word Play is now available on iOS!"). OST is $3.99.
- **Reviews:** **Very Positive, 90%** (947 positive / 104 negative, 1,051 total).
- **Short description:** "Spell words, pick perks, score points, and survive until the end. Every round is different. How far can you make it?" That is four verbs plus a challenge question.
- **Long description** is organised as **How to Play** (Spelling / Scoring / Perks) → **Playing with Perks** (Modifiers / Upgrades / Gifts / Special Tiles) → **Score Big!** → **Difficulty and Modes** → **Other Features**. Each heading gets one or two plain sentences. Accessibility features are listed explicitly (dyslexic font, high contrast, spelling suggestions, controller/touch). There are 11 screenshots and 1 trailer.
- **What players praise:**
  - "if you're a fan of the classic BookWorm… leans juuuust enough into the Roguelike elements"
  - couples winding down together in the evening
  - teachers using it for vocabulary
  - spelling 20-letter mega-words
- **Most common complaints** (from about 40 negative reviews read):
  - **Low-impact perks:** "upgrades that say something like 'Gives 1 bonus point'…", "weak jokers", "too many perks making it hard to get the ones you want".
  - **Randomness over skill** at high difficulty: "Excessively random and punishing".
  - **Polished but sterile:** "Extremely competently designed… kind of sterile, more like a portfolio piece", "Great presentation, game is just a bit boring", "Solid but dull and joyless".
  - **Weak feedback animation:** "Instead of looking like an early mobile game I wish the animations were more impactful and stimulating."
  - **Dictionary gaps:** "Mexican apparently isn't a word"; a reviewer who couldn't play "Examinator".
  - **Surplus score resets each round:** "Punishing the player for doing well is frustrating."
  - **Word-search time kills momentum:** "The act of picking out high-scoring words takes long enough to kill any sense of momentum."

### Mind Over Magnet: Steam app 2685900
- **Price and release:** $9.99, 13 Nov 2024. Console release via Alchemy.
- **Reviews:** **Very Positive, 89%** (1,270 / 161, 1,431 total).
- **Short description:** "An attractive puzzle platformer where you use magnetism to escape a factory. Meet a cast of magnet characters…". "Attractive" is a magnet pun.
- **Long description:** leads with "comes from Mark Brown, the creator of… GMTK. You can follow his game making journey on YouTube". Also mentions 50+ puzzles across 5 worlds and a developer commentary mode.
- **Reviews:** praise is cute, polished, "ah-ha moments", great soundtrack. Complaints are **too short (about 2 h) and too easy for the price**, plus "Only redeeming factor is being made by GMTK".
- **Launch numbers** (video "What it's like to release a game on Steam"):
  - **50,000 wishlists** at launch.
  - **5,000 sold on day one (10% of wishlists)** and **10,000 in week one (20%)**. About 12,446 sold when the video was recorded.
  - About 2% refunds. Steam Deck Verified gave front-page placement on the Deck.
  - Pricing: "I just looked at other games of a similar length and priced the game in line with those", leaving "wiggle room" for launch and seasonal discounts.

### Platformer Toolkit (itch.io, free)
An "interactive video essay". The player changes about 30 movement variables (jump height, coyote time, squash and stretch) **with sliders while playing**, with narrated lessons. It is the clearest example of Mark teaching through a playable tuning tool. That is the same idea as Muzzy's Dev Kit.

---

## 3. Visual study

### Word Play screenshots (`sheet_wp1.jpg`, `sheet_wp2.jpg`)
- **Layout:** a fixed 4-column skeleton on every screen.
  - Left rail: perk cards (blue, small text with a coloured multiplier chip such as "+7" or "x2").
  - Centre: the word line at the top, then a 4×4 letter grid.
  - Right of the grid: 4 round action buttons stacked vertically (✕ clear, ↻ refresh count, bag with count, ▶ submit).
  - Far right: a hold zone.
  - Top bar: `MODE · score / target · ROUND x / y`. Bottom bar: a red **PLAYS** progress bar with a number.
  - The skeleton never changes, so a glance tells you where everything is.
- **Background colour changes every round:** blue, magenta, green, orange, crimson, purple. It is a big full-screen gradient with a faint pattern. The board itself stays neutral.
- **Tiles:** **white square tiles with a heavy, black, geometric sans capital and a tiny value number in the top-right corner.** That gives maximum contrast. Special tiles (golden, emerald, diamond, dot, locked dark-glass) change the **tile body colour**, never the letter. Used letters stay in the grid as faint ghost glyphs, so you can see what you took.
- **Scoring made visible:** future length bonuses wait as ghost slots on the word line ("+5 +5 +10 +10 +15 / 6 7 8 9 10"). As you add letters, each slot fills and an orange "+5" badge pops above the tile. Players can see exactly what one more letter is worth before committing. This is the strongest UI idea in the game.
- **Special-round rule** shown as a red-outlined pill across the top: "Special Round: First Tile Is Locked".
- **Reward screen:** three tall cards. Each has a coloured header band (Upgrade = yellow, Modifier = blue, Gift = red), one big icon or letter, one sentence of rules with **coloured keywords** ("Golden Tile", "Play", "Vowel"), and a rarity footer. Below sit **Re-Roll (−2 Plays)** and **Skip (+2 Refresh)**, with the price and payoff written in coloured chips beside each verb.
- **Juice visible in stills:** orange bonus badges popping up, a "−1" pill on a discarded tile, a giant score counter "12 + 35" with an orange streak in the trailer, and tiles tilted while being dragged.

### Word Play trailer (63 s, `trailer_wp.jpg`)
The structure is a **verb chain spelled in the game's own tiles**:

1. Logo (0 s)
2. **"SPELL WORDS."** in tiles (2.5 s), then gameplay
3. **"PICK PERKS"** (12 s), then perk cards fanned out
4. A close-up crop of the score tally "12 + 35" (22 s)
5. **"STAY ALIVE."** (27 s), then gameplay
6. **"AND WIN!"** (32 s), then the "You Win!" stats card
7. Feature pills (42–48 s): "Over 150 Perks!", "Accessibility Settings", "Casual Mode"
8. Logo hold (55–63 s)

The title card is the game's own UI. The Steam header is also just "WORD PLAY." in tiles, with one tile tilted under a cursor. The YouTube thumbnail splits a pencil sketch of those tiles against the final colour tiles.

### Mind Over Magnet (`sheet_mom.jpg`, `trailer_mom.jpg`)
- **Art:** chunky, thick-outlined 2D vector art, saturated, one dominant hue per world (teal factory, orange furnace, purple lab). Glowing blue chevron-pattern magnetic beams mark the magnet's field. Interactable machines get bright rims (green or red buttons, yellow hazard stripes). The background is darker and desaturated.
- **Dialogue:** white rounded speech bubbles with a key prompt ("E"), and the character's name coloured inside the sentence ("Looks like **Max** isn't on this floor…").
- **HUD:** almost nothing. A small restart icon with a "ctrl" key cap in the corner.
- **Header and capsule:** a big 3D-ish yellow-to-blue logo, "MIND OVER MAGNET", with the A drawn as a magnet. The cute magnet and robot characters fill the left half. Mark commissioned this capsule after his placeholder, saying: "**The Steam Capsule Art… is the YouTube thumbnail of game development.**"
- **Trailer (75 s):** logo at 3.5 s, a montage of puzzles organised by world colour, charming speech bubbles ("Oh my gosh!", "Wheee!!"), then "WISHLIST NOW". There are no verb cards, so it is less instructive than Word Play's trailer.

### GMTK video visual language (`sheet_thumbs.jpg`, `essay_*.jpg`)
- **Thumbnails** (20 checked) follow one formula:
  - **One or two huge words** ("PROTOTYPES", "RNG", "BOSS KEYS", "DESTRUCTION", "100", "10", "GAME IDEAS"). They are massive and bold, often outlined or semi-transparent, and partly hidden behind a cut-out character.
  - One saturated background colour, and the "GMTK" corner badge top-right on a diagonal flag.
  - Ideas are shown as **visual metaphors made from UI**: an "Uninstall" button with a cursor over Hornet; an "Add to Cart" button on a magnet; EASY / **MEDIUM** / HARD stacked with an arrow on Medium; thumbs up and down held by two magnets.
  - There are never more than about 3 words.
- **In-video explanation style:**
  - **Every clip sits in a labelled card:** a title top-left ("Breath of the Wild Prototype / Nintendo") and a bracketed source number top-right ("[2]", "[26]") on a dark frame. It works like a footnote.
  - **Chapter cards:** a cream card with an orange "Part 1" and a black bold question, "What's the point of prototyping?" Chapters are *questions*.
  - **Icon triads:** three big round icons, with red prohibition slashes for "no audio, no art" and a code snippet.
  - **Close-up crops** of one UI element under discussion: Balatro's "0 × 0" score, a single "Misprint" joker blown up.
  - **Full-screen pull quotes** from the designer, in white serif on dark with an attribution line ("LOCALTHUNK, BALATRO").
  - **Bespoke charts:** a hand-type tracker table for Balatro, and Mark's well-known love of histograms ("We love a histogram at GMTK… no better way to visually represent the distribution").
  - **Side-by-side comparisons** with other games (Isaac next to Balatro).
  - **Short text captions** on clips ("hit feedback").
  - **Mark on camera**, framed like a video call on a branded orange-purple gradient.

### Glyphtender compared (`glyph_now.jpg`: desktop end-of-turn plus phone portrait e2e shots)
- **Board:** dark navy hex board. Gold and cyan hex glyph tiles carry **ornate textured serif letters, with no letter values shown**. A big white "+10" floats over the board, and a white "ON" word tag.
- **Hand:** 8 gold hex tiles under the prompt "Move a glyphling · Yellow's turn". Buttons: Shuffle / Undo / Cast.
- **On a phone:** the hand tiles are small (roughly 30 px in this shot) and the ornate gold-on-dark letters lose contrast at that size. There is a lot of empty space at the top. *(This is my reading of test screenshots, so worth checking against the real phone build.)*

---

## 4. The wider community
- **Patreon** ([patreon.com/GameMakersToolkit](https://www.patreon.com/GameMakersToolkit)): about 10.5k members.
  - Tiers: $3 gets the monthly GMTK Digest, $5 gets early episodes, $10 gets a credit.
  - All patrons get the **private GMTK Discord** (design and dev rooms, a playtester-finding room, Mark drops in).
  - Patrons fund the public jam and get a **secret Patreon-only jam**, which is where Word Play started.
- **Discord as the feedback hub:**
  - User "Fly" suggested "plays" as the name for lives, which led to the name *Word Play*.
  - Mark recruited his sound designer Jay after Jay posted an unsolicited spec video with new SFX.
  - A Discord mod's game (*Squarepinski*) appears in the 100-games video.
  - For the Word Play demo he made **one Discord forum (bugs / ideas / requests)** and pointed everything at it: pinned Steam forum post, pinned YouTube comments, and an in-game "report an issue" button.
- **"Developing" series (16 episodes, Mind Over Magnet).** He developed in public:
  - A 30-minute **MVP demo** went to patrons in 2022. Feedback arrived as Discord messages, surveys, Let's Plays and **Zoom screen-share playtests**.
  - Key lessons from it:
    - **"design language"**: inconsistent visuals ("these look like platforms, but they're actually screens on the background"; one-way platforms blocking the magnet "until later they don't") break players' "mental model".
    - **Genre clarity**: players couldn't tell "when a puzzle involves me thinking… and when it just needs me to dash in".
    - The surprise note from user YK: "**it doesn't feel to me like the magnet is the core of the game**."
  - Hazelight's Oliver Granlund suggested **camera framing to show small parts of a puzzle at once**.
  - Mark's own regret: "As someone who typically likes to… not show their stuff to anyone until it's absolutely fully done, it was hard to let others in". He also wishes he'd spent fiddly-feature time "on improving the underlying gameplay".
- **Word Play process** ("How I Made Word Play" video, also on [gmtk.substack.com](https://gmtk.substack.com/p/how-i-made-word-play)):
  - **Layered development:** first "just build a really good spelling game… nice and juicy to spell words", then the roguelike loop, then content (perks from 11 to 160), then QA and balance.
  - **Ruthless scope:** "using a more simple set of icons [instead of 160 unique perk art pieces] saved weeks." He accepts the criticism that the game is worse for it, and reviews did call it "sterile".
  - Unity Analytics for balance. Playtesting at GDC with the devs of Patrick's Parabox, SpellTower and Alto, plus iPad sessions at school talks.
  - The QA team was patrons plus the most insightful demo-feedback givers.
  - On finding competing word roguelikes (Wordatro, Birdigo): "I can't control what anyone else makes. The only thing I can control is how good my game is." He decided it meant a genre was forming, not that he was being copied.
- **Steam Next Fest playbook** ("How I got my demo ready for Steam Next Fest"):
  1. Launch the demo about 2 weeks early. That brought about 25k wishlists before the fest and time to fix things, e.g. letting words longer than 10 letters spill into a secret second row.
  2. Show enough but not too much: aim for 30–90 min median playtime (Steamworks stat). Word Play's demo had about 25 of 120 perks and one mode, around 1 h.
  3. Make a strong first impression: real music before launch, err on easy, and **rig a guaranteed fun combo** into the demo. "**A demo is not a playtest build… It's marketing.**"
  4. Tease what's locked: mode buttons stay visible with a lock and the tag "available in the full release"; the logo shows tile types the demo doesn't have; a Steam news post lists everything coming.
  5. Send all feedback to one place.
  6. Strip locked content out of the demo files, because someone unlocked the full game on day one.
  7. Release soon after the demo.
- **Word-game specifics:** "why does the game not let me spell WAIFU? YEET? RIZZ?" was the single most common feedback. His fix:
  - a first-time tutorial explaining that proper nouns don't count
  - a "petition this word" button that logs to analytics, giving a spreadsheet he reviews in batches (BESTIE, EMOJI, NERFING…)
- **Mind Over Magnet Next Fest:** 1,800 demos, 300+ tagged puzzle. 9,640 players gave +3,961 wishlists. Feedback: too short, too easy. He called it "a practice launch… figure out all of the weird quirks of Steamworks."
- **Game Dev 101 / "How to find amazing game ideas"** (the tools for /discover):
  - Four sources of ideas: an existing game changed (perspective, theme, medium, revival), a genre bent (fix a problem, combine, *remove* a core mechanic, swap the metaphor), a new mechanic (real-world activity, the input device, isolating one mechanic), or an experience (a fantasy or theme).
  - A structure for turning an idea into a game: **win state → obstacle → fail state → actions**.
  - Tests: "Can you make it?" (Jonas Tyroller: "If you can make the gameplay prototype in one or two days, then you can make the game in one or two years"), passion, and "will it stand out?". The **hook** is defined as "some interesting bit of information… that compels people to try it, or to discuss it". Test it with a **headline**. Pair it with an **anchor**: something familiar, so the game doesn't sound too risky.
- **Other outlets:** GMTK Live, a YouTube channel for jam streams; Mark has played "well over 1000" jam games on stream. There is a Backloggd list of jam-to-Steam games. Mark's talks page says he does in-person talks only and "not… for the foreseeable future". He also does design consulting (PlayStation, EA, Remedy). There is a Thinky Games video interview on Mind Over Magnet (blocked to fetch). I found no GDC talk by Mark; his GDC appearances were as a playtesting attendee.

---

## BMUZ implications
These are concrete and each is tied to the evidence above.

### /discover: a "find the hook" jam exercise
1. **One-line hook = genre + one rule change.** Add a step that forces the pitch into Mark's sentence shape: "X is a [familiar genre/anchor] where [one twist]". Then run a **headline test** (Darkest Dungeon example) and name the **anchor**. *Evidence:* every favourites description, the Game Dev 101 hook/anchor section, and Arco's flop.
2. **Mini theme jam.** When a feature is fuzzy, Claude writes three *literal, mechanical* readings and one *cheeky* reading of a one-word theme, then sketches each as win → obstacle → fail → actions. *Evidence:* the jam favourites' theme readings and the Crazy Taxi structure.
3. **Prototype-time check:** if the core prototype takes more than about 2 days, flag the scope (Tyroller's rule of thumb).

### /develop: build in layers like Word Play
4. **Make the core verb juicy before any meta.** "Just build a really good spelling game" came before perks. For Glyphtender that means placing glyphs and casting must feel great before awards and modifiers grow.
5. **Guard against "competent but sterile".** For each reward or modifier, ask: does it change *how I play* or just add +1? *Evidence:* Word Play's top complaint is low-impact perks ("Gives 1 bonus point"). Use mda-analyze here.
6. **Design-language audit (fits the existing "same intention → same motion" rule).** Anything that looks interactive must be interactive, and rules must not silently change. *Evidence:* Mind Over Magnet's background screens looking like platforms, and one-way platforms that block "until later they don't".

### /deliver: store page, trailer and launch checklist
7. **Capsule first.** "Capsule art is the YouTube thumbnail of game development." Make the capsule from the game's own pieces: Word Play's header is just its tiles spelling the name. For Glyphtender: GLYPHTENDER spelled in glyph hexes on the night garden, with a glyphling peeking in.
8. **Trailer template = a verb chain in your own tiles.** 60 s: logo → "VERB 1" card built from game tiles → gameplay → "VERB 2" → close-up of the score tally → "VERB 3 / AND WIN!" → 3 feature pills (including accessibility) → logo plus call to action.
9. **Short-description formula:** 3–4 verbs plus a question ("Spell words, pick perks, score points… How far can you make it?"). The long description follows How to Play → systems → Modes → Accessibility → Features, one sentence per item.
10. **Demo rules:**
    - launch about 2 weeks before any festival
    - 30–90 min median playtime
    - err easy
    - rig one guaranteed great moment
    - show locked modes as "in the full release"
    - one feedback funnel plus an in-game "report" button
    - **strip** locked content from the build
11. **Word-game specific:** a first-invalid-word explainer, and a "suggest this word" button logged somewhere Muzzy can review in Obsidian or the Dev Kit. Dictionary complaints are the top source of word-game feedback and negative reviews.
12. **Price by comparison:** look at games of similar length, leave room for discounts, and expect about 10–20% of wishlists to convert in week one.

### How Claude should present things to Muzzy (a visual thinker)
13. **A report is a labelled clip, not prose.** Every screenshot gets a top-left label (what and where) and a source tag, like Mark's "[2]" footnotes.
14. **Chapter headings as questions** ("Does the cast feel good?"), each answered by a picture.
15. **Side-by-side before/after** for any tuning change, and a **close-up crop** of the exact UI element under discussion rather than a whole screen.
16. **Distributions as histograms** for sim and balance results (scores, word lengths), with Mark's favourite chart as the default.
17. **Report thumbnails and headlines: two or three words, huge.** One saturated colour and one hero image, e.g. a report header "TOO SLOW?" over a cropped board.
18. **Playable explanations beat text.** Platformer Toolkit, rated 4.9/5, teaches with live sliders. That supports BMUZ's Dev Kit approach: when proposing a tuning change, offer the slider instead of describing it.

### Visual takeaways for Glyphtender
19. **Readability first:** Word Play's white tile, heavy black sans and corner value read instantly at any size. Glyphtender's ornate gold-textured serif on dark gold may blur on phones. Test a higher-contrast letter face (or a light face plate behind the letter) at phone hand size, keeping the night palette. The tile body can carry the decoration; the letter should stay plain.
20. **Show what the next letter is worth before casting.** Word Play's ghost bonus slots ("+5 +10 +15" waiting on the word line) make the score loop readable and create the "one more letter" pull. Glyphtender could ghost the preview score or bonus on the board or hand before Cast.
21. **A fixed skeleton plus one shifting mood colour.** Word Play keeps the layout identical and changes only the background hue per round. Glyphtender could keep the board and UI fixed and let the *night sky* shift (dusk → midnight → dawn) by round or score. That is cozy and readable.
22. **Score tallies are the money shot.** Both the trailer and the reviews ("animations not impactful… early mobile game") say the score moment needs weight. Use the existing feel tiers on the "+10" so it lands as the best frame of a trailer.
23. **Reward cards:** coloured header band by type, one icon, one sentence with coloured keywords, a rarity footer, and the cost written next to Re-Roll or Skip. That pattern is worth copying for any Glyphtender awards screen.
