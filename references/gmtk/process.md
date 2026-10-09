# Mark Brown (GMTK) as a game developer — process research for BMUZ

Researched 2026-10-09. Sources: 30 full transcripts I read myself (YouTube auto-captions turned into text, in `scratchpad/gmtk/a/t_<id>.txt`), plus the Word Play Steam page, all 18 Word Play Steam news posts (demo patches 1.01–1.04, launch patches 1.02–1.10, the "accessibility", "what's in the full version" and "play in another language" posts), **all 1,013 English Steam reviews of Word Play** (`a/wp_reviews.json`; 913 positive / 100 negative) and the top Mind Over Magnet reviews (`a/mom_reviews.json`; 1,108 / 146), and gmtk.substack.com, gmtk.itch.io. Thinky Games pages were blocked (403), and I found no long-form Word Play interview or podcast. Mark's own videos are the main source.
Quotes are exact caption text. Small caption glitches were cleaned up. The YouTube video id is in brackets.

**Timeline at a glance**
- **Mind Over Magnet (MoM):** announced end of 2021 → Unity learning → prototypes → 30-day MVP (Jan 2022) → feedback → new character controller → tools + demo 2.0 → long breaks → puzzle matrix (Jan 2023) → GDC Mar 2023 → 6-month break → **the plan** (Trello) late 2023 → World 1 polished (Dec 2023) → art redo + trailer + Next Fest (Jun 2024) → content cut + lock (Aug 2024) → launch 13 Nov 2024. That's about 3 years, of which only "about nine of those months" were real work by month 24 [B6auN-GIUeM]. About 2 hours of play, 88% positive, consoles in 2025 through a porting studio (Alchemy Games) [lgG_vfbDPeo].
- **Word Play (WP):** two-day Patreon jam prototype "Wordy" (Dec 2024) → fresh Unity project (Jan 2025) → roguelike layer (Feb–Mar) → GDC playtesting (Mar) → broke his arm (Apr) → public demo plus announce plus let's play (late May) → Next Fest (Jun) → launch **14 Jul 2025**, $7.99 with 10% off for a week → 9 patches in 5 weeks → 1.10 (May 2026) → iOS (Jul 2026), free trial plus a single $5 in-app unlock [JFG0GMCMLgs]. **7 months.** It "has already sold more than twice the number of copies as my previous game" [8tHJgtbj6rs]. 89% positive.

---

## 1. Per-video takeaways

### Developing 1 — How I learned Unity without following tutorials [vFjXKOXdgGo]
- Following tutorials step by step taught him nothing: "everything they had said had gone in one ear and out the other". He almost cancelled the whole series because it felt so bad.
- His three-step formula, carried over from learning Premiere: "learn the absolute basics and nothing more… familiarise myself with those basics through repetition and simple projects… slowly, over time, build a repertoire".
- He learned by **cloning tiny games** (Flappy Bird, Pop the Lock). The art and design are already done, so the only question is "can I take this game and recreate it, in Unity, by myself?"
- He split the clone into the smallest steps possible: "step one, make a bird appear on screen. Step two, make it drop. Step three, make it flap."
- He played the original to "reverse engineer it to get a sort of quasi-design document". Spec first, then build.
- His goal was familiarity with the tools, not covering everything: "there is an infinite number of ideas… all you can really do is build familiarity with your tools", so that he knows "what to type into Google".
- **For BMUZ:** this is how Muzzy learns too, by doing small, complete things. When Muzzy wants to understand a system, a tiny clone works better than a walkthrough.

### Developing 2 — The mistake every new game developer makes [ZMbIvmv25u0]
- His childhood projects all died the same way. He started with art, story and polish (Carter's Curse: "I made loads of different characters, I made finishing moves… menus with big juicy buttons"). Then he found out "the game wasn't any good!"
- The core lesson: "the game design is not equal but instead it is the foundation upon which all the other parts sit… if the gameplay is fundamentally flawed well the whole project can sometimes be unsalvageable."
- He names the two wrong assumptions: (1) "it felt kind of cool in my head, so I just kind of assumed that the game would be fun", and (2) "I'm not able to find out if the game is fun until I've built the game."
- "The best game designers know that their brains are horrible smelly liars." Build a prototype instead.
- Prototype discipline: "art… pull stuff off Google Images. There's going to be no music, there's no story… I'm not gonna start designing an app icon". He uses downloaded character controllers and built-in Unity components. Don't build what you can borrow.
- **The prototype found a better idea.** He swapped Mario for a magnet sprite, which led to "what if the character is not magnetic, but there is a magnet in the game world". "Prototypes aren't just a way to test… they are a way to generate new and even better ideas."
- He admits to backsliding: "I didn't show you the entire week I spent looking at particle effects and shaders and UI elements… I caught it in time and scrapped that prototype."
- His test that something is worth pursuing: it's original, it allows platforming and puzzles, "ideas for this game just flow really easily", and "I can just… pick up a controller and it's quite enjoyable."

### Developing 3 — Why is it so hard to make game design decisions? [eE05LjNNenQ]
- The new mechanic quietly changed the genre: "I didn't just change the game's main mechanic… I also ended up changing the game's genre."
- Abilities against puzzle design: "if you give them way too many abilities, it's really hard to make walls that can hold the player in." The fix is to ration abilities across the game, like Portal does.
- Hidden micro-decisions: "game development has all of these kind of unforeseen interactions between different elements… you have to actually decide what the outcome should be."
- The 1 a.m. panic: the puzzles felt "small and claustrophobic", so he built a platformer level at 3 a.m., and now he had one great level in each of two genres. "This is like playing Super Meat Boy and then suddenly having a level where you have to play a round of chess."
- **Kill your darlings / listen to the game:** "If this game was a giant magnet, it would be constantly pulling towards a block that says puzzle on it… does it really matter what I want to make? Surely the most important thing is what's best for the game."
- **Analysis paralysis is not scope creep:** "I'm making small, tentative steps into lots of different paths but never making the decision to go down in any one direction." The cause: "I worry that it will block me from being able to explore other ideas".
- The cure came from Oliver Granlund (Hazelight): "adapt the game jam mindset… set an arbitrary time limit (that you're probably gonna overshoot)… make five levels… a minimum viable product… focus on shipping this."

### Developing 4 — Did I complete my 30-day challenge? [0lhjLNYopHM]
- He planned the 30 days as 5 days for the character, 5 for level 1, 15 for levels 2–5, and 5 for meta and polish. "Spoiler alert: I… missed something important." The missing piece was playtesting.
- Scrappy shortcuts that turned into charm: "cut its legs off and replace it with a wheel"; floating hands on a springy joint, which "actually looks pretty cool".
- He wasted a day on an over-built enemy AI ("absolutely overkill… cut my losses and just made a really simplistic enemy").
- Level design on a whiteboard: draw small scenarios, photograph them, then order the photos for "a nice sort of casual incline of difficulty".
- **Context switching kills momentum:** "every time I stop development to go work on a YouTube video, I lose a lot of momentum." Messy tools made it worse ("loads of little bug fixes and last minute patches… makes even the most simple and easy levels more tedious").
- **Radical scope cut to ship the MVP:** "from like 35 scenes down to about 14."
- **"Put sounds in early."** On day 22: "whoa! I should have done this way earlier… even something as simple as a button coming on and off, if you have a simple sound effect with it, it just works so much better."
- His wife's advice: fix the annoyances before a feedback round, because "you don't want people getting bogged down in all the little bugs and glitches". He then ran days of family playtests (dad found bugs, brother found cheese, 8-year-old nephew broke it). Those filled days 24–29.
- His three MVP rules: (1) "your singular focus", (2) "factor in play testing. Give yourself at least five days", (3) "you don't actually need loads of content".
- Definition: "a prototype is a way of testing the viability of a mechanic, but an MVP is a way of testing the viability of that mechanic within a larger game structure."

### Developing 5 — What did people think of my game demo? [OyWtPQfehKc]
- The feedback came through Discord, Patreon, itch, surveys, let's-play videos, Zoom screen-shares and pro devs. He turned it into a list of **"action points"**.
- Character feel was the top complaint, and he already knew it. He hadn't fixed it because "if I radically changed the character I'd need to go back and change all of those levels". Lesson: lock the core feel before building content on it.
- **Design language and consistency:** "people… build up a mental model of how the world works… if those rules are then randomly, arbitrarily changed the player has to throw out their mental model". Action: "focus on clarity and consistency". Colourblind clash: "green and orange buttons are basically indistinguishable".
- Mixing genres confused players about which skill to bring. A tester said: "I'm having a hard time spotting when a puzzle involves me thinking things through and when it just needs me to dash in." So he went all-in on one: "just try and focus on doing one thing well".
- "Puzzles are essentially impossible for me, the designer, to test: I already know the solution."
- Cluttered puzzles happen because patching every skip adds a door here and a laser there. Oliver's diagnosis: "the problem is a gap in your toolbox… some kind of game mechanic that you are missing."
- "Don't make players wait for cycles to reset." Waiting discourages experimenting.
- **The airlock** rule for bugs: "nothing can pass through that lock until it has gone through really rigorous testing".
- **The surprise:** "it doesn't feel to me like the magnet is the core of the game". New pillar: "pretty much every single scenario in the game should involve you using the magnet in some way." Also, "Nintendo… makes its game mechanics more crucial by turning them into characters."
- The cost of feedback: hearing the same point repeatedly "is a bit tiresome". The gain: "seeing people get frustrated at certain things told me exactly what I should cut out."
- What next: "essentially scrap the whole MVP… it's kind of like a Jenga tower of bugs and mistakes."

### Developing 6 — How to make a good platforming character [ep_9RtAbwog]
- He set **four written goals** before coding: feel, a one-button aim, charm, and accessibility. He ticked each one off on camera.
- He started from a small borrowed controller and tuned the numbers: "two types of gravity… one for going up… another for coming back down".
- The feel checklist: jump buffer, coyote time, variable jump height, a capsule collider for corner rounding. Juice comes after (dust, tilt). Animation: "you really have to cut out the anticipation part… so the robot just like immediately pops up when you hit jump."
- **When to add accessibility:** "you don't want to do it too soon when it's just a prototype… And you definitely don't want to do it too late… retrofitting… would be a nightmare. You want to do it now basically." He added remapping, toggle-aim, snap aim, turning off particles and shake, a colour tint plus +/− symbols (suggested on Twitter).
- He had to drop one accessibility option because "it just added so much extra junk to an already messy and oversized script".
- He validated with an expert (Noel Berry of Celeste) and Patreon builds.
- Energy management: "this one single character… took almost two months… I am nearing burnout… part of game dev is being aware… of your productivity and energy and mood."

### Developing 7 — The stuff no one tells you about game development [iAxSqi5LBDM]
- The unglamorous stuff is real work: "menus, the heads-up display, saving and loading data, supporting different controller types, syncing options, tracking progress, doing level transitions".
- Architecture lesson: persistent managers (options, transitions, music, HUD, UI, progression) "decouple the meta level game logic from the moment to moment level design". The MVP had "a duplicated version of the pause menu in every level".
- Level order is data: rename files to reorder levels. "I can change the order of the levels just by renaming the files." The unlock count is "a number that I can very easily change as I tweak the balance".
- **"Unity is a tool for making games, but it's not a tool for making my game — because that's on me."** If a change "is just a rote sequence of steps, I might as well build a simple script that can do it all in a single button press."
- Tools made content fast without him noticing: "Did I just accidentally make a video game?… it's worth putting in a little bit of extra effort… at the beginning".
- "Future Mark problems" (sound, UI art) start to stack up, and he says so out loud.

### Developing 8 — Three things that inspired me to finish my game [05qcUU9DzQE]
- Watching players have "aha" reactions felt "almost like casting a magic spell on people", and that motivated him.
- **Platformer Toolkit** was a speedrun of the same process: "quick and dirty prototypes… a minimum viable product… released demos early… in the space of a few weeks". It shipped because the jam deadline forced it. "Finish this thing now or it will never get done."
- Why finishing matters: "flush this thing out of your brain… you kind of get permission to move on".
- **A competitor gave him a scope reference:** Elechead was short and simple and still loved. "In my head, Untitled Magnet Game was kind of impossibly large… that level of scale and scope… does feel attainable."
- "Today is another day. I am future Mark." He then did the parked work: the final magnet cast, generic components (one resizable magnetic panel instead of bespoke objects), sound effects, and backgrounds.
- He reinvented nine-slicing because he didn't ask first ("felt like a bit of a doofus for wasting so much time").
- Backgrounds within his limited art skills: "visually interesting… but… easy for me to make… and also didn't distract too much from the more important puzzle elements". Modular parallax plates that can be re-coloured per world.
- Level transitions came straight from feedback (people disliked being booted back to the hub).

### Developing 9 — How I make puzzles for my indie magnet game [akeVPZLZejY]
- "Make an interesting puzzle" is too vague a goal, unlike coding a mechanic, which "would always begin with some kind of goal". Vague goals killed his motivation.
- **The puzzle matrix** (from Patrick Traynor): put the mechanics along both axes, and each cell is a pair to explore. "Start playing around… looking for interesting interactions… that can be the solution… then I can essentially work backwards to create a level where the only way to solve it is to do that one thing."
- "It's all about giving me that prompt… Just some kind of structure to help me find ideas."
- Rules of thumb he learned: the number of available actions ("too many… overwhelming… too few… do the thing… until they solve the puzzle… without actually solving it"); lure players into a wrong assumption.
- Each "blocker" mechanic he built became a reusable tool. He also swapped mechanics for ones that combine better (lever → fan).
- He improved tools again: wiring a button "can be done with a single click… I want it to be as friction free as possible".
- **The puzzle bible:** one Keynote slide per level listing its mechanics. Gaps in the teaching order ("the fourth puzzle adds orange buttons, green buttons, laser beams, and moving platforms — woah… Slow down!") became new level briefs.
- "Puzzles… are something where the creator just cannot gauge their quality or difficulty."

### Developing 10 — Don't make this assumption about your players [2G84mU3WPaE]
- Patrick Traynor's advice was to make it clearer what the player *can't* do ("if a gap is too big… it should be a really big gap") and to "simplify the levels, even if that meant making the game easier". Mark "roundly ignored" it at first.
- The key playtest was his dad: frustrated, handing over the controller. "The most important playtest in this entire development process."
- The mistake: he assumed players would find it too easy, so he added steps, traps and red herrings. "I was focused so much on making the levels hard, I had forgotten to make them fun… I never actually checked that assumption."
- After simplifying, players at GDC got stuck "for like a minute or two and then… that sort of wide-eyed aha moment". Also: "I hadn't gone far enough."
- The second assumption: obvious things he never taught ("so obvious about my game that I didn't feel the need to have them as puzzle solutions or tutorials").
- Tips: play with your hands swapped (Miyamoto); thinking like a player is "a skill that you can hone"; "watch other people play… in the same room"; test with all skill levels; "spend more time watching how your playtesters play than listening to what they say" (his nephews: "One million out of— I love it!").
- **Target audience:** he worried about puzzle experts, but "they're not in my target audience". He wanted fans of gentle puzzle games (Toki Tori, Box Boy, Inside, Limbo, Portal).
- "Don't be afraid to start stuff from scratch… start the level again but with the knowledge you have acquired while doing that rushed first draft." His video scripts go through "five or six different revisions".

### Developing 11 — The one thing you need to finish your game [B6auN-GIUeM]
- After GDC he "didn't work on the game for 6 months straight… in development for about 24 months, I've only actually worked on it for about nine".
- **Root cause: no plan.** "I'm just kind of aimlessly noodling around, hoping that the game will eventually just coalesce by itself".
- **When to plan:** "when you first start working on a game… avoid planning as much as possible… But once you've made your prototype and figured out what makes your game fun… you're going to need to make a plan." The plan says "what is going to be in this game and crucially by extension what's not."
- His plan: a high-level task list (name, levels, story, Steam page), then a sub-plan per task when he starts it. Levels: **50 levels in 5 worlds**, "as conservative as possible".
- **The content formula:** each magnet gets about 4 intro levels, and each mechanic gets 3 levels: "a tutorial… an actual puzzle… a harder puzzle or a level that subverts the mechanic… or pairs the mechanic up with another". "I've basically filled out the entire game." Result: "four or five levels in a single day… around 40 final levels" in about a month (plus "100 drafts").
- The plan bends without breaking: he moved magnets between worlds and added playtester ideas, but "caught it early". "There's a big difference between slightly altering a plan and just randomly aimlessly noodling around in the dark."
- **The plan cures burnout:** "when you get burnt out on doing one type of game development… you can look at the plan and find something else to do".
- **Naming:** his own ideas were bad, ChatGPT was worse ("MagniMech: Factory Fugitive?"), and a friend suggested "Mind Over Magnet". Logo feedback from Discord (the letters attracted to the magnet "a").
- Steam page late: "Conventional wisdom suggests… as early as possible… better late than never." The process: a $100 fee, a business certificate, 5 screenshots, capsule art.
- "It means every game dev session has purpose."

### Developing 12 — How I polished my indie magnet game [n8bqjpq0MIw]
- From the plan he built a **rough draft of the entire game** (blueprint visuals). "It did at least allow me to see the game as an entire finished product". Then he finalised it **one world at a time**.
- Even a pro couldn't solve "the tutorial". "Leaving the magnet behind is a mechanic", so teach it first. He fixed it by reordering levels and adding a bridge level, not with hint art ("a suspicious lump… didn't work").
- **Grey-box until the layout is final:** the plain blue tiles "meant I could focus exclusively on puzzle design… I could easily change things". Then he "painted over" the levels.
- The art pipeline: swap the tile set with a bucket fill, background plates, a gradient wash ("should never compete with the actual important puzzle elements"), a simple-backgrounds accessibility toggle, rule tiles plus random variants, tinted grayscale props.
- Sound: wire up a sound whenever a mechanic is built. For the rest, do Foley over a recorded clip in a video editor so the sound fits the animation.
- **Additive vs multiplicative polish:** "additive… unique background art that only appears in a single level… multiplicative… Magnus's eyes follow you… improve every single stage… focus your time and effort on the polish that's going to get the most bang for your buck."
- He built a bark system, but "it could easily become too annoying… subtly man[aged]".
- The boring meta work counts as polish too: a week on the options menu, save/load. Visual hints with dotted lines "you don't need to speak English to get it".

### Developing 13 — I just changed my entire game [UlzgvZqig40]
- 1080p made his pixel art scale badly. He tried 3 compromises over months, then **redrew everything as vector art at 3×**, and "it didn't actually take as long as I thought". "I probably spent more time trying to find a good compromise than I spent just remaking the art assets."
- Two lessons: "just plan ahead" (the sprites were made before the camera system existed), and "sometimes it's just better to bite the bullet… In the future I'm gonna save myself some time by just skipping ahead to doing the real solution."
- **Trailer before the game is done:** "fake it until you make it", using untested levels with in-progress art that's "pretty indicative". It was cut on drum stems. Arc: simple → introduce the character → rapid montage → wishlist call to action. Recorded in 4K so he could crop to 1080p. It took a day and pushed wishlists past 30k.
- **Next Fest timing:** Balatro and Pepper Grinder launched 2–4 weeks after Next Fest, so he aimed for that.
- **His weekly production loop** (inspired by Valve's Portal playtesting): "Tuesday through Thursday I work on new content… On Friday I work on bug fixing… export a new build… give it out to… a maximum of three playtesters. Then on Monday… watch the whole video through and make as many notes as possible."
- Why only 3 testers and why Friday: "too many people in one go… way too much footage… if one person stumbles upon a bug… see that same thing crop up in nine more videos". Mid-week builds left him "stuck… until I get the playtest footage back".
- The result: the oldest content gets the most passes, so it's "now starting to get seriously polished".

### Developing 14 — Was Steam Next Fest worth it? [1aB23SbsZa4]
- He hired out the two things he couldn't do well: **music** (Zach Jones, picked from over 850 applicants because he sent specific tracks that fit, which Mark dropped into the game to test) and **Steam capsule art** (Grayson Evans).
- Austin Wintory's advice on briefing a composer: "Just try to articulate the emotion… Don't question how we get there." And: "Assume that what I send you first is not going to be it… 'two clicks west and one south'."
- His feedback note on draft 1: "too clubby… loud and harsh drums… cognitively overwhelming, which is not good when you're trying to learn game mechanics or solve puzzles… more light and optimistic". Draft 2 was perfect.
- Collaboration lessons: you don't have to make everything; you don't need to speak their language; "bake revisions into your contract".
- He soft-launched the demo on itch a month early, got 10k downloads (featured), and found that the Mac build crashed, so he shipped Windows only.
- Valve rejected the build three times (wrong branch, Mac build uploaded, wrong exe path). After that: "I'm not messing with that thing again."
- Next Fest: about 1,800 demos, 300+ puzzle games. **9,640 players → +3,961 wishlists**, 40k+ total.
- **The feedback spreadsheet:** category (bug / idea / accessibility), description, "how much I agreed… one to five", and "**counted the number of instances**". People were "not biased by seeing feedback from other people".
- The top feedback was "Uni… moves too slowly". He had a secret debug run button himself. He sped the character up 20% even though it broke puzzles: "Sometimes you just have to take the difficult decision."
- People comment on trivial things (a water-drip animation) because "it's sometimes just a lot easier to point at… trivial background things… than… level flow or difficulty". Or the demo is simply "overall fine".
- Was it worth it: feedback, a "practice launch" of Steamworks, and "a really strict deadline".

### Developing 15 — The hardest thing about finishing a game [rIUkuB4WLss]
- The plan (50 puzzles, 5 worlds, 3 magnets, an involving story) clashed with his deadline (finish in 2024). Other developers told him "very few games ship with all of the ideas… it's super common for a game's scope to change at the very last minute". Examples: Wind Waker dungeons, Shadow of the Colossus' 48 colossi.
- **He cut:** about 40 puzzles, 4 worlds, 2 magnets (dropped Max, merged abilities), the scissor gate, the mighty magnet, and the story ("does my game really need an involving storyline?").
- With the whole game playable end to end, "I could make much smarter decisions about how to spend those last few weeks". He then put back a little (a better story twist, the scissor gate, more levels for the finale, a short 5th world as a high note, world transitions).
- **Content lock:** "At some point I had to just decide to lock down the content… from that point on, to focus my attention exclusively on polishing and playtesting."
- "When I was producing new content, the game was getting longer, but it wasn't really getting much better. But now I'm focusing exclusively on polish, the game is just getting better and better with every update." He was "playtesting the game almost every single day".
- Hint discoverability: a pop-up appears when you've been stuck a while, because testers didn't know hints existed.
- "There is no finish line… You just have to stand up, say 'this is it. I'm done. I've called it.'"
- He set the release date 3 months out and spent those months on polish, playtests and marketing only.

### Developing 16 — I made a game about magnets [dWe1pm5zbPw]
- One sentimental feature after content lock: developer commentary nodes, a nod to Valve.
- **QA:** a "crack team" from Discord found almost 100 issues. A spreadsheet score from "1… inconsequential visual glitch… up to 5 for critical game-breaking", sorted so the important bugs get fixed "before running out of steam and just kind of going 'eh, it'll be fine'". There were several QA rounds because fixes caused new bugs.
- Press keys went out before launch. The credits are long (contractors, Discord coders, Unity assets: Text Animator, DOTween, a scene picker).

### What it's like to release a game on Steam (MoM postmortem) [5ycSvC0ZM0k]
- He's honest about his advantages: a Discord of helpers, "summon hundreds [of playtesters] with a single tweet", and his audience. "Set your expectations realistically."
- Numbers: **50k wishlists → 5,000 sold the first night (10%) → 10,000 in week 1 (20%) → 12,446** at recording. Steam featured it on the front page; it was Deck Verified the day before launch.
- **Money:** of every 100 earned, about 10 goes to taxes, fees and refunds, 27 to Valve, 5 to contractors and 15 to corporation tax, which leaves **about 43**.
- Launch week: he rested for 4 days, then made a bug spreadsheet, fixed Mac achievements, around 20 cheesable levels, controller-glyph overrides and a level select. **He kept speedrun bugs** and the launch build available as a beta branch.
- Reviews: 88% positive. Praise went to feel, polish, juice, controls, sound and music, and "aha" puzzles. Complaints: **too short (~2 h)**, **too easy**, and "**bland, safe, uninspiring, unimaginative… not a very personal experience. You don't get a lot of me in this game.**" "I agree with all of them, and I saw pretty much all of them coming."
- Price: he compared similar-length games and left "wiggle room for all of the inevitable sales". Refunds were about 2%.
- **What went right:** tools ("I don't regret any of the time I spent building these tools"), juice ("make it feel better than it actually is"), playtesting ("no aspect of the game was not improved"), accessibility "baked into the code from basically day one", and hints that are "actually hints" plus a skip after 3–4 minutes stuck ("never has a total brick wall").
- **What went wrong:** "rushing too fast into production… you shouldn't have to change all of the art assets in your game within the last few months… because you hadn't previously figured out how far the camera is going to zoom out". "No roadmap, no milestones." "Focused a lot of time on stuff that really didn't matter" (a full day on handing the menu cursor between mouse and controller). He picked a hard genre ("Puzzles are like a craft in of themselves"), and "a dumb idea to also have a heavy physics element in a puzzle game".
- On working solo: he spread "a pretty limited skillset… across a really wide spectrum", and "Still, if I do ever make another game, I will think about which aspects of the game I can delegate."

### Sorry I stopped posting, but I made another game (WP announce) [MHKRWmfcMBw]
- The prototype took **2 days** and checked words against "a nifty open source dictionary with about 200,000 words". Starting upgrades: length multipliers, letter multipliers, a wildcard, and hold-and-refresh.
- **Signal of appeal:** "Almost everyone I showed the game to got a bit hooked… one person… played this scrappy two day prototype for more hours than… the entire campaign of Mind Over Magnet… as soon as one person posted a screenshot of their results page, everyone wanted to have a go." (A shareable results screen helped it spread.)
- "I threw out the prototype code and started from scratch, with the goal of making a more stable, playable, and adaptable game."
- **Early quality-of-life work for the full version:** controller, keyboard typing, drag and drop, mid-run save.
- What makes it fun: "if the game is just 'find the longest word in this grid' over and over again, well that quickly gets boring. So I had to add in things to mix that up. Like make shorter words, use specific letters, don't use letters". Special rounds exist to "break up the game loop".
- He tested at universities, meetups and GDC. At GDC he applied feedback overnight: "wake up at 3am because of jet lag, and then immediately apply all of the feedback from yesterday's sessions".
- **Cut the invalid-word penalty:** "everyone hated this. Especially those who don't speak English as their first language, or they have dyslexia… sometimes you have a word that you really think is a word, but it's not in my specific dictionary… It just didn't feel good. So I took that out".
- **Filtered feedback against his vision:** he refused a cartoon mascot ("a video game version of a GMTK video") and refused Balatro-style infinite scaling ("a tabletop, Scrabble-esque game with smaller, easier to digest numbers"). Section 2 shows what launch reviews said about the second choice.
- His sound designer found him: a Discord user made a spec sound video over his animations, and Mark hired him.
- A perk count as a marketing target: "bring the total number of perks up to 100. That feels like a nice round number to put on the Steam page."
- Mobile pricing: "paid apps don't really work on those stores". He shipped with a free trial plus a single in-app unlock.

### How I Made Word Play [uuXrwA9nzM8]
- **Layer 1, December–January:** "not worry about things like perks, or rounds, or rogue-like elements — but to just build a really good spelling game. Something where it was nice and juicy to spell words. Something that would work seamlessly across mouse and controller, and keyboards, and touchscreens." He added shuffle and a letter bag.
- **Layer 2:** the shop, perks, and special-tile architecture. The first 11 perks were "mostly just there to test different functions".
- **The competitor scare** (Wordatro on a famous YouTube show): "I briefly considered cancelling… I definitely regretted not showing this thing earlier… The only thing I can control is how good my game is." Then Birdigo showed up, and "it feels less like I'm competing… and more like I'm part of a growing genre". The three later sold a "Wordy Roguelikes Bundle" together.
- **The name came from a design fix:** "you use a life every time you spell a word. So it's a bit weird to lose a life when you do something correctly." Discord suggested "plays", which gave "Word Play", and the name was free on Steam.
- Playtest-driven changes: rearrange tiles on the board, and "extra bonus points if you spell especially long words — because otherwise you barely get any points for dropping a single mega word".
- At GDC he got feedback from the devs of Patrick's Parabox, SpellTower and Alto's Adventure.
- In March he added **Unity Analytics "to help with future balancing"**, created a private Steam page, and brought in sound and music collaborators.
- April: the first perk based on the word itself (same first and last letter). "These would prove to be very important in the game's overall sense of strategy and balance."
- The Apple Arcade pitch was turned down after 10 days. Later another Apple team offered App Store help.
- **Reveal:** a demo, an announcement video and a let's play together. "20,000 players in a week", picked up by Northernlion and Yahtzee.
- Demo feedback brought words over 10 letters and petitioning words into the dictionary.
- **Layer 3, June:** "my job now was to simply make stuff". Perks went 100 → 120 → 143 → 150 → **160** ("I really, really had to stop").
- **Layer 4, QA:** patrons plus "people who gave particularly insightful feedback about the demo… They found perks that were overpowered, and perks that were pointlessly weak. They helped me balance the difficulty curve, suggested Steam achievements, and pushed me to add in features that I had been way too lazy to make".
- **His two secrets for 7 months instead of 3 years.** (1) "I was ruthless about the game's scope. I would routinely make decisions through the lens of which choice is going to take the least amount of time… unique art for all 160 perks… I would totally accept the criticism that the game is worse off… but… using a more simple set of icons saved weeks of time… the difference between the game coming out while I still had some fuel in the tank." (2) "I would develop the game in a kind of layered approach… focus on one part at a time… I was always building on the really strong foundation of the previous layer."
- "I think I'm even more proud of the fact that I made a video game without losing my mind… really planning out the development instead of just making stuff willy nilly."

### Let's Play Word Play! [SHZpaNdpJWo]
- He explains the design while playing (shown in Section 2): plays, refreshes, three perk families, "your points don't carry over from round to round, which is a… conscious design decision".
- "This is when the game starts getting really good where we're not just looking for the longest word… but we're trying to find very specific things. We want to get to exactly seven tiles."
- He found a bug live and noted a missing sound ("I need a sound effect when the diamond resets"). Even this late, the dev's own play session works as a playtest.
- "It's always good when you make something that gives you feelings." He was nervous in the final round, a good sign of tension.

### How I got my demo ready for Steam Next Fest [29kb8ouCGLA] — 7 tips
1. **Launch the demo about 2 weeks before Next Fest.** That got about 25,000 wishlists early and a feedback window. It brought the 10+ letter second row, peeking at the bag or board from the shop, breaking glass tiles, alphabetical sort, "loads of bugs".
2. **Show enough, not too much.** The MoM demo (15 min) was too short. The WP demo had about 25 of 120+ perks and 1 mode. Check Steamworks' median playtime and aim for **30–90 min** (WP: about 1 hour). Look at genre peers.
3. **Great first impression.** He waited for real music ("a completely silent game does not scream high quality"). "Err on the side of easier." He constructed a guaranteed fun synergy (a golden-tile maker plus "golden spreads right"). "**A demo is not a playtest build… It's marketing.**"
4. **Tease what's not in it:** locked mode buttons ("available in the full release"), unexplained special tiles in the logo, a Steam news post listing the full game's content, and a wishlist button inside the demo.
5. **One place for feedback.** It was scattered across Bluesky, Discord DMs, email, two YouTube comment sections and Steam forums, "completely overwhelming". He moved it all to Discord forum channels, with pinned redirects and an in-game "report an issue" button. **Dictionary handling:** a first-time tutorial for invalid words (no proper nouns), and **petition a word**, which "shoots an event to Unity's analytics… a massive spreadsheet of every word that's been petitioned… as the great arbiter of words — decide". First batch: BESTIE, BOOLEAN, EMOJI, GAMIFY, NERFING, WEEABOO.
6. **Block content properly.** A "demo" checkbox got unticked by a player on day one. Ship only the demo content in demo files.
7. **Release soon after the demo.** Players who wishlist forget, so WP launched about a month after Next Fest.

### How I Coded the Perks in my Roguelike [n1cd1FhVAWY]
- The jam version was one big if-chain ("A massive spaghetti mess of if statements"). He replaced it for the real game.
- **One tiny script per perk**, inheriting a base class whose virtual hooks (OnWordScored, OnUpgradeUsed, on sell, on reroll, on new round, on refresh, on tile added…) "do nothing" by default. −1 / false means no effect. The scorer loops the owned list **in the player's order** (a Balatro requirement), and each trigger plays "a little ping animation and sound effect".
- Each perk script also holds "icon, description, rarity, and special numbers… so it's easy to change them from the Unity inspector". That's data-driven tuning.
- Result: "add, remove, debug, balance, and change the more than 150 perks". (A typical web/TS equivalent is a perk registry of objects with optional hooks. The Glyphtender AI personality model is similar.)

### Word Play is now available on iOS! [JFG0GMCMLgs]
- A year after Steam: "free trial… a single $5 in-app purchase… No ads, no other IAPs… 'Try Before you Buy'." Android is pending because he needs a test device. He also says it plays nicely on Steam Deck.

### Word Play Trailer [chWr87u3Gdc]
- No narration: music, plus a few spoken words over gameplay. A wordless trailer built on rhythm, like the MoM trailer technique.

### What's the Point of Prototyping? (Game Dev 101 ep 2) [8tHJgtbj6rs]
- "A prototype lets you answer a question, quickly." There are three big questions: **is it fun, is it viable (can we make it), will other people like it**.
- Luke Muscat: "at least half of them weren't fun at all". His Luck of the Draw prototype got crickets: "that was perfect… I would have gone and spent two years on that game".
- Viability: "if it's really easy to make puzzles for the puzzle game, you know you're somewhere fertile". And Jonas Tyroller: prototype time predicts game time. Mark's own video-rental-store prototype "took weeks… showed me that this project would take much more time than I have to spare".
- **For Word Play** he used physical props: "**I used Scrabble tiles, and wrote the modifiers on a deck of hand-made cards to help inspire ideas for different upgrades.**"
- Tips: don't make it flashy (except juice, when juice is the fun, as in Fruit Ninja). Use other mediums (paper, spreadsheet, Lego, a D&D-style Discord sim). Keep prototypes "small and specific", with separate prototypes for gameplay, art, tech and audio. Make many of them (Mini Motorways had about 20). Don't prototype everything.
- Luke's warning on juice: "you spend like a month… adding… extra juice… you're kind of bandaiding over the problem that the core game isn't fun… you have to judge it very honestly."
- "Prototyping is not some one-and-done process… Want to add a new feature? Prototype it… double jump or a dash? Make quick prototypes for both, put them in front of playtesters, and go with the winner."
- After prototyping comes "planning… often forgotten, and not at all fun".

### How to find amazing game ideas (Game Dev 101 ep 1) [0m60QbT85Tc]
- His biggest MoM mistake was "not having a firm understanding of the indie game production pipeline. Basically — what you should do, and when."
- Four idea sources: (1) an existing game shifted in perspective, theme, medium or era; (2) a genre as a recipe, fixing its problem or mashing two together (WP was Balatro × Scrabble); (3) new mechanics, bottom-up (MoM came from Zelda's magnet glove); (4) an experience, fantasy or theme, top-down.
- Structure: "what is the player's goal? What is the win state?… the obstacle?… the fail state?… the player's actions?"
- Ten rapid tips, among them: an atomic "periodic table" of mechanics, critique what you play, challenge conventions, play everything, add constraints, jams, noodling in the editor, music and art, ideas in the shower, "keep your idea small… a seed".
- **Evaluate before committing:** "Can you make it? And I mean you, specifically." Jonas: "If you can make the gameplay prototype in one or two days, then you can make the game in one or two years." Cut scope like Firewatch did. Be passionate.
- **Will it stand out:** a hook ("some interesting bit of information… that compels people to try it, or to discuss it"); the headline test; but not too novel (Arco flopped). An **anchor** makes it familiar. Zachary Richman: "**simple, with something unexpected**". Jonas' **appeal** (fantasy / exploration / toy). Lucas Pope: "if I can't imagine right now a cool trailer for this, then it's probably not worth pursuing". Tom Francis: the name and capsule show "if this game idea has a marketable proposition".
- The last check is "is the game idea actually fun?", which only a prototype answers.

### Can I fix Zelda's UI using Unity? [e4vsgC41bYg]
- His design process in miniature: **first recreate the existing thing faithfully** (scrape the assets, automate prefab creation with a script), **then build 5 alternative options** (acceleration, an XMB-style nested bar, tabbed grids, a favourites ring, a spiral), and **let the audience vote** with a playable itch.io build.
- He asks why it was built that way before judging: Nintendo's director wanted players to "fall upon and see the echoes that they may not have noticed". "The UI is designed to make you less efficient, but more creative." He questions whether that worked, and drops the favourites ring because it "goes against the intended experience".
- He made the smallest quality-of-life change first: acceleration plus a position indicator, "only took a tiny bit of extra code".
- Motion polish: DOTween slides and fades ("like butter in a pan").
- The bonus story is a form-follows-function lesson: Zelda became the hero because a sword-wielding Link made summoning pointless.

### A detective demo inspired by GeoGuessr (Locator) [-Bn-7bbuucA]
- This one is about another dev's process. Locator cut its diary pages after "playtesters just weren't interested… annoying distraction". It moved to Outer Wilds-style writing where "almost every scrap of text is both telling a story and giving you clues". Flavour should do a job.
- Confirming answers only in batches of three (Obra Dinn style) cuts down brute-force guessing.

### I've waited my whole life for this [lgG_vfbDPeo]
- MoM reached 6 consoles through a porting studio that "handled the port, the certification process, the relationship with Nintendo and Sony and Microsoft. I barely had to lift a finger." He delegated the part he couldn't do.

---

## 2. Word Play deep dive

### What it is (Steam page + let's play)
- A 4×4 grid of letter tiles drawn from a **letter bag**. Click, drag or type to spell, then submit. Score = tile values + **bonus points for long words**, × multipliers.
- **Plays** are the core resource: every submitted word uses one. You get some back at the end of a round. **Refresh** swaps the board (a limited count), and **Shuffle** rearranges it ("quite a good way to kick your brain into gear"); hold Shuffle to sort alphabetically.
- **12 rounds** with score targets. **Points don't carry over** between rounds (deliberate). The last round is always a **special round**, a boss-style rule: "word must have six tiles", "tiles refresh after submission", "special tiles don't trigger", "must include the highlighted tile or lose 2 plays", a max length that grows each word.
- **Perks after each round:** pick 1 of 3 (reroll costs plays). There are three families: **Modifiers** (passive, like Balatro's jokers), **Upgrades** (active: drag a tile on to change, improve, duplicate or destroy it), and **Gifts** (add tiles to the bag). There are slot caps for modifiers and upgrades. Rarities include Legendary. **160 perks** at launch (the store says 150+).
- **Special tiles:** Golden, Diamond (powers up while unused), Emerald (1 in 4 chance of ×5), Potion, Dot (×2 if last), Glass (one-time copy of any letter), Mirror, "!", Locked, compound ING/ERS, wildcards, "+".
- **Modes:** Easy, Normal, Hard, Legendary, Marathon, Ultramarathon, and **Quick Play** (casual: no target, beat your own high score). A daily challenge was promised in the demo post.
- **Look and sound:** "slick, clean, minimalist… a video game version of a GMTK video". A simple icon set instead of unique perk art, chosen to save scope. Music by Zach Jones (OST sold as DLC); sound design by a Discord recruit.
- **Accessibility** (Steam post, 17 Jun 2025): lowercase letters, high contrast, several dyslexia-friendly fonts, colour tags on vowels, a background-animation toggle; play entirely by mouse, keyboard, controller or touch, **one-handed**, and "you never need to" drag; "**no punishments for taking too long**… no modifiers that provide a bonus for playing faster"; "**no punishment for spelling a word incorrectly**… 'Did you mean…?' bubble". A colourblind symbol was added to Emerald tiles at 1.04.
- **Language:** English only, "carefully balanced around the unique properties of English words, spelling, letter use". There is a hidden mod route: drop `customdictionary.txt` (CAPS, sorted) and `customletterbag.txt` (a 5-character code per letter: letter, 2-digit value, 2-digit count) into the save folder. That's a cheap way to serve localisation requests without translating anything.

### How words are validated (dictionary choices)
- Jam prototype: an open-source list of about 200,000 words. For the full game: a curated list with **proper nouns excluded**. A first-time tutorial explains this.
- **Petition-a-word:** each invalid attempt adds a button to the options panel, which sends an analytics event. Mark reviews the spreadsheet and adds words in batches (150 petitioned words at 1.04; DOOMER, WEEBS, PALEO, LOWKEY, JACKALOPE at 1.10). He also **removed a slur** at 1.03.
- **What players said:** the most-upvoted review of all (341 helpful) is a joke petition for a crude word. Petition jokes are part of the game's social life. But **missing inflections and common words** are a top frustration in the negatives ("BALMED", "INHABITANCE", "GEOLOCATE", "MEXICAN"): "For a game about words, the dictionary should be reasonably extensive… regular rejections of valid words completely spoiled the game". The word "dictionary" appears in 25 positive and 7 negative reviews.

### How he prototyped and tested it
- A 2-day jam build, plus **paper**: Scrabble tiles and handwritten modifier cards. Then a full rebuild in layers (above). He started playtesting in month 3 with Discord, iPads at school talks, and GDC (designers of word and puzzle games). Analytics went in early "for future balancing". The public demo went out 2 weeks before Next Fest. QA was done by patrons plus the sharpest demo commenters.

### Scope and what he cut
- Cut: unique perk art (icons instead), crazy unbounded scaling (on purpose), a mascot, localisation (a mod hook instead), Android at launch, consoles.
- Added late because of feedback: words over 10 letters, peeking at the bag or board during the shop, glass revert, sorting, petitions, long-word bonus, tile rearranging, spelling suggestions, dyslexia fonts, modding groundwork.
- The perk count was driven partly by marketing ("a nice round number to put on the Steam page").

### Tuning and balance (as shipped + patches)
- Patch 1.06 (8 days after launch) buffed weak perks (+3 → +2 per tile, ×2 → ×3 adjacent pairs, upgrade perks +1 → +5, reroll perk +2 → +5) and made "Special Rounds (including Special Tiles Nullified) less likely". Patch 1.05: "**Changed some random elements to favour player**". 1.10 made "'Ultramarathon' mode's final score attainable without having to make a game-breaking build".
- He told Discord he **hadn't beaten the top difficulties himself** (quoted in a 35-hour negative review). This is the clearest balance blind spot.

### Launch
- **Wishlists:** about 20k by 27 May (the demo had 20k downloads); about 25k before Next Fest started. **Launch** on 14 Jul 2025 for $7.99 with 10% off for 7 days, about 1 month after Next Fest. **Patches:** a hotfix on day 1, then 1.02–1.07 within 10 days, 1.08–1.09 by mid-August, then nothing until 1.10 in May 2026. Several reviews call that out ("Seemingly early access game, but dev has stopped all work on it"; "Disappointed in the lack of any updates").
- **Sales:** "more than twice the number of copies" of MoM (MoM was about 12.4k a few weeks after launch, so WP likely sold well over 25k). It was picked up by streamers (Northernlion, Yahtzee). **iOS** came a year later as a free trial plus a $5 unlock.

### What players said — 1,013 reviews (89–90% positive)
Positive reviewers played longer: a median of **14.0 h** for positives against 6.0 h for negatives.
**Praise** (keyword counts in positives: polish 38, synergy 37, price 37, sound 32, music 24, relax 20, mobile 20, casual 19, chill 15, clean 15):
- "Super smooth and clean interface", "Polished, satisfying, easy to play for short/medium bursts", "snappy and eminently replayable", "worth it for the price", "perfect on the go… Please port to mobile". People love it on Steam Deck.
- **The best moment, in a player's words:** "the moment where your build forces you to scour through until you find the perfect word… 'x? for each R' and 'x? for each E' and 'x2 if word starts and ends with the same letter' and then seeing your score explode as you submit 'renouncer'". This is exactly the moment Mark designed for: hunting for a *specific* word, not just the longest one.
- Social and real-life spillover: "you will become insufferable… constantly thinking of new words… shouting them out".
- Non-native speakers: "English is not my first language" and enjoying the challenge anyway. Others wanted a language option.

**Complaints** (from all 100 negatives plus the critical positives), roughly by frequency:
1. **Perks too weak and too linear, no "break the game" moment** (the #1 theme): "too tame, too held-back… predictable" (103 helpful); "+2 points to the letter in last position if the word starts with a vowel"; "power-ups feel like they're intentionally designed to almost never create runaway scaling". Mark's deliberate "smaller, easier to digest numbers" choice met a Balatro-primed audience: "If it wasn't marketed as 'balatro but with words,' it'd be fine. But it is."
2. **Too many perks dilute synergy:** "**I think I had more fun with the demo. Now, there are just WAY too many perks. Synergies are almost impossible now**… in the demo we could have a run based around 'sell price'… now, it's nearly impossible"; "too many perks making it hard to get the ones you want and too many letters making it hard to get a significant proportion of them upgraded"; "you start with 70 tiles in your 'deck'… could easily be cut down". This is a direct consequence of the 160-perk push and the round-number marketing target.
3. **RNG with no safety net:** vowel floods ("AAAE EEII IKOO OSUV" is an entire review), "7 of the same letter", "nothing to prevent…", "a single modifier [that] allows foresight". Plus special rounds that wipe out a build with no warning: "Never knew it was coming, can't play around it, game over."
4. **Difficulty curve:** Normal → Hard is a cliff; Legendary, Marathon and Ultramarathon depend on luck, and the dev hadn't beaten them.
5. **Not enough agency:** pick only 1 perk per round, rerolls cost plays, you can't sell or trash upgrades, no deck thinning, few rewards in 12 rounds.
6. **No meta-progression or unlocks:** "no point in playing a difficulty level again once you've completed".
7. **Vocabulary cap:** "It's very hard to get better at the game just by playing it. You don't get exposed to new words". Also "too much of the difficulty in the player's ability to form long words… [I ended up] typing the letter tiles… into word search websites". One suggestion: "review a past run and see what big scoring words I missed".
8. **Dictionary gaps** (see above).
9. **Quality-of-life settings that don't stick:** "Alphabetization only lasts 1 turn… The Default Sort setting either doesn't work… Show Tooltips… doesn't seem to work". At least 5 separate reviews hit sorting (sort appears in 9 negatives).
10. **Feel and audio:** "sterile", "lack of juice… off-putting", "would feel great to watch my score rattle up"; the top critical positive (119 helpful) says the "music… mixed for foreground and not background, kinda bass-heavy… high-pitched GUI sounds… cold, rather sterile". And "portfolio piece… missing some spark, it's missing personality… missing *flow*".
11. **Scoring order unclear** when modifiers meet special rounds ("bonus points implies that they are added after the word score…").
12. Points not carrying over feels like "punishing the player for doing well" (several reviews). He chose that design on purpose, but never explained it in the game.

**The cross-game pattern** (MoM reviews say the same): "competent… but… sterile", "made using a checklist and not with the heart", "Mark wanted to please everyone". Mark said of MoM: "You don't get a lot of me in this game." **Both games got high marks for craft and both got the same "no spark" criticism.**

---

## 3. Mind Over Magnet and other projects (brief)
- **Mind Over Magnet (2024):** a puzzle platformer where a robot (Uni) carries magnet characters (Magnus, Maggie & Meg). The idea came from isolating one mechanic (Zelda's magnet glove) and moving it to another genre. The genre then flipped from platformer to puzzle. It took 3 years, mostly because of breaks and no plan. Its biggest wins came from tools, juice, playtesting, accessibility from day one, and hints plus a skip. Launch: 50k wishlists, 12.4k sold in about 3 weeks, 88% positive, about 2 hours long. Reviews: "too short / too easy / bland". Ported to consoles by Alchemy Games in 2025. Developer commentary is included.
- **Platformer Toolkit (2022):** an interactive video essay (browser). It used the same prototype → MVP → early demo process, finished in weeks, and was played by about 100k people. **His only "fast" pre-WP project, and it had both a plan and a deadline.**
- **Zelda Echoes UI demo (2025):** a five-option UI study with a public vote on itch.
- **GMTK Game Jam** (yearly; the Patreon "secret" jam is where WP was born). He runs it and doesn't enter ("I cannot be trusted").
- Mentioned but not built: a Picross RPG (Carter's Curse), a noir point-and-click, a modern Snake, and a video-rental-store sim (dropped because the prototype showed the scope was too big).

---

## 4. Patterns in how Mark works

**Prototyping**
- He proves the fun with the **fastest, ugliest thing**: a 2-day jam build, paper (Scrabble tiles plus hand-written perk cards), borrowed controllers and stolen sprites. Then he **throws the prototype code away** and rebuilds clean (MoM: three prototype projects, then a scrapped MVP; WP: "threw out the prototype code").
- He uses prototypes to *generate* ideas, not only test them (the magnet as a separate object). The **pull of the game** decides the genre, not his first wish.
- He prototypes questions throughout development, not just at the start. Content-generation tricks (puzzle matrix, mechanic × 3 levels) count as prototyping too.
- His biggest failure in both games was rushing into production before the fundamentals were settled (camera zoom, art scale, character feel), which forced late rework.

**Deciding**
- He's prone to **analysis paralysis**. What breaks it: an **arbitrary deadline plus a minimum-viable target** (30-day MVP, Next Fest, the 2024 cutoff, the GDC build), and expert conversations (Oliver, Patrick, devs at Develop).
- He writes **action points** after each feedback round and **goals** before each build sprint (4 character goals). He judges decisions by "what's best for the game" ("listen to the game").
- When stuck between compromises, he eventually "bites the bullet". He wishes he'd done it sooner.
- He asks "why is it like this?" before redesigning (Zelda UI). He respects the designer's intent, then tests whether it actually works.

**Scoping**
- He **cut** in both games: MVP 35 → 14 scenes; MoM 50 → 40 puzzles, 5 → 4 worlds (later back to a short 5th), 3 → 2 magnets, a simplified story; WP icon art instead of illustrations.
- For WP he used **"which choice is going to take the least amount of time"** as the routine tie-breaker, and openly traded polish for staying fresh: "while I still had some fuel in the tank".
- He measures scope against a peer game (Elechead), not against his imagination.
- **Counter-pattern:** once the core was done, *content count* grew by momentum (perks 100 → 160 for "a nice round number"). Players said that diluted the game. More content isn't always more game.

**Building and polishing**
- **Layers:** core verb → loop → content → bug and balance. Each layer rests on a solid one beneath.
- **Tools for *your* game** (sliders, auto-wiring, prefab palettes, filename-driven level order, inspector-editable perk data). He never regretted them.
- **Grey-box until the layout is final, then "paint over".** Finish one slice (World 1) to full quality first, which also became the demo.
- **Multiplicative polish over additive.** Sound early (he forgot this twice). Accessibility at the point code becomes "final", not before and not after.
- **Additive delivery rhythm:** content on Tuesday–Thursday, bugs on Friday, build to 3 testers, watch footage on Monday.

**Feedback and playtesting**
- **He watches more than he listens:** recorded playthroughs, in-room sessions, kids, his dad, pro designers. The designer can't judge difficulty or clarity.
- He tests with a **small batch** (max 3 per build) during production, and goes **wide** (Discord, demo, Next Fest) at milestones.
- **One feedback inbox.** A spreadsheet with category, agreement score and **count of independent reports**. Severity 1–5 for bugs.
- Before a feedback round he **fixes the annoyances**, so the comments are about the game.
- He filters requests against his vision (no mascot, no infinite numbers). He was right about identity, but on the numbers question, launch reviews pushed back hard.

**Finishing**
- "There is no finish line": declare it. **Content lock**, then polish-only, then near-daily playtests. The game "just seems to get exponentially better".
- Set a date in public, attach it to something meaningful, and fill the gap with polish and marketing, not content.
- Hire out what you can't do (music, capsule art, ports, QA testers). Brief composers by emotion, expect revisions, write them into the contract.

**Launch**
- He has done this twice: a private Steam page early (the MoM one went up late), a trailer built from in-progress content, the **demo 2+ weeks before Next Fest**, a demo that is **marketing** (easy, a constructed good moment, teasers, a wishlist button, demo-only files), launch about 1 month after Next Fest, a launch discount, then **daily patches in week 1**.
- He uses his audience: the let's play, the devlog, streamers. He's candid that this skews results ("some, if not most, of the sales come by virtue of me having this channel").
- **Post-launch was weak for WP:** a burst of fixes, then 9 months of silence. Promised modes and features largely didn't come, and reviews noticed.

**Self-management**
- Burnout and context switches are his main enemies (only 9 of 24 months were active on MoM). The fix is **a plan** ("every game dev session has purpose" and you can switch task *type* when tired) plus **singular focus** stretches.

---

## 5. BMUZ implications

Each item has a concrete edit and the evidence behind it. Skill files: `~/.claude/skills/<stage>/SKILL.md`, rules in `~/.claude/config/bmuz/PROJECT-FILES.md`. **★** = highest value.

### /discover
1. **★ "Prove it in two days" step.** For a new game: before writing a GDD past the pitch, build the scrappiest playable core loop (or a paper or sim version via **proto**) in ≤2 days, and show it to 3–5 people. Record whether they kept playing or asked for more ("played this scrappy two day prototype for more hours than… MoM"; Jonas: "prototype in one or two days → game in one or two years"). Checklist line: *"Is the prototype taking longer than ~2 days? Then the game is bigger than we think, so scope down now."* [MHKRWmfcMBw, 0m60QbT85Tc, 8tHJgtbj6rs]
2. **Paper prototypes are first-class.** Add a /discover option: "Make a print-and-play version" (Muzzy is an artist, and Mark used Scrabble tiles plus hand-written perk cards). [8tHJgtbj6rs]
3. **★ Viability question: "Is content cheap for us to make?"** Add it to /discover's questions next to "is it fun". If each level, perk or word list costs a lot to author, flag it (Luke: "if it's really easy to make puzzles… you're somewhere fertile"; Mark's MoM puzzles were a craft he underestimated). [8tHJgtbj6rs, 5ycSvC0ZM0k]
4. **Market check in discover:** write the **headline** (hook), the **anchor** (what's familiar), the **appeal type** (fantasy / toy / exploration), and imagine the **trailer + capsule**. Also search for same-concept games and decide early whether we're joining a genre ("I definitely regretted not showing this thing earlier"). [0m60QbT85Tc, uuXrwA9nzM8]
5. **★ "Where's Muzzy in it?" line.** Both of Mark's games were called competent but "bland… you don't get a lot of me in this game" and "made using a checklist and not with the heart". Add an experience-target row in /discover: *"the thing only Muzzy would make: his art, his humour, his odd rule"*, and keep it as a pillar. For BMUZ this is the main risk of a process-heavy, principle-driven AI partner. [5ycSvC0ZM0k, MoM and WP reviews]

### /define
6. **★ Layered feature map.** In `stages/build-plan.md`, order milestones as layers: **L1 core verb feels great on every input → L2 full loop playable start to end (rough) → L3 content → L4 balance + QA**. A feature can't jump layers unless it's a `needs:` dependency. Mark credits this, together with ruthless scope, for 7 months instead of 3 years. [uuXrwA9nzM8]
7. **★ Scope tie-breaker in the GDD Decisions log:** "When two options are close, pick the one that takes least time, and write down what it cost" (e.g. icons instead of 160 illustrations). Log every cut with the reason, so the "should we have…" talk at launch already has an answer. [uuXrwA9nzM8]
8. **Plan *after* the fun is proven.** Add to /define: "Don't lock the full feature map until the core prototype is confirmed fun (Muzzy says 'that's it')". Equally: "Once it's proven, *do* plan. No plan = noodling" (MoM's 15 lost months). [B6auN-GIUeM]
9. **Scope against a reference game:** put "Our size ≈ <shipped game>" in GDD §Scope (Elechead made MoM feel finishable). [05qcUU9DzQE]
10. **Content formula for content-heavy features:** for each mechanic, "teach → use → twist/combine", and a **mechanic matrix** (each pair of mechanics is a candidate idea). It turns "make content" into concrete briefs. Add this as a /define design-stage technique, and to **proto** for generating candidates. [akeVPZLZejY, B6auN-GIUeM]
11. **Target audience + playtester profile in the GDD.** Mark built MoM for puzzle experts he didn't want ("they're not in my target audience"). GDD §1 already names the audience. Add "who we playtest with, and who we *don't* tune for". [2G84mU3WPaE]
12. **Lock the core feel and layout fundamentals before content:** camera, art scale, board size, input. A /define checklist line: *"Settled before L3: board/camera size on every target screen, art resolution, core feel numbers."* (MoM had to redo all its art and couldn't fix the character because levels were already built on it.) [OyWtPQfehKc, UlzgvZqig40, 5ycSvC0ZM0k]

### /develop
13. **★ Sound with the mechanic.** Checklist line: *"A new player action or game event gets a placeholder sound (ZzFX) in the same task."* Mark learned this twice ("I should have done this way earlier… put sounds in early"; later "When I make a new game mechanic… I try to remember to wire up some sounds"). Lesson → develop skill. [0lhjLNYopHM, n8bqjpq0MIw]
14. **★ Accessibility when code becomes final, not at the end:** *"When a feature leaves prototype and becomes final code, add its accessibility options in the same feature (input parity, colour + symbol, reduce motion)."* [ep_9RtAbwog, 5ycSvC0ZM0k]
15. **Build-your-own-tools trigger:** *"If Muzzy (or Claude) does the same 3+ manual edits to tune or author something, make it a Dev Kit control."* Mark: "Unity is a tool for making games, but it's not a tool for making *my* game". This matches the Dev Kit philosophy, so make it an explicit trigger. [iAxSqi5LBDM, akeVPZLZejY]
16. **Multiplicative polish first:** in the game-feel skill and the /develop "feels off" path, rank polish candidates by "how many turns or screens does this improve?" Polish that touches every turn beats a one-off moment. [n8bqjpq0MIw]
17. **"Bite the bullet" rule next to the 3-strike rule:** *"After two workaround attempts for the same problem, cost out the real fix. It's often cheaper"* (the pixel art redo was faster than the compromises). [UlzgvZqig40]
18. **Redraft, don't patch:** for a level, screen or feature that has grown clutter through patches, rebuild it from scratch with what you learned ("start the level again… much more elegant"). Mark's cluttered puzzles came from patching every skip. [2G84mU3WPaE, OyWtPQfehKc]
19. **Don't spend a day on invisible polish:** *"Before a nice-to-have that players won't notice (e.g. cursor handoff between mouse and controller), ask whether it changes what players feel. If not, log it as ✨ could."* [5ycSvC0ZM0k]
20. **Fun-first, not hard-first:** a /develop tuning line: *"Don't add difficulty because we assume players will find it easy. Check it with a playtest first."* Mark made levels convoluted on an unchecked assumption. [2G84mU3WPaE]

### Playtesting (new `/playtest` flow, or add to `/play` + `/bug`)
21. **★ A weekly loop like Mark's:** each sprint ends with **a build to ≤3 fresh testers**, recorded where possible (Muzzy's phone screen-record or a Dev Kit session log). Claude watches or reads the log and writes **action points**. "Watch how they play more than what they say." Avoid wide releases mid-production: too much repeat footage. [UlzgvZqig40, 2G84mU3WPaE]
22. **★ A feedback tracker with counts:** `.planning/FEEDBACK.md` (or a section in BUGS.md) with category · description · Muzzy-agrees 1–5 · **count of independent reports** · decision. Independent repeats are the strongest signal. Write rejected requests down with the reason, and revisit them if they keep coming back after release (WP's "no big numbers" choice became the #1 review complaint). [1aB23SbsZa4, MHKRWmfcMBw, reviews]
23. **Fix annoyances before a feedback round.** Line in /deliver (alpha/beta): *"Before sending a build for feedback, clear the known small annoyances so testers talk about the game."* [0lhjLNYopHM]
24. **One inbox + an in-game "Report / suggest" button** linking to a single place (and the Dev Kit bug capture). Mark found feedback across 6 channels "completely overwhelming". [29kb8ouCGLA]
25. **Test with a novice for every release:** add to /deliver's beta checks: *"One playtest with someone who's never played (a kid or older relative) on the release build."* (His dad's playtest was "the most important playtest in this entire development process".) [2G84mU3WPaE]

### /deliver
26. **★ Content lock before 1.0:** add a ROADMAP milestone or /deliver rule: *"Beta = content locked. After this only polish, balance, bugs and playtests."* Mark: "When I was producing new content, the game was getting longer, but it wasn't really getting much better… now… better and better with every update." [rIUkuB4WLss]
27. **Play the whole thing before the last stretch:** add *"a rough end-to-end playable build exists"* as an L2 gate. Then finish one slice to full quality (a vertical slice that doubles as the demo) before painting the rest. [n8bqjpq0MIw, rIUkuB4WLss]
28. **Demo-as-marketing recipe** (for when Glyphtender or a future game goes to a store): release the demo early, aim for a 30–90 min median, make it easier than the full game, stage one great moment, tease locked content, ship only the demo's content, release the full game soon after. Put this in `config/bmuz/release/` as a recipe. [29kb8ouCGLA]
29. **★ Launch-week plan:** reserve the week after any public release for fast patches (WP shipped 6 patches in 10 days). Plan **a visible update cadence after launch**. Promised-but-missing modes generated "dev has stopped all work" reviews. Rule: *"Don't announce post-launch content we haven't scheduled."* [WP news + reviews]
30. **Money and pricing card** (for store releases): Steam fees + tax took 100 → about 43 for Mark. Price against peers of similar length and leave room for discounts. For mobile, paid apps don't work, but **free trial + one unlock** did for WP. Add to `references/` for when Muzzy considers stores. [5ycSvC0ZM0k, JFG0GMCMLgs]
31. **Practice launch:** do the first deploy or store submission on a low-stakes build (MoM was rejected 3 times by Valve right before Next Fest). For web: the first GitHub Pages or PWA deploy happens at alpha, not at 1.0. [1aB23SbsZa4]

### Glyphtender specifically (cozy hex-board word game)
32. **★ Never punish a "not a word".** Glyphtender detects words rather than having the player submit them, but the same feeling applies: when a player expects a word to count and it doesn't, show a soft "not in our word list" note in the preview (not silence), plus a one-tap **"I think this is a word"** petition logged to a file or analytics for Muzzy to review in Obsidian. WP's petitions both fixed the gaps and became fun to talk about (top review, 341 helpful). [29kb8ouCGLA, MHKRWmfcMBw]
33. **★ Dictionary audit for inflections.** WP's worst dictionary complaints were *missing forms of common words* (BALMED, INHABITANCE). Run a script that checks every -S/-ED/-ING/-ER/-LY form of the top Zipf words against the 63,657-word list, and lists gaps for Muzzy. Also scan for **slurs** (WP removed one after launch). Keep the "no proper nouns" rule explained in the tutorial or rules. Store additions in `content/` so a patch note can list them.
34. **★ Rack and bag smoothing.** WP's #1 RNG complaint was vowel floods (one whole review is just "AAAE EEII IKOO OSUV"). Run a **proto** sim of Glyphtender's 8-seed draws from the 120-seed bag: what % of racks have ≥6 vowels or ≤1 vowel, or 3+ of one letter? If it's notable, consider a draw-smoothing knob in `content/rules.json` and let sims, then Muzzy, decide. (Glyphtender already lets you refresh when you made no Magic. Check whether that's enough relief.)
35. **Settings must stick and actually work.** Five-plus WP negatives were about the sort and tooltip toggles not persisting. Add an e2e check that every Settings toggle survives a new turn, a new game and a reload. (This fits the existing "changing a default players can save" lesson.)
36. **★ Show the scoring breakdown.** WP players couldn't tell what order modifiers apply in. Glyphtender's Magic is simple (letters + 1 per owned seed + tangle bonus), so show it step by step at the reveal and in the commit-button preview, especially the tangle bonus. That keeps the "best speller doesn't always win" pillar *visible*.
37. **Telegraph game-changing events.** "Never knew it was coming, can't play around it" was WP's most bitter complaint. Glyphtender's ending (two tangled glyphlings) should be foreseeable: a visible "this glyphling is nearly tangled" cue fits the "Always readable" pillar and the secret-Magic tension target.
38. **Don't overload the distinct options.** WP's demo with about 25 perks was more fun than the full game with 160: "Synergies are almost impossible now". For Glyphtender, keep AI personalities, awards, board options and later variants **few and clearly different**. Adding one should pass the test "does this make the good moment rarer?"
39. **Tune the top difficulty yourself.** Mark hadn't beaten his own top modes, and those modes got the angriest reviews. Before beta, Muzzy plays the hardest AI at least 3 times, and bot-vs-bot sims cover every difficulty level, not just the default.
40. **Audio mix for thinking games.** Zach's first draft was "too clubby… cognitively overwhelming… not good when you're trying to… solve puzzles", and the top critical WP review called the mix "foreground… bass-heavy… high-pitched GUI sounds… sterile". Sprint 19 just added sound. A Muzzy check for the audio feature: *"play 20 minutes with music on: does anything nag? Is the music background, not foreground?"* Brief any composer by **feeling**, expect 2–3 drafts.
41. **Cozy ≠ no payoff.** WP's restraint ("smaller, easier to digest numbers") read as "sterile… I would like more juice… watch my score rattle up". Glyphtender's key moments (the two-birds cast, a tangle, the Magic reveal) should each get one clear, tiered **game-feel** payoff, so "cozy" doesn't become "flat".
42. **Input parity + accessibility pack for word games** (WP shipped this; copy the list into Glyphtender's accessibility feature): lowercase option, high contrast, dyslexia-friendly fonts, vowel tags, colour + symbol for player colours, one-handed play, drag never required, **no time pressure**, mouse, keyboard, touch and controller.
43. **Shareable result screen.** WP's prototype spread because "as soon as one person posted a screenshot of their results page, everyone wanted to have a go". Glyphtender's Magic reveal / results screen should be screenshot-worthy (and maybe one-tap share) for the "again?" fellowship target.
44. **Show a learning payoff.** WP players complained "you don't get exposed to new words" and asked to "see what big scoring words I missed". Glyphtender could show "best word you could have grown" after a game (the AI move generator already exists). That feeds "cozy cleverness" without making it a vocabulary test. → ROADMAP Ideas.
45. **Wording matters.** WP's whole identity came from renaming "lives" to "plays", because losing a life for doing something right felt wrong. Glyphtender already does this ("tangled", never "trapped"). Keep it as a checklist line in GDD §Pillars: *"Every resource or penalty word: does it feel right in the player's mouth?"*

### Lessons to file (per Muzzy's reflection rule)
- **develop skill:** #13 sound with the mechanic · #14 accessibility when code goes final · #15 tool trigger · #17 bite the bullet · #18 redraft don't patch.
- **define / build-plan:** #6 layers · #7 scope tie-breaker · #12 lock fundamentals before content.
- **deliver:** #23 fix annoyances before feedback · #26 content lock at beta · #29 launch-week plan.
- **New playtest flow:** #21, #22, #24, #25.
- **Glyphtender ROADMAP / BUGS:** #32–#45.
