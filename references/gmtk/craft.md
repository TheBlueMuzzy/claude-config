# GMTK craft videos: puzzles, feel, sound, UI/HUD, tutorials, cameras, accessibility, trailers

Source: Mark Brown / Game Maker's Toolkit. I read the full transcripts (auto and manual captions, downloaded with yt-dlp, deduplicated) of 30 videos. Quotes are exact apart from caption punctuation. Video IDs are in brackets. "Developing 6" (ep_9RtAbwog) and "11 Problems" (rJZyPdYIbZI) were not skipped because both had unique lessons.

---

## Part 1: Per-video notes

### What Makes a Good Puzzle? [zsjC6fa_YBg]
**Core argument:** a good puzzle comes from the game's rules. It has a **catch** (two needs that seem to contradict each other) and it leads the player into that catch with an **assumption**. Solving it gives a **revelation**: a hidden but logical result of the rules that the player keeps using from then on. Presentation and the order of puzzles decide how hard it actually feels.
- Goal clarity: "The player shouldn't be figuring out what to do - just how to do it."
- "A good puzzle is often built around a catch. Which is a logical contradiction, where two things are seemingly in direct conflict."
- Revelation is the gold standard: "it reveals a non-obvious - but also totally logical consequence of the game's rules that now becomes a part of your toolbox going forward."
- A trick is different from a revelation. Braid's puzzle felt like "oh, I literally didn't even know I could do that", and it got worse because "there's only one specific moment when it can happen, meaning players couldn't easily experiment."
- The assumption is a deliberate lure. It gives the player a starting point, builds a mental model, makes sure the first try fails, and "really focuses the player's attention on the catch."
- Minimalism: "the best puzzles are those that are so small, with so few moving parts, that you can't believe that it's not more simple to figure out." Extra elements are "busy work that will frustrate you when you need to reset."
- Feedback: Portal "has lines running from buttons to doors, which change colour when powered up". Make a failed approach look *clearly* impossible, so the player doesn't think they were "just a bit quicker" away from success.
- Presentation sets difficulty. It is the same puzzle in Portal 2 and The Turing Test, but "Portal's presentation is just so much more effective".
- Square Enix Montreal's four difficulty criteria: the number of possible solutions, the number of steps, the options at each moment, and the mechanics needed beforehand. Also, "puzzle games perhaps need more playtesting than most other genres."

### How Baba Is You Makes Brain Busting Puzzles [7zLwa4bztWs]
**Core argument:** an open-ended system only makes good puzzles when the designer *restricts* it. Teikari reverse-engineers each level: he starts from a cool interaction and adds limits until that interaction is the only way through. Teaching is done silently by the first levels' solutions.
- "while this is a game that offers a seemingly infinite world of possibilities - its puzzles are largely defined by what you can't do."
- Open systems invite cheap answers: "like Scribblenauts, where half of the levels can be finished by writing in the word jetpack."
- Process: "when I've got this idea of 'hey, that would be cool to see in a level', I try to figure out what kind of level do I have to build so that when the player is playing the level they have to use that interaction."
- "Teikari is working backwards from the solution, locking up doors behind him… the player then moves in the opposite direction, opening each door in turn."
- No tutorials: "the game's first crop of puzzles all subtly and silently tell you how the game works through their solutions." Level 2 is "the exact same stage as before but now everything is wrong".
- Making intro levels: "If I exhaustively go through all the meaningful interactions between elements, eventually I get levels where the 'trick' is mostly just the basic functionality of a specific element in itself."
- The goal is delight more than difficulty: "Teikari's real goal is to create moments of surprise and laughter."
- Ideas that failed were cut. "Safe" went because it was "hazy, and uninteresting". "Stick" went because of "nightmare programming problems".
- Expert playtesters "discovered alternative solutions".

### Mosa Lina: a puzzle game where your tools are completely random [2ZYAew_4tsc]
**Core argument:** random tools plus physics remove any "intended solution" and swap lock-and-key design for player creativity. A re-roll is the release valve.
- "there are no intended solutions to the puzzles… no guarantee that you could actually finish the level with your current load-out. But the upshot is that you get to be creative."
- "tools are just tools… not tied to any specific object or set-up."
- "if the level simply doesn't work with your current set-up then you can just re-roll and try again with a new collection of mechanics."
- Emergent stories: "I had them every few minutes".
- Know your audience: "there's definitely a large number of you who don't want to futz about coming up with your own solutions".
- "There's no one perfect way to do anything." Hand-crafted (Cocoon) and systemic (Mosa Lina) are both valid.

### Chants of Sennaar: a puzzle game where you decipher languages [PeDNuITuJPA]
**Core argument:** deduction from context is a satisfying loop. A built-in journal for hunches, plus validation in batches, supports it without letting players brute-force answers.
- Loop: "you come across some inscrutable text, and then explore elsewhere to figure out the meaning of those glyphs using clues and context."
- "the game actually has a wonderful built-in interface to log your guesses and hunches."
- Batch validation: "you have to correctly fill in an entire page to validate your hunch - which massively discourages just brute forcing".
- Risk: the hints "can also give some of the puzzles away".
- Chunking: each floor has a new language, which "breaks the game up into manageable chunks you can tackle in separate sessions".
- Smallness beats realism: "each population only speaks about 30 words… It's illogical and utterly contrived. But it doesn't matter."
- Genre shifts hurt: it sometimes "turns into a sliding block puzzle, or a tedious stealth game."

### Isles of Sea and Sky: block-pushing on an open ocean [VD9TX9qGQOo]
**Core argument:** a non-linear structure lets players skip or pick puzzles. That serves different skill levels and reduces burnout. Gates still control the pacing. Puzzles that can't yet be solved destroy trust.
- "If you get stuck you can just go off and explore somewhere else - and you may come back to that puzzle later with a fresh perspective".
- "easy and more difficult puzzles can live alongside each other, making the game fun for players of different skill levels."
- Gates still pace things: "This allows the designer to carefully mete out content on their terms."
- Palette cleansers: "I normally get quite burned out on Sokoban games… I was constantly hopping between different modes of play."
- Trust killer: puzzles that can't be finished yet make you "distrust other puzzles and you end up skipping ones that you actually can solve!"
- Accessible by default: "the controls never get more complicated than pressing a direction… a super forgiving system of infinite undos and instant room restarts."

### Why Does Celeste Feel So Good to Play? [yorTG9at90g]
**Core argument:** feel comes from tuned curves (acceleration, deceleration, jump arc), moves that differ from each other, short subtle feedback effects, and hidden forgiveness that works "on the player's intent". It is found through endless playtesting and by being willing to throw work away.
- Curves: "Keep them short and the character will feel stiff and robotic… Make them long and the character will feel heavy". Madeline reaches full speed in about 6 frames and stops in 3.
- Subtle juice: "the four-frame pause and microscopic screen shake whenever you dash… Celeste isn't a bonkers Vlambeer-style juice fest, but these subtle and short-lived effects do a lot of heavy lifting".
- State shown in the art: the dash is "elegantly represented by her hair turning blue".
- Forgiveness: coyote time, jump buffering, corner correction, small spike hitboxes.
- Noel Berry: "It feels like the game messed up, like the game missed your input or something - it got eaten. And you don't want that".
- Matt Thorson: "It's like working on the player's intent rather than making it a precise simulation of pressing buttons at the correct time."
- Forgiveness doesn't cap skill: "for a normal player that just makes the game feel better… pro players… get down to the frames".
- Feel in an empty room: "make sure the moment to moment feels good so that when someone's just sitting there with a controller, the room could be empty".
- Iteration: "You have to let different parts change other parts of the game, and let it slowly reveal what it wants to be." And: "you have to be willing to throw away stuff sometimes".

### What Makes Celeste's Assist Mode Special [NInNVEHj_G4]
**Core argument:** you can protect the designer's intent *and* let anyone play, if you are careful about how the options are presented. Language, placement and timing tell players what the intended game is.
- "I don't care how people play these games - as long as they understand what they're playing."
- Darkest Dungeon labels its options "gameplay settings as intended to be played".
- Tom Francis (Heat Signature) asked: "It's not: would the game be better without permadeath? It's: can we help the players who hate it?" Also: "I don't want players to feel like they're being asked to design how the game should work."
- Naming matters: "cheat mode" was dropped as "judgemental", and SOMA's mod became "Safe Mode": "Language is important".
- Celeste's text: "We recommend playing without Assist mode your first time. However, we understand that every player is different."
- The options are granular, not a single "easy" switch: "You can slow the game down by 10 percent… Or you can skip entire chapters".
- Nothing is withheld, unlike Cuphead's Simple Mode, which blocked the ending.
- Summary: "using language, placement, and timing to make sure everyone understands what these additional modes are all about."

### How to Make a Good 2D Camera [TdWFzpgnljs]
**Core argument:** don't pin the camera to the hero. Use lookahead, ignore small movements (jumps), damp or dead-zone it, frame the important things, and add juice in small amounts, with an accessibility toggle.
- "ask yourself 'what does the player really need to see'? And then make sure the camera isn't hiding it."
- Jumps: move "when you've landed, rather than shifting mid jump"; "you don't need to treat both camera axes equally".
- "even a tiny bit of camera damping can make things feel more smooth and polished."
- Dead zone (Fez): "an invisible window where the character can wander around freely without the camera moving at all."
- Framing: "use the camera to draw the player's attention to certain objects"; zoom out to "frame a tricky… puzzle area".
- Directional shake: "In Celeste, the camera wobbles in the same direction as Madeline's dash".
- Hit stop "can subconsciously increase the impact". Hollow Knight stalls on damage so you "register the mistake".
- "providing accessibility options - like turning off screen shake altogether - is a nice touch."
- "there's no such thing as a perfect camera… A slow and pensive platformer needs a very different camera to a twitchy, erratic arcade thrill ride."

### The Challenge of Cameras [bHdi5Ar8GXw]
**Core argument:** the camera serves both gameplay (seeing things) and aesthetics (intimacy, mood). When they conflict, gameplay must win. Dynamic cameras that change with context get both.
- "the camera should fit the gameplay, not the other way around."
- Being close is intimate but costs vision: "the closer you are to the character, the less peripheral vision you have."
- Batman pulls back in fights and tucks in when exploring. It changes "to fit the gameplay needs".
- Small framing tricks such as the rule of thirds make "a pleasing image".
- "good cameras make themselves invisible."

### Can you fix this platformer? / Platformer Toolkit announcement [zWi0jgghGcI]
**Core argument:** feel is best taught by letting people *feel* changes. It starts from a deliberately bad character and hands over the controls.
- "What if you could feel those changes for yourself?"
- "Kit… with… bad controls. Her run is all slippery, her jump is super floaty… boring and lifeless."
- "more than 30 sliders, checkboxes, and handles"
- "change how the camera tracks her position or enable expert platformer tricks like coyote time and jump buffer… options for making it feel more juicy, like particles and squash and stretch."
- "play an entire platforming stage… so you can see how your decisions feel in a typical video game level. And if you get to the end, I'll unlock a few special goodies".
- See the Platformer Toolkit section below.

### How to make a good platforming character (Developing 6) [ep_9RtAbwog]
**Core argument:** Mark rebuilt his character with four goals (feel, simplify input, charm, accessibility). He used tricks proven in Celeste and took effects from existing controllers. He added accessibility at "the right moment", then had an expert validate the result.
- Two gravities: "one for going up, which should feel a bit low and floaty - and another for coming back down… That makes it feel amazing."
- Jump buffer: "if you press jump a split second before you land, the game ignores your command and it feels crappy."
- Responsiveness: "you really have to cut out the anticipation part of the animation to make things feel more responsive… animations need to instantly interrupt each other".
- One-button controls: "press the button to pick up… hold it down to enter aim mode, and release to throw it."
- Timing of accessibility work: "You don't want to do it too soon when it's just a prototype… And you definitely don't want to do it too late… You want to do it now basically… hopefully final game code."
- Colour handling: "by making the magnet actually black and white by default I could then apply a colourful tint in code". When people asked, he added symbols too ("A plus and a minus").
- "accessibility stuff is pretty hard… it adds so much extra stuff to your code." He had to drop one option.
- Validation: he sent the demo to Noel Berry. It also cost him: "almost two months… I am nearing burnout".

### The Power of Video Game HUDs [4Bv45aPMGyI]
**Core argument:** a HUD is made of **gauges** (show hidden state) and **previews** (show the result of an action before you commit). Manage cognitive load with visual hierarchy ("Three Reads"), show things only when they matter, and choose how *precise* the information is, because precision changes behaviour. Design the UI alongside the mechanics: if something can't be shown, simplify the mechanic.
- Gauges: "Gauges are all about helping the player understand the current or future state of the game world". In Slay the Spire, players "ended up playing pretty much randomly" until enemy intents were shown.
- Previews: "Previews are all about giving the player a heads up about the consequences of the actions they might take, before they commit to them. This allows players to act with confidence, instead of blind faith."
- Cognitive load: "the more junk you shove on the screen, the more taxing the game is to parse."
- Hierarchy: "If everything on screen is screaming at you with the same intensity, it's hard to know what to focus on." In Hitman 3 the alert is "backed up by an obvious sound cue".
- **Zach Gage's Three Reads (SpellTower, a word game):** "The first read will be the main game elements - the letters… The second read will show big, critical rules… columns that are getting close to ending your game and blue bonus letters… the third read will show smaller… contextual rules". Information can move between reads over time.
- Context: "do all of these UI elements need to be shown all the time?" Ghost of Tsushima shows health only when your sword is drawn.
- Precision drives behaviour (Reigns): with exact numbers, "players focused almost exclusively on trying to optimise these numbers - and ignored most of the text. After changing the UI to vague bars, players went back to reading the story".
- How far ahead a preview reaches is a difficulty dial. Peggle shows the path only "up until its first hit", and "racing games often show an optimum racing line on easy mode".
- Into the Breach: "we would sacrifice cool ideas for the sake of clarity every time." Also: "if something can't be made clear to the player then maybe it's not a good game mechanic… UI isn't a band-aid to fix broken game mechanics".

### Can I fix Zelda's UI using Unity? [e4vsgC41bYg]
**Core argument:** to redesign a UI, first rebuild the current one faithfully. Then prototype several alternatives side by side and let people try them. Before calling a choice "obviously bad", find out why it was made.
- Problem: echoes "are simply added to the end of this list… by the end of the game… more than 120 echoes".
- Option 1, acceleration on held input, needed a position indicator: "it's hard to know where you are in the list… So I added an indicator".
- Option 2 groups variants (cross media bar), cutting "over 100 echoes to just 55". It "remembers the vertical positions".
- Option 3, grid with tabs, uses landscape space. A vertical list in landscape is "wasting some screen space".
- Input-method fit: a grid driven by an analogue stick is "not a great fit". Radial menus suit sticks.
- Option 4, a favourites ring, ran into Nintendo's actual intent: "we wanted players to fall upon and see the echoes that they may not have noticed… The UI is designed to make you less efficient, but more creative." Mark adds: "I'm not sure how well it worked".
- Polish: Dotween slides, "like butter in a pan"; tabs "fade out, and slightly move… enough to suggest flipping through pages".
- He shipped the options "into a little interactive showcase… let me know which one you like best".

### Can we Improve Tutorials for Complex Games? [-GV814cWiAw]
**Core argument:** split teaching up and deliver it when it's relevant, because willingness to learn grows with investment. Grow the UI and the systems gradually. Teach through small goals rather than "click here" arrows. Speed up feedback, rely on familiar conventions, show rather than tell, and let players look things up.
- George Fan (PvZ): "a player's willingness to learn grows along with their level of investment."
- Benefits: you play "the 'real game' almost immediately", and lessons arrive "when it's actually relevant… the crafting tutorial when you first find a crafting table".
- Inverted pyramid (Civ): early turns have one decision, so the game can teach as complexity grows.
- Progressive UI: "Mini Metro… At the beginning, there's almost no interface at all… more information slowly appears". In Animal Crossing you buy the tool wheel.
- Brackets (MK11): the tutorial "kick[s] you out of the tutorial menu at the end of each segment… go and play the game".
- Asher Vollmer (Threes) on arrow tutorials: "As far as the game is concerned; I have advanced. But as far as my brain is concerned; I've learned nothing." Threes asks you to "use the walls to add 1 & 2 together" instead of "swipe left twice".
- Planet Zoo: you're shown one fix, then told to "check on all the other animals". Removing the "click here" arrow "is enough to make them feel engaged."
- Slow feedback is the enemy of learning by doing. Fixes are quick modes and advisors that warn you ("I got told off for selling aluminium for less than $10").
- Conventions: "By leaning on stuff that players already know, games can feel intuitive". Counter-example: Total War: Troy's hourglass "end turn" icon, where "One player spent 40 minutes on the first turn". The lessons: "don't assume your audience has played other games… play test your tutorials. Like, a lot."
- Show, don't tell. Justin Ma: "showing that little animation… is a thousand times more effective". Also: "cut down words, be consistent with language, avoid jargon".
- A safety net: "tool tips within tool tips… if someone gets stuck you don't want their only solution to be Google."

### How Game Designers Solved These 11 Problems [rJZyPdYIbZI]
**Core argument:** good designers are good problem-solvers. Find the root problem, then iterate fast, find the levers, make big changes, flip the idea, solve it somewhere else, look for one fix that solves several problems, and watch how players behave. Afterwards, check for knock-on effects and retest blind.
- Root cause: in Dying Light the report was "weapons break too fast", but the real problem was "players could only kill a few zombies before their weapon broke". Lowering enemy health fixed it.
- Iterate to learn: "even though this might not be a solution that we're willing to ship with, it was something that was going to teach us a lot more about the problem".
- Levers: list what you *can't* change because it defines identity. In Halo the shot interval went "from 0.5 seconds, to 0.7 seconds."
- Big swings (Sid Meier): "double it, or cut it in half".
- Flip it (Shovel Knight): instead of paying to save, "what if you get paid if you don't save?"
- Fix it elsewhere: The Last of Us replaced a UI tab with upgrade benches in the world.
- Miyamoto: "A good idea is something that does not solve just one single problem, but rather can solve multiple problems at once."
- Watch behaviour: Gears' hidden "magic bullets" helped only novices, who empty their clips.
- Second-order effects (Siege shotgun nerf) and constraints: "good designers understand how to solve problems within the constraints that they have".
- Retest blind: "don't tell your playtesters how you fixed the issue as that can bias their experience."

### How to Turn Movement into a Game Mechanic [rlmVxrq-3Go]
**Core argument:** movement becomes fun through chaining, using the environment, timing windows, momentum, trajectories and physics. What they share is freedom, analogue (fine-grained) input, flow, skill and the satisfaction of performing it. Aim for "precision - but not perfection".
- "it's the player's physical performance of these skills that feels satisfying - and not just the super heroic imagery".
- "games should look for precision - but not perfection. So it's good to have systems that subtly help the player out."
- Recovery moves: "moves to save themselves from a bad jump".
- "easy to use, but hard to master."

### Designing for Disability: Deaf and Hard of Hearing [4NGe4dzlukc]
**Core argument:** subtitles should follow film and TV standards. Information that only exists in sound is a barrier, so every cue needs a visual partner. Offer separate volume channels and make subtitles available before the first line plays.
- 60% of Assassin's Creed Origins players used subtitles.
- Rules: large; "simple font… This is not the time to keep up your brand identity"; contrast ("semi-transparent black box"); short, "37 to 42 characters, and only two lines"; on screen "0.3 seconds for every word"; a visible gap between lines; speaker indicated; all dialogue covered.
- "developers should always try to avoid having critical information be conveyed exclusively through sound."
- Directional cues: Minecraft arrows and the Fortnite ring. Don't force players to mute the sound to get the visualiser.
- Sound puzzles: provide "an alternative way". Undertale patched in an on-screen answer.
- "there really isn't a thing as having too many options". Separate volumes for "effects, announcer, dialogue, music, ambience".
- Set subtitles "before a single word of dialogue is spoken".
- Cheap test: indie developers can check playability "by putting their TV on (mute)."

### Designing for Disability: Colourblindness & Low Vision [xrqdU4cZaLw]
**Core argument:** don't rely on colour alone (use shape, symbol, shading or animation). Where colour must carry meaning, allow palette swaps for specific elements, not filters over the whole screen. For low vision, size and contrast matter most, and a rich soundscape helps.
- Prevalence is "1 in 12 men, and 1 in 200 women." Test with simulation tools (Color Oracle, Sim Daltonism).
- "The best solution is to design around this issue, and simply avoid relying on colour alone".
- Symbol systems: Chromagun's combinable symbols; Hue's colourblind symbols.
- Palette swap is "the gold standard" (Battlefield 1), with "Bonus points for showing the change on the options screen itself".
- "use blue and orange as your primary colours when contrasting key elements"; brightness differences also work.
- Whole-screen filters are "rarely the best approach". The goal is "simply help players to clearly see vital bits of information."
- Size: "you should not drop below 28 pixel fonts on any UI text, and nothing below 46 pixels for subtitles" (console at 1080p). Contrast comes from shadows and outlines.
- Fonts: let players switch decorative fonts "in a standard, sans serif font".
- High-contrast mode, for example dimming the background layer: "just a black rectangle between foreground and background."
- Audio for low vision: a distinct sound for every key event. Killer Instinct added sounds for HUD meters, and "games should let you change the volume of different audio sources".
- Screen readers for "interface-driven games like Hearthstone".
- "don't rely on colour alone, focus on size and contrast, and invest in good audio… everyone will benefit… playing on a phone in battery saving mode".

### Designing for Disability: Motor [Ufe0i26DGiA]
**Core argument:** let players change *how* they control the same game (remapping, input methods, sensitivity). Reduce complexity (fewer buttons, toggles instead of holds), make micro-games skippable, and never put rapid tapping or holding in the critical path.
- Remapping in-game, not left to the system: "devs shouldn't rely on this."
- Alternative inputs: you should be able to play "with just the mouse or just the keyboard". The Witness has click-to-move.
- "forcing a player to hold down a button can make a game completely inaccessible." Offer toggles.
- Micro-games (mash, wiggle, perfect timing) "put a greater demand on a motor ability than regular gameplay". Make them holdable or skippable.
- Don't tie motor help to an easier game: "What does having a motor disability have to do with your ability to make decisions or solve puzzles?"
- Separate difficulty sliders: combat, exploration and puzzle (Shadow of the Tomb Raider).
- Rumble can be turned off, and nothing is conveyed only through rumble. Always allow pause.

### Designing for Disability: Cognitive [ObhvacfIOg0]
**Core argument:** cover motion sickness, sensory overload (flashes and patterns), dyslexia, and executive function: simple language, objective reminders, replayable tutorials, practice areas, pausing and slowing down, manual saves, and difficulty you can adjust per system.
- Motion: let players turn off "weapon bob, head bob, screen shake, and motion blur"; "use smooth transitions, instead of quick snaps and fast zooms."
- Sensory overload comes from "quick flashes and regular moving patterns". Stardew lets you change falling snow. There is also the Harding flash analyser.
- Dyslexia: "clean, sans serif font, in mixed case rather than all caps. Go for 1.5x line spacing, and avoid more than 70 characters in a line… text is on a solid background". OpenDyslexic was used by "14% of people who finished" The Last Door.
- "avoid text that advances automatically".
- Persistent objective text "where key words are highlighted… will stay on screen".
- Replay tutorials "at any time"; "optional tool-tips and help windows… even if they've already finished the tutorial."
- Practice with no stakes: offline bots, hub worlds.
- Pause with information on the pause screen. Celeste's game-speed slider.
- Fine-grained difficulty: Dishonored tweaks; Darkest Dungeon toggles.

### How Accessible Were 2019's Biggest Games? [vi98rAn4uXE]
- Resident Evil 2's audio-only Mr X footsteps were called "virtually unplayable very early on for deaf/hoh players".
- Ubisoft found that with subtitles on by default, "97% of players kept them on."
- "Text size is the area where games most frequently fail".
- Scalable UI is coming because "the same game can be streamed to your big TV or your tiny phone screen".
- Colourblind: palettes with "a preview of what those new colours will look like right there on the menu" (Apex). Outer Worlds avoids colour-only information "because one of the company's directors is colourblind."
- Difficulty language has improved: options talk about "wanting to feel like a badass - or just focus on the storyline", and some games note "which difficulty level is intended".
- Bugs that come from combining options: "boosting both the UI and the subtitles in Borderlands 3 makes the text fall off the side of the screen."

### How Accessible Were 2020's Biggest Games? [RWQcuBigOj0]
- Holding, mashing and multi-button presses remain barriers, even with remapping.
- UI scaling causes "text overlapping or buttons going off screen". Test the extremes.
- Visual noise (Hades): offer ways to make critical pop-ups more visible.
- Flashing: the Cyberpunk seizure led to a warning plus an option.
- Indie games show it's possible on a small budget. Lair of the Clockwork God offers a dyslexic font and "the ability to stop speech from automatically progressing".
- Patches can add options later (Among Us added symbols for colourblind players).
- "For every feature they add, a few more people get to join in".

### How Accessible Were 2021's Games? [-IhQl1CBj9U]
- Forza Horizon 5 "made accessibility a core pillar… would not get cut to meet deadlines."
- Reuse: "many of the smart choices in Ratchet and Clank are actually just ripped straight out of last year's Miles Morales."
- The new bar is quality, not just having options: "it's no longer that noteworthy for a game to have these features - now, they need to be robust and reliable." Example: Far Cry captions saying "animal noise" for both a bird and a crocodile.
- Virtual cursors on menus are "a nightmare for accessibility".
- Content warnings and turning off uncomfortable features (Boyfriend Dungeon). Chicory lets you turn off "everything from flashing effects to moist sound effects". Loop Hero can switch off its CRT effect and pixel font.
- Pop-up warnings before volume or brightness spikes (Life is Strange).
- Get reviewed by disabled players (CanIPlayThat, DAGERS); list the game on Taming Gaming.

### How to Make an Indie Game Trailer [4CSYA9R70R8]
**Core argument:** a trailer exists to communicate the **hook** clearly enough that people can repeat it. Show how the game plays so viewers can imagine themselves in it. Pace it with rising intensity (cold open, intro, escalation, climax, button). Make it readable: crop, hide the HUD, keep the focus point steady. Keep the sound effects in.
- "the primary purpose of a trailer is to tell players what makes your game unique."
- Ryan Clark defines a hook as "some interesting bit of information about the game that compels people to try it, or to discuss it".
- Derek Lieu: "the simpler you make an idea to share, the more it will get shared".
- M Joshua: "players can't imagine themselves inside of a game they don't understand". Baba's trailer opens with "Baba is You" becoming "Rock is You".
- Cold open: "Don't bore your viewers with exposition right out of the gate… hold back on the studio logos".
- Escalation: "Make a point to show different things with every cut."
- Climax: leave "lingering questions", then the logo, platforms, date, and "just one thing" as the call to action.
- Readability: Lucas Pope "crops the viewpoint down to only what he wants to show"; "hide interface elements like the HUD and mouse cursors".
- "keep the focus point in generally the same place between cuts."
- Perform it well: "Derek records dozens of takes… you don't really want to be taking damage or dying in your gameplay footage."
- Sound: "If you're showing a trailer with just music and no sound effects, more than likely, it feels dry and lifeless."
- "Use these ideas as guidelines, but not as a template" (Factorio's one-shot trailer).

### The Unity Tutorial For Complete Beginners [XtQMytORBmM] (process lessons only)
- Mark's way of learning: "one just learn the absolute basics… two, cement those lessons with simple exercises… three, figure out the rest as you go along."
- Write down the generic needs first: "a list of things I would need to know, regardless of what game I was going to make".
- Practise by remaking: "take another simple game and try to remake it… you don't have to worry about art or design… just code."
- He ends with hands-on challenges rather than more instructions: "I don't want to tell you how to do everything."
- Simple first, better later: use the old input system "for now… look into the new input system later down the line".

### Shovel Knight's Signature Moves [8fjCKMIE1Pg]
**Core argument:** one signature move that serves several roles (combat and traversal) defines a character. Taking control away makes it harder to learn. Showing the move's state and its preview makes it easy to "be cool". Level layouts can guide flow.
- Usability tweaks: you don't need to hold down; the hitbox is "pretty wide".
- One move unifies "the two sides of Shovel Knight's gameplay, with a single mechanic."
- "Every game is an answer to the previous one." Specter Knight was designed to "make it really easy to be cool as opposed to really hard to be cool".
- Same move length and loss of control, but Specter feels in control because it's context-sensitive and "the trajectory of the move is shown to you."
- Level cadence: "here's three enemies in a row, I know what I'm supposed to do".
- "When you put a platform somewhere people go to stand on it." Players read layouts as instructions.
- State clarity: King Knight's states "have the exact same animation with nothing to indicate a change". Compare Celeste's hair and Downwell's flash.
- Recovery options lower frustration. "Taking control away from the player is a surefire way to increase the learning curve."

### How Mega Man 11's Levels Do More With Less [nYxHMZX6lN8]
**Core argument:** a few unique elements per stage go a long way when you introduce each one alone, weave it among other challenges, combine elements once they're understood, add breathers, and include optional "secret tests" that rehearse later challenges.
- "they show up in different forms and ramp up in complexity… they get interwoven with other challenges".
- Combining: "because you know exactly how these two things work on their own, its quite achievable to face them together."
- Breathers: "an empty-ish room after the mini-boss… gives you a second to catch your breath".
- Secret tests teach optional lessons that come back: "Remember this, it will be important for later."
- "It almost has a musical quality, like a symphony where different sections get repeated."
- Mistakes to avoid: an element used in only one room, an element introduced at the very end over pits, and the same enemy "in three rooms in a row".

### The Last Guardian and the Language of Games [Qot5_rMB8Jc]
**Core argument:** games say things most strongly through mechanics, rules and roles. Breaking an established rule at the right moment is powerful. An AI companion that hesitates feels alive, but costs some fun.
- "video games speak most loudly through their design".
- Roles carry the relationship: "a stronger bond is forged when both parties help each other".
- Clear rules first: "rules like this help you understand how the game works so when you reach a room like this you know exactly what it all means".
- Breaking the rule once tells the story ("it broke a clearly established mechanical rule").
- "mechanics rules and systems you can poke at are the language of video games".
- AI unreliability: "If we did that Trio would not seem like an independent creature". But "it isn't always fun… making systems… both enjoyable and charged with meaning is a brutally difficult Balancing Act".

### The Music of Breath of the Wild (GMTK Extra) [3FWVKu1gnWs]
**Core argument:** music sets the emotional identity (melancholic and sparse). Restraint and silence matter. Music can do work: guide players, warn them, and change to reflect progress (Tarrey Town adds an instrument per resident).
- Tone: "this is a melancholic game and the quiet slow and subdued piano music really fits".
- Silence: "the music often fades out into complete silence leaving you with nothing but ambient sound and Link's footsteps".
- Place and time: per-area themes; town music changes so that "the tempo and whatnot shifts down during the night".
- Hidden callbacks: the Zelda theme plays "like a ghostly echo if you ride your horse for a great distance at night".
- Music as wayfinding: stable and shop music "can all be heard from a distance and lead you to areas of interest".
- Music as a warning: it "shifts to combat tunes when enemies spot you".
- Progress layering (Tarrey Town): "as you bring in more and more people the music starts to evolve… each additional instrument or melody comes from the main towns". The result is "tremendously full bodied music" that expresses "hope".
- "real restraint in how she withholds those banging tunes… until the perfect moment".

### How Games Do Health [4AEKbBF3URE]
**Core argument:** resource systems like health change behaviour and feeling. Pick the system for the behaviour you want: aggression (Doom), caution and tension (Souls), or a hybrid.
- "the game systems will change how the player acts and feels".
- Classic health measures "your ability to make a mistake".
- Regenerating health removes "long-term consequences"; persistent health creates tension and decisions.
- Hybrids, like segmented regeneration and Half-Life 2's dynamic drops when you're nearly dead, act as hidden mercy.
- Health as a reward for aggression: in Doom the Glory kills mean you "play aggressively and move towards enemies".

### GMTK Platformer Toolkit (gmtk.itch.io/platformer-toolkit): how it teaches feel through live sliders
From the announcement video [zWi0jgghGcI], the itch page and its comments, the camera video's closing [TdWFzpgnljs], and general knowledge of the tool. Items not confirmed from a primary source are marked *(unverified)*.
1. **It starts broken on purpose.** You meet Kit with "bad controls… slippery… floaty… boring and lifeless." Feeling the problem first gives each slider a reason to exist.
2. **Narration reveals one panel at a time.** It's an "interactive video essay". The narrator introduces a concept (run, jump, assists, juice, camera) and opens only that panel. You can skip the narration or bring it back.
3. **Every change is felt at once.** Sliders change the live character while you play, so cause and effect are seconds apart. This is the fast feedback loop from the tutorials video.
4. **The panels:** Run (acceleration, deceleration, turn speed, max speed, and air versions of these), Jump (height, duration, down-gravity, air control and brake, variable-height "jump cutoff", double jump), Assists (checkboxes for coyote time and jump buffer), Juice (run, jump and land particles, squash and stretch, trail *(trail unverified)*), Camera (zoom, damping X and Y, lookahead, ignore jumps).
5. **Designer units, not engine units.** You set jump *height* and *duration* (what you feel). The tool works out the gravity *(design intent per the GMTK Celeste research; exact UI unverified)*. Readouts and graphs of the curve *(graphs reported by users; unverified detail)* show the shape of what you changed.
6. **Presets as reference points.** Commenters report presets that imitate well-known characters (Mario, Sonic, Meat Boy, Celeste). Comparing against a feel you already know teaches faster than reading numbers.
7. **A test level that uses everything.** "play an entire platforming stage with bouncy pads and falling mushrooms and runaway sawblades - so you can see how your decisions feel in a typical video game level."
8. **Rewards at the end:** "if you get to the end, I'll unlock a few special goodies to play with."
9. **Used in teaching:** "I'm especially hopeful that it can be of use in education". One user ran it "to compare in real time" beside their own prototype.

---

## Part 2: Rule lists by topic

### Puzzles (including word and board puzzles)
1. **Goal obvious, method hidden.** The player knows *what* to do; the challenge is *how* [zsjC6fa_YBg].
2. **Build around a catch**, two needs in conflict. If there's no catch, it's busywork [zsjC6fa_YBg].
3. **Aim for a revelation, not a trick.** The answer must follow from rules the player can test, and they must be able to experiment with it more than once [zsjC6fa_YBg].
4. **Use an assumption to lead the player to the catch.** The first try fails in a way that teaches [zsjC6fa_YBg].
5. **Restrict open systems** so the cheap answer is blocked. Design backwards from the interesting solution [7zLwa4bztWs].
6. **Minimal parts.** Remove anything that doesn't serve the catch [zsjC6fa_YBg].
7. **Clear feedback.** Show the wiring. Make a dead end look plainly dead [zsjC6fa_YBg].
8. **Presentation is the difficulty dial.** You can make the same idea easier or harder through layout and hints [zsjC6fa_YBg].
9. **Curve:** order puzzles by number of solutions, steps, options per move and prior mechanics. Then playtest more than you think you need to [zsjC6fa_YBg].
10. **Teach each new element by itself first**, then weave it in, then combine it with others. Repeat it like a musical motif and leave breathers between [nYxHMZX6lN8, 7zLwa4bztWs].
11. **With randomness, provide a re-roll or escape** so being stuck isn't a dead end [2ZYAew_4tsc].
12. **Infinite undo and instant restart** remove friction [VD9TX9qGQOo].
13. **Never show something unsolvable without signalling it.** It ruins trust in everything else [VD9TX9qGQOo].
14. **Let players skip, defer or choose.** Hard and easy puzzles can then live side by side [VD9TX9qGQOo].
15. **Mix in palette cleansers** to prevent burnout [VD9TX9qGQOo].
16. **Give players a place for their hunches** (a journal). Validate in batches if you want to stop brute force [PeDNuITuJPA].
17. **Aim for delight and laughter**, not only difficulty [7zLwa4bztWs].

### Game feel and juice
1. **Responsiveness comes first.** The action happens on the frame of input. Cut wind-up (anticipation) frames from player-triggered animations and let animations interrupt each other [ep_9RtAbwog].
2. **Tune curves, not just values.** Fast acceleration and deceleration feel tight; long curves feel heavy or slippery. Choose what fits the fantasy [yorTG9at90g].
3. **Asymmetry sells feel**, such as a floaty rise with a snappy fall [ep_9RtAbwog].
4. **Forgive on intent.** Buffer early inputs, accept late inputs (coyote time), use generous hitboxes and correct near-misses. "Precision - but not perfection" [yorTG9at90g, rlmVxrq-3Go].
5. **Subtle beats loud.** Short effects (a 4-frame pause, microscopic shake) "do a lot of heavy lifting". Juice is feedback, not noise [yorTG9at90g].
6. **Direction matters.** Shake along the direction of the action [TdWFzpgnljs].
7. **Hit-stop and freezes** make impacts read. A longer stall on the *player's* mistake makes them register it [TdWFzpgnljs].
8. **Show state in the art** (Madeline's hair, Downwell's flash). Never leave two states with the same look [8fjCKMIE1Pg].
9. **Preview the move.** A trajectory line makes a powerful move "easy to be cool" [8fjCKMIE1Pg, 4Bv45aPMGyI].
10. **It should feel good in an empty room**, so test feel with no goals [yorTG9at90g].
11. **Feel and content shape each other.** Expect to retune when levels arrive, and expect to throw work away [yorTG9at90g].
12. **Smooth the camera.** Damping and dead zones; don't move for small things; move after the action settles [TdWFzpgnljs].
13. **Every juicy camera effect has an off switch** [TdWFzpgnljs, ObhvacfIOg0].
14. **When stuck on a value, double or halve it** before nudging by 5% [rJZyPdYIbZI].
15. **Find the identity levers** that must not change, then tune the rest [rJZyPdYIbZI].
16. **Validate with an expert or outside player**, ideally a blind playtest with no explanation of what changed [ep_9RtAbwog, rJZyPdYIbZI].

### Sound
1. **Music sets the emotional identity.** Choose its instruments and pace for the feeling (melancholy means sparse piano) [3FWVKu1gnWs].
2. **Silence is a tool.** Let music fade into ambience [3FWVKu1gnWs].
3. **Use restraint.** Save the big themes for the perfect moment [3FWVKu1gnWs].
4. **Music can show progress**: add layers or instruments as the player builds something [3FWVKu1gnWs].
5. **Music and sound can guide and warn** (wayfinding stings, danger shifts) [3FWVKu1gnWs].
6. **Vary with context**, such as tempo by time of day or theme per area [3FWVKu1gnWs].
7. **Back state changes with a sound cue.** Hitman 3's alert works because of sound plus visual [4Bv45aPMGyI].
8. **Fire sound in the same frame as the visual.** A trailer without sound effects "feels dry and lifeless", and so does a game [4CSYA9R70R8].
9. **Every gameplay-critical sound needs a visual partner**, and vice versa for blind players [4NGe4dzlukc, xrqdU4cZaLw].
10. **Give each key event its own sound**, the "flatlining" principle [xrqdU4cZaLw].
11. **Separate volume sliders per channel** (music, SFX, UI, voice, ambience) [4NGe4dzlukc].
12. **Write captions that are specific.** "animal noise" for a crocodile is a failure [-IhQl1CBj9U].
13. **Let players turn off unpleasant sounds** (Chicory's "moist sound effects") and warn before volume spikes [-IhQl1CBj9U].

### UI and HUD
1. **Every HUD element is a gauge or a preview.** If it's neither, question it [4Bv45aPMGyI].
2. **Preview consequences before commitment** so players "act with confidence, instead of blind faith" [4Bv45aPMGyI].
3. **Show the opponent's intent** when you want deliberate play (Slay the Spire). Without it, play is random [4Bv45aPMGyI].
4. **Three Reads**: rank everything as first, second or third read and style each tier accordingly. Things can be promoted temporarily when they matter [4Bv45aPMGyI].
5. **Show only when relevant** (contextual HUD) [4Bv45aPMGyI].
6. **Choose precision deliberately.** Exact numbers produce optimisers; vague bars produce feelers [4Bv45aPMGyI].
7. **How far ahead previews reach is a difficulty or assist dial** [4Bv45aPMGyI].
8. **If you can't show it clearly, change the mechanic.** UI is not a band-aid. Design the HUD alongside the mechanics, not at the end [4Bv45aPMGyI].
9. **Grow the UI with the player.** Start almost empty (Mini Metro) [-GV814cWiAw].
10. **Use familiar conventions.** Test icons on non-gamers; the hourglass meant "loading", not "end turn" [-GV814cWiAw].
11. **Long lists need structure**: categories or tabs, a grid that fills landscape, held-input acceleration with a position indicator, remembered positions [e4vsgC41bYg].
12. **Fit the control to the input method** (stick means radial, touch means big direct targets, mouse means a grid) [e4vsgC41bYg].
13. **Small motion polish** helps reading: slides between items, a slight fade and shift on page changes [e4vsgC41bYg].
14. **Prototype several UI options side by side and let people choose.** But first ask why the existing UI is the way it is [e4vsgC41bYg].
15. **Scalable UI is a requirement** when the same game runs on a phone and a TV. Test the extremes for overflow [vi98rAn4uXE, RWQcuBigOj0].
16. **Avoid virtual cursors on menus** [-IhQl1CBj9U].

### Tutorials and onboarding
1. **Deliver lessons when they're relevant**, not all up front. Willingness to learn grows with investment [-GV814cWiAw].
2. **Get the player into the real game almost immediately** [-GV814cWiAw].
3. **Silent teaching through early levels or set-ups** whose only solution is the lesson. Level 2 can be "everything is wrong" to show that nothing is fixed [7zLwa4bztWs].
4. **Give goals, not click-here instructions.** "Use the walls to add 1 & 2 together" [-GV814cWiAw].
5. **Show one, then let them do the rest** (Planet Zoo) [-GV814cWiAw].
6. **Brackets that kick you out to play**, then come back for the next layer (MK11) [-GV814cWiAw].
7. **Ramp systems across sessions**: first games use fewer systems [-GV814cWiAw].
8. **Shorten the feedback loop**, with quick modes and an advisor who warns about mistakes in the moment [-GV814cWiAw].
9. **Lean on real-world and app conventions.** Don't assume the player has played other games [-GV814cWiAw].
10. **Show, don't tell.** A short animation beats a paragraph. Cut words, keep terms consistent, no jargon [-GV814cWiAw].
11. **A safety net**: tooltips, a glossary, a replayable tutorial, help in the pause menu [-GV814cWiAw, ObhvacfIOg0].
12. **Multiple paths**: a scripted walkthrough *and* practice challenges [-GV814cWiAw].
13. **Playtest the tutorial with new players, a lot** [-GV814cWiAw].
14. **Clear rules first, then (rarely) break one for meaning** [Qot5_rMB8Jc].
15. **Practise against bots in a safe space** [ObhvacfIOg0].
16. **Learning to build (for Muzzy):** learn the basics, cement them with small exercises, figure out the rest while making; remake small games to practise [XtQMytORBmM].

### Accessibility: concrete checklist for `accessibility-check`
Tag each item PASS / FAIL / NOT ASSESSED. The [id] gives the evidence.

**A. Vision: colour**
- [ ] No information is carried by colour alone (player ownership, valid/invalid, tile types, score states). Each has a shape, symbol, pattern, outline or label as well [xrqdU4cZaLw].
- [ ] Screenshots run through deuteranopia, protanopia, tritanopia and greyscale simulations. Critical pairs are still distinguishable [xrqdU4cZaLw].
- [ ] Default critical-contrast pairs use blue and orange or a brightness difference, not red and green [xrqdU4cZaLw].
- [ ] If there's a colour option, it recolours *specific elements* (player colours, highlights), not a whole-screen filter, and it previews on the options screen [xrqdU4cZaLw, vi98rAn4uXE].
- [ ] Assets that need colours are greyscale and tinted in code, so palettes are cheap [ep_9RtAbwog].

**B. Vision: size, contrast, fonts**
- [ ] Text size can be adjusted (or the whole UI scales), and the largest setting doesn't overflow or overlap on the smallest phone [xrqdU4cZaLw, vi98rAn4uXE, RWQcuBigOj0].
- [ ] Minimum sizes are met at phone scale (the skill's 16px body / 12px UI minimum. GMTK's 28px UI / 46px subtitles are for a TV at 1080p across a room).
- [ ] Text sits on a solid or semi-transparent backing, or has an outline or shadow, over busy art [4NGe4dzlukc].
- [ ] Decorative or brand fonts can be swapped for a plain sans-serif. Mixed case, about 1.5 line spacing, 70 characters or fewer per line [xrqdU4cZaLw, ObhvacfIOg0].
- [ ] A dyslexia-friendly font option, **especially important in word games** [ObhvacfIOg0, vi98rAn4uXE].
- [ ] High-contrast or dim-background option, so key pieces stand out from decoration [xrqdU4cZaLw].
- [ ] Tested at arm's length on a phone, in sunlight or with low brightness [xrqdU4cZaLw].

**C. Hearing and sound**
- [ ] Mute test: the game is fully playable with sound off. Every gameplay sound cue (your turn, opponent played, timer warning, invalid move, bonus) has a visual equivalent [4NGe4dzlukc].
- [ ] Any spoken or voiced text has subtitles: large, with a backing, two short lines at most, the speaker shown, and on before the first line plays [4NGe4dzlukc].
- [ ] Separate volume sliders for music, SFX, UI and voice [4NGe4dzlukc].
- [ ] No puzzle or step needs hearing, unless there's an alternative [4NGe4dzlukc].
- [ ] Captions or labels are specific, not generic [-IhQl1CBj9U].
- [ ] Each key event has a distinct sound, for low-vision players [xrqdU4cZaLw].

**D. Motor and touch**
- [ ] Touch targets are at least 44×44 px with spacing. Hex tiles are tappable on the smallest supported phone.
- [ ] No hold-to-act, rapid tapping or multi-touch chords in the critical path. If one exists, offer a toggle or tap alternative [Ufe0i26DGiA].
- [ ] Drag actions have a tap-tap alternative (tap a source, tap a target) [Ufe0i26DGiA].
- [ ] No precise-timing requirement. If there is one, it can be adjusted or turned off [Ufe0i26DGiA].
- [ ] Can be played one-handed in portrait. On desktop, can be played with just the mouse *or* just the keyboard [Ufe0i26DGiA].
- [ ] Pause or step away is always possible in single-player [Ufe0i26DGiA].
- [ ] Haptics or vibration can be turned off, and nothing is conveyed only by haptics [Ufe0i26DGiA].
- [ ] Inputs are forgiving: snapping and generous hit areas, a buffer for early taps [yorTG9at90g].

**E. Cognitive, motion, sensory**
- [ ] Reduce-motion setting, defaulting to the OS `prefers-reduced-motion`, covering shake, zoom, parallax and big tweens [ObhvacfIOg0, TdWFzpgnljs].
- [ ] No full-screen flashes over 3 Hz. Flashes can be turned off. Repeating patterns (falling particles) can be reduced [ObhvacfIOg0, RWQcuBigOj0].
- [ ] No text auto-advances. The player dismisses it [ObhvacfIOg0].
- [ ] The current goal or turn state is always visible in plain words, with key words highlighted [ObhvacfIOg0].
- [ ] The tutorial can be replayed. Rules and help are reachable from pause or settings at any time [ObhvacfIOg0].
- [ ] A no-stakes practice mode exists (offline against a gentle AI) [ObhvacfIOg0].
- [ ] Time pressure (turn timers) can be turned off or extended in casual and solo modes [ObhvacfIOg0].
- [ ] Undo before commit, and a confirmation step for irreversible moves [VD9TX9qGQOo].
- [ ] Difficulty and assist options use respectful names ("Relaxed", "Assist") with a sentence explaining who they're for. The intended default is marked [NInNVEHj_G4, vi98rAn4uXE].
- [ ] Assist options are separate (hints, timers, AI strength), not one "easy" switch, and nothing such as the ending or achievements is locked behind them [NInNVEHj_G4, Ufe0i26DGiA].

**F. Screen reader and menus**
- [ ] Menus are real DOM buttons with labels and a logical focus order. Canvas board state has a text summary that can be read out (whose turn, score, last word played) [xrqdU4cZaLw, RWQcuBigOj0].
- [ ] No virtual cursor. Menus can be navigated by keyboard or d-pad [-IhQl1CBj9U].
- [ ] All options combined at maximum settings were tested together (combination bugs) [vi98rAn4uXE].

**G. Process**
- [ ] The accessibility pass happens when the code is "hopefully final" (core UI locked), not at the release crunch [ep_9RtAbwog].
- [ ] Accessibility is a pillar that "would not get cut to meet deadlines" [-IhQl1CBj9U].
- [ ] At least one disabled player or accessibility reviewer has tested it, or the game is listed with Taming Gaming or CanIPlayThat [-IhQl1CBj9U].
- [ ] Settings are reused across games through the framework kit (the Insomniac approach) [-IhQl1CBj9U].

### Trailers
1. State the **hook** in one sentence someone could repeat to a friend. The trailer exists to deliver it [4CSYA9R70R8].
2. **Show how it plays.** Viewers must be able to imagine doing it. Open with the core verb [4CSYA9R70R8].
3. Structure: **cold open** (strongest moment or a joke, no logos), **intro** (calmer, the mechanic), **escalation** (variety on every cut, faster cuts), **climax** (peak, then stop, leave a question), logo, platforms, date, **one** call to action, and an optional **button** (an extra beat after the end) [4CSYA9R70R8].
4. **Readability:** crop to the action, hide the HUD and cursors, build custom showcase set-ups, and keep the focus point in the same screen area across cuts [4CSYA9R70R8].
5. **Perform it:** record many takes; no mistakes or losses unless that's the point [4CSYA9R70R8].
6. **Sound:** cut to the music beats and **keep the sound effects in** [4CSYA9R70R8].
7. Use text cards or a voice-over only if the hook can't be seen. A character's voice beats a sales pitch [4CSYA9R70R8].
8. Use the rules as guidelines, not a template. Stand out [4CSYA9R70R8].

---

## Part 3: Applied to Glyphtender (cozy hex-board word game, phone and desktop, AI opponents, online)

### How to teach it
- **No upfront rules screen.** Start a real but gentle match against the softest AI. Teach each rule the first time it becomes relevant: the first word, the first special tile, the first blocked move, the first bonus [-GV814cWiAw].
- **Goals, not arrows.** "Make a word that touches your last one" rather than "tap here, then here". The Threes and Planet Zoo pattern: show one example, then "now find another" [-GV814cWiAw].
- **Silent first boards.** Hand-set opening boards (not random) whose only good move *is* the lesson, as Baba's first levels do. Make sure every early rack can make a valid word, because a random dead rack in minute one feels like a broken game [7zLwa4bztWs, 2ZYAew_4tsc].
- **Introduce each special mechanic alone, then combine.** Spread these across the first sessions rather than the first match. Optional "secret test" moments (a bonus word available but tricky) rehearse skills [nYxHMZX6lN8].
- **Grow the HUD with the player** (Mini Metro). First match: board, rack, score. Bring in the extra panels (opponent info, bag count, history) as they become relevant [-GV814cWiAw].
- **The AI opponent as a gentle advisor** in early games. A short in-character remark after a mistake gives faster feedback without a lecture [-GV814cWiAw, Qot5_rMB8Jc].
- **Safety net:** "How to play" in pause, a glossary of special tiles with a looping mini-animation each (show, don't tell), and a replayable tutorial [-GV814cWiAw, ObhvacfIOg0].
- **Playtest the tutorial on non-gamers.** Watch for icons they misread (the hourglass problem) [-GV814cWiAw].

### What the HUD needs (gauges and previews, Three Reads)
- **Zach Gage's SpellTower is the closest reference** [4Bv45aPMGyI]. **First read:** the letters and board. **Second read:** whose turn it is, any rule that threatens or rewards right now (a closing region, a bonus tile in reach). **Third read:** small modifiers, history, bag count.
- **Preview before commit:** while forming a word, show live validity and the **projected score** (plus what it unlocks or claims) *before* submitting. That is the Into the Breach and XCOM style of confidence, not blind faith [4Bv45aPMGyI].
- **Gauges:** score race, turn indicator, tiles left. Show these *only when relevant* (bag count in the endgame) [4Bv45aPMGyI].
- **Opponent intent** (Slay the Spire): for a cozy feel, a light "thinking…" with the AI's mood, or a subtle highlight of its last move, so play feels relational, not random [4Bv45aPMGyI, Qot5_rMB8Jc].
- **Precision is a design choice** (Reigns): exact numbers make players optimise. For cozy play, think about softer progress displays outside of score (garden growth?), while keeping exact score in competitive or online modes [4Bv45aPMGyI].
- **Clarity over cool:** if a special-tile effect can't be previewed clearly on a phone, simplify the effect [4Bv45aPMGyI].
- **Phone layout:** a vertical list in landscape wastes space, and the reverse is true in portrait. Lay out per orientation; give thumbs room for the rack; no virtual cursors [e4vsgC41bYg, -IhQl1CBj9U].

### Likely accessibility gaps (to verify, not yet confirmed)
1. **Player and ownership colours on hexes**, and valid/invalid highlights, are likely carried by colour alone. Add a shape or pattern per player and an outline style for valid/invalid [xrqdU4cZaLw].
2. **Letter legibility.** Letter tiles in a decorative cozy font, small on phones. Offer a plain or dyslexia-friendly font choice. **For a word game this is a core option, not a bonus** [ObhvacfIOg0].
3. **Hex hit areas on small phones**, and drag-to-spell needing fine motor control. Offer tap-to-add as an alternative with generous snapping [Ufe0i26DGiA].
4. **Turn timers online.** Offer a no-timer or long-timer casual room [ObhvacfIOg0].
5. **Sound-only cues.** "Your turn" or "opponent played" when the phone is muted. The 2026 audio sprint makes this timely: run the mute test [4NGe4dzlukc].
6. **Combinations of options.** Large text plus long words in score pop-ups or end screens may overflow [vi98rAn4uXE].
7. **Screen reader.** The canvas board is invisible to it. At least give menus and a text summary of the board state ARIA labels [xrqdU4cZaLw].
8. **Repeating ambient particles** (garden, petals) as sensory load. Fold them into reduce-motion [ObhvacfIOg0].
9. **Timing:** GMTK says the pass belongs when core UI is "hopefully final", not at the 1.0 crunch. Run a first audit as soon as the main board and HUD are stable [ep_9RtAbwog].

### Feel
- **Cozy means a Celeste-style subtle intensity, not Vlambeer.** Small tier: quick tile pop and soft click. Medium: word accepted, with letters squashing in sequence and a score number that flies to the total. Big: a rare bonus with a short hit-stop and a sound flourish. Keep "big" rare so it means something [yorTG9at90g].
- **Responsiveness:** a tile reacts on the frame it's touched. No wind-up on player-triggered animations. Long word celebrations can be interrupted by the next tap [ep_9RtAbwog].
- **Forgive intent:** generous hex hit areas, drag tolerance (a path snaps to the nearest neighbour), buffered taps during animations, undo before submit [yorTG9at90g, VD9TX9qGQOo].
- **Show state in the art**: whose turn shows on the board itself (a board tint or glow, Madeline's hair style), and the rack looks clearly disabled on the opponent's turn [8fjCKMIE1Pg].
- **Camera:** the board is mostly static (Celeste: "If Madeline is the only thing moving, it's easier"). Avoid camera moves during input. If zooming or panning on phone, damp it and never move mid-drag. Optionally a slight frame onto a big bonus, gated by reduce-motion [TdWFzpgnljs, yorTG9at90g].
- **Sound (BotW lessons):** sparse, warm instruments with room for silence. Optionally the music **adds a layer as the board fills or the garden grows** (Tarrey Town), and shifts subtly near the endgame. Every visual tier has a matching sound in the same frame [3FWVKu1gnWs].
- **Scoring changes behaviour** (Health video): decide what you want players to do (long words? defensive blocking? cozy cooperation?) and make sure the scoring rewards that [4AEKbBF3URE].
- **AI personalities through play, not text** (Last Guardian): show each AI's trait in its moves (a cautious one blocks, a show-off goes for long words), with small reactions. Avoid unreliability that makes it feel unfair [Qot5_rMB8Jc].

### Trailer and launch
- Hook in one sentence, for example "a cozy word game where every word you spell grows the board" (Muzzy decides). Cold open on a satisfying big-tier word moment. The intro shows the verb (spell, place, claim). Escalation goes through boards, AIs, online and the garden. The climax is a tense final word, then the logo and "Play free in your browser". Crop to the board, hide the debug and Dev Kit UI, keep the board in the same screen spot across cuts, and keep the SFX [4CSYA9R70R8].

---

## Part 4: BMUZ implications (concrete skill changes, tied to evidence)

### `game-feel` skill
1. **Add a "Responsiveness first" step before juice:** reacts on the input frame, no anticipation on player-triggered animations, animations interruptible, input buffer during animations [ep_9RtAbwog, yorTG9at90g].
2. **Add a "Forgive intent" checklist:** generous hit areas, snapping, input buffer, undo before commit. Phrase it as "work on the player's intent, not a precise simulation" [yorTG9at90g, rlmVxrq-3Go].
3. **Tier budget rule:** most events small, big events rare. Default to Celeste-style subtlety ("short-lived effects… heavy lifting") for cozy games [yorTG9at90g].
4. **State-in-the-art check:** list every player state (my turn, ability ready, out of moves) and confirm each looks different [8fjCKMIE1Pg].
5. **Directional shake option** (shake along the motion vector) in feel.json [TdWFzpgnljs].
6. **"Empty room" test:** before content, the core interaction must feel good with no goal [yorTG9at90g].
7. **Tuning method:** when stuck, double or halve once before fine-tuning. Write down the "identity levers" that must not change [rJZyPdYIbZI].

### `game-ui` skill
1. **Classify every HUD element as gauge, preview or neither.** Cut or justify "neither" [4Bv45aPMGyI].
2. **Three Reads pass:** label each element first, second or third read, and check the screenshot hierarchy against that ranking. Elements may be temporarily promoted [4Bv45aPMGyI].
3. **Preview-before-commit rule** for any irreversible action [4Bv45aPMGyI].
4. **Contextual visibility rule:** a HUD element is hidden until it's relevant. Grow the HUD over the first sessions [4Bv45aPMGyI, -GV814cWiAw].
5. **Precision decision:** for each number shown, write down why it's exact or vague (optimise or feel) [4Bv45aPMGyI].
6. **"Can't show it means simplify the mechanic"** is a UI-to-design feedback rule. Log it in the TDD Decisions [4Bv45aPMGyI].
7. **Icon convention test:** each icon needs a label or a common real-world meaning. Flag game-jargon icons [-GV814cWiAw].
8. **Long-list pattern** in the kit: tabs or categories, grid per orientation, held-input acceleration with a position indicator, remembered scroll position [e4vsgC41bYg].
9. **Ask why it's like that** before redesigning existing UI (it may be intentional friction), which matches CLAUDE.md's Skeptical Self-Review [e4vsgC41bYg].
10. **Scale stress test:** screenshot every screen at maximum text size on the smallest phone and check for overflow [vi98rAn4uXE].

### `accessibility-check` skill
1. **Replace or extend the checklist with Part 2's A–G list.** Key additions the current skill lacks: the mute test, element-specific palettes rather than filters, the dyslexia font (flagged as **core for word games**), no auto-advancing text, a tap alternative to drag, a turn-timer opt-out, respectfully named and separate assist options, the option-combination test, and a canvas text summary.
2. **Run simulations automatically:** Playwright screenshots, then CSS or SVG colour-blind filters (deuteranopia, protanopia, tritanopia, greyscale), and compare critical pairs [xrqdU4cZaLw].
3. **Add a "timing" note:** the first audit runs when core UI is stable, not at release. Add a roadmap line "accessibility audit 1" well before 1.0 [ep_9RtAbwog].
4. **Make the colour-tint pattern a framework module:** greyscale assets tinted from `content/ui` palette JSON, giving player-colour presets with a live preview in Settings [ep_9RtAbwog, xrqdU4cZaLw].
5. **Quality bar:** check that options actually work (2021: "robust and reliable"). Each option needs a test or screenshot proving it has an effect [-IhQl1CBj9U].

### Dev Kit tools (inspired by the Platformer Toolkit)
1. **Presets as reference feels.** Save and load named snapshots of feel.json and anim.json ("Calm", "Snappy", "Muzzy 2026-10-09"). An A/B toggle switches between two presets instantly. Comparing against a known feel teaches faster than reading numbers [zWi0jgghGcI]. (content/snapshots/ may already partly support this.)
2. **Designer units:** expose what is felt (duration in ms, overshoot amount, "how far it pops") rather than engine values [zWi0jgghGcI].
3. **Live curve graphs:** draw the easing curve next to each timing slider so Muzzy *sees* the shape (Toolkit graphs).
4. **A "replay this moment" sandbox:** buttons that fire a small, medium or big word event on demand while sliders change. Feel the change in seconds instead of playing to the moment. This is the instant feedback the tutorials video says learning needs [zWi0jgghGcI, -GV814cWiAw].
5. **Assist checkboxes as toggles** (input buffer, snapping tolerance, undo) with the reason for each, so Muzzy feels what forgiveness does [zWi0jgghGcI].
6. **Accessibility preview toggles** in the Dev Kit: colour-blind simulation, max text size, reduce motion, mute. One click to see the game the way those players do [xrqdU4cZaLw].
7. **"Show the options side by side"** pattern (Zelda video): when a UI or feel decision is open, build two or three variants switchable in the Dev Kit and let Muzzy pick by feel, not from descriptions [e4vsgC41bYg]. This matches the CLAUDE.md rule against choosing blind.

### New `onboarding` step (in `/define` and `/develop` before 1.0)
- **In `/define`:** write a "teaching map" in the GDD: each rule or mechanic, the *moment it first becomes relevant*, how it's taught (silent set-up, goal prompt, show-one-then-you), and its safety-net entry (glossary, help). Mechanics are introduced one at a time, then combined (Mega Man) [-GV814cWiAw, nYxHMZX6lN8, 7zLwa4bztWs].
- **In `/develop`:** build hand-set opening boards and goal prompts (no "tap here" arrows), a progressive HUD, a replayable tutorial, and help in pause.
- **Verification:** a "fresh eyes" playtest with someone who has never seen the game, given no explanation. Log every stall over 30 seconds as a bug (Total War's 40-minute first turn) [-GV814cWiAw, rJZyPdYIbZI].

### `/deliver` trailer and launch step
- Add a trailer checklist: a one-sentence hook, the five-beat structure, a capture mode (Dev Kit "trailer mode" that hides the HUD, debug, cursor and Dev Kit, plus custom showcase boards and a seeded AI), many takes, SFX kept, and one call to action [4CSYA9R70R8].
- **Capture mode is a cheap, high-value Dev Kit addition**: set up showcase boards from `content/` JSON, so the same staged moment can be recorded repeatedly.

### Process and problem-solving (for `mda-analyze`, `/bug`, `/develop`)
- **Root cause before fix:** restate the reported problem as the player behaviour behind it (Dying Light). This fits the MDA "diagnose the behaviour, pick one knob" rule [rJZyPdYIbZI].
- **Prefer fixes that solve several problems at once** (Miyamoto). Look for hidden help for novices, like the Gears magic bullets. For example, the AI eases off slightly when the player is far behind, but never visibly [rJZyPdYIbZI, 4AEKbBF3URE].
- **Check second-order effects** after every balance change, and re-run the sim [rJZyPdYIbZI].
- **Blind retest:** don't tell Muzzy or testers what changed when checking whether a fix worked, where practical [rJZyPdYIbZI].
- **Muzzy's learning:** when he wants to understand a system, use Mark's three steps: a tiny basic, one small exercise in the Dev Kit, then learn while building [XtQMytORBmM].
- **Protect against burnout:** Mark burned out after two months on one controller. Keep sprints feature-sized; this supports the "Keep Muzzy focused" rule [ep_9RtAbwog].
