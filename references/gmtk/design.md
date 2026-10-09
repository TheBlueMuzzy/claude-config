# Mark Brown (GMTK) — Design Thinking, for BMUZ

Source: full auto-caption transcripts of 37 GMTK videos (35 assigned + "How I Made Word Play" and "3 Lessons from a Real-time, Turn-based Game"), read in full 2026-10-09. Quotes are from the captions (lightly cleaned); speaker is Mark unless another developer is named. Video id in [brackets].

---

## 1. Per video

### 10 Game Design Lessons from 10 Years of GMTK [Cm2_drGLGbc]
**Core argument:** Mark's distilled decade: experience comes from mechanics; no mechanic is right or wrong in the abstract; know the audience but use options to reach beyond it; ideas are worthless until prototyped and playtested; re-evaluate every lesson.
- Mechanics, not plot/graphics, make the experience: "ask yourself: how do the mechanics contribute to the experience?"
- "There's no such thing as a right or wrong game mechanic… the only way to judge a mechanic is to ask whether or not it can contribute to the experience you're trying to forge."
- Don't use a mechanic because it's trendy or drop it because it's dated.
- Target audience: "you have to decide who this game is for, and tune your mechanics appropriately." (He was wrong about Spider-Man because "was Spider-Man actually made for me?")
- Reach other audiences through optional content (Mario) and explained assist options (Celeste): "push players into seeing the version of the game that fits their needs best."
- Genres are loose: a genre as "a long list of must-have mechanics" makes samey games.
- AI's job is "to present interesting gameplay", not pass the Turing test; "the best solution for a complex problem is whatever provides the most interesting experience to the player."
- "Our brains are truly bad video game simulators… a game idea is worthless until you've proven its value through a prototype."
- "Players are quick to find faults that you never knew your game had… frequent playtesting should be used to make sure your design is effectively producing the results you desire."
- "Never take some game design lesson as gospel."

### How To Think Like A Game Designer [iIOIT3dCy5w]
**Core argument:** MDA explained as a causal chain; designers can only touch mechanics, so pick mechanics whose dynamics/aesthetics serve a single vision statement, and make every element (music, art) "sing the same notes." Borrowed mechanics must be understood before copying.
- "Mechanics happen in the code, dynamics happen in the player's actions, and aesthetics happen in the player's feelings."
- Designers "can't just go inside the player's head… But they can change the code" — the causal cascade.
- Name feelings precisely: "way more than just 'this game was fun'… powerful, creative, sneaky, tense, intimidated, curious…"
- Cut mechanics that fight the emotion — Flower lost levels/spells/timers: "fun doesn't always help the emotion you want to deliver" (Jenova Chen).
- One-line vision as a "lodestar" (Subnautica "thrill of the unknown", RE Village "struggle to survive", DOOM "push forward combat").
- Non-mechanical elements create aesthetics too (Dead Space music "made players feel heroic" — wrong).
- Mechanics can undermine each other (Callisto: scarce ammo vs. insta-kill stealth).
- Degenerate strategies undermine goals (Alien: Isolation — suicide to reach the checkpoint).
- "Aesthetics are, ultimately, subjective… Time pressure might feel fun and exhilarating to one person — but anxiety-inducing to another."
- Borrowing: "it's essential to understand why those mechanics work in one game, before copying and pasting them into yours." Alien's save fix: "Saving became tense."

### How Game Designers Solved These 11 Problems [rJZyPdYIbZI]
**Core argument:** Design is mostly problem-solving after playtests. First find the real problem; then use one of seven approaches (iterate, identify levers, make big changes, flip it, solve elsewhere, solve several at once, study player behaviour); then watch for second-order effects, constraints, and re-test blind.
- Root cause before fix: Dying Light — "weapons break too fast" was really "only a few zombies before it broke" → lowered enemy HP, not durability.
- Make sure the team agrees what the problem is (Astroneer: systems view vs. moment-to-moment view).
- Iterate with throwaway builds: "even though this might not be a solution that we're willing to ship with, it was something that was going to teach us a lot more about the problem" (Diablo 3).
- Identify levers: list what can't change (the identity of the thing) and what can (Halo sniper 0.5s → 0.7s).
- "Double it, or cut it in half" (Sid Meier) — big swings find the answer fast.
- Flip it: Shovel Knight — instead of paying to save, get paid for breaking checkpoints.
- Solve elsewhere: The Last of Us moved upgrades to benches → players saved up and upgraded favourite weapons.
- "A good idea is something that does not solve just one single problem, but rather can solve multiple problems at once" (Miyamoto) — NSMB bubble.
- Study player behaviour: Gears' hidden "magic bullets" at the end of a clip only novices reach.
- Second-order effects (Siege shotgun nerf broke defenders → shorter round timer).
- Re-test without telling testers what changed: "don't tell your playtesters how you fixed the issue as that can bias their experience."
- "The best game designers aren't those who can come up with good ideas — they're the ones who can also figure out good solutions to problems."

### Should Designers Listen to Negative Feedback? [P05ONfLOqmY]
**Core argument:** Feedback is essential and has made games much better, but must be interpreted: beware vocal minorities, extract problems not solutions, don't sand away what's interesting, and explain your reasoning to players.
- Weigh "how many people are saying it, and what sort of person they are"; frustrated players speak up more; vocal critics often want more difficulty/complexity than the casual majority.
- Use data, carefully: "data informed, not data driven" (Siege). Slay the Spire's Madness card looked overpowered only because a late event handed it out.
- "Identify problems, not solutions" — player suggestions "are rarely the correct answer"; feedback should "generate questions that the developers can ask themselves" (Nioh).
- Think about the emotion a mechanic evokes, not the mechanic: XCOM 2 turn timers wanted risk-taking — "there are other routes to this same feeling."
- Sometimes the problem is introduction/tutorial, not the thing itself (Marauder).
- "If all you do is respond to feedback, then you end up converging on a fairly middle of the road [game]" (Rare). Feedback "should be used to sand off the roughest edges… but shouldn't lead to the removal of everything that makes the game interesting."
- Optional modes are a good outlet: "a simple and well communicated optional mode."
- "As a designer at some point you just have to be brave" (Respawn).
- Explaining why a feature exists "causes a lot of buy-in" (Avellone). Frame: "help us make the game we're aiming for."

### The Two Types of Random in Game Design [dwI5b-wRLic]
**Core argument:** Randomness serves variety, multiplayer balance, reward excitement and the information horizon. Input randomness (before the decision) supports strategy; output randomness (after) can undercut it — but both can be tuned: constrain distributions, use spiky information flow, show/massage odds, use familiar physical metaphors, and keep favourable-only output luck.
- Uses: variety, balance between mixed-skill players ("party games and board games for families"), exciting rewards, capping plans.
- Too much information → "a paralysis of analysis"; airtight plans make "flat and uneventful gameplay… Drama is driven by the unexpected."
- Information horizon (Burgun): capped by exponential complexity, execution uncertainty, hidden information, randomness.
- Input vs output: input "supports strategy", output "undercuts strategy" (Engelstein). Slay the Spire moved enemy intent to the start of the turn: "Output became input."
- Bad input randomness: a lucky start dictates success → "hard to tell if your success was down to skill, or just good luck"; restart-scumming.
- Constrain randomness: Pandemic's split deck, Tetris 7-bag, Diablo's class-weighted loot, Spelunky's mercy rule.
- Spiky information flow: "high-impact information… in discrete spikes that happen at regular intervals, with a slow, regular flow of information between the spikes" (Hoeppner).
- Output randomness tests contingency planning; avoid binary outcomes (partial hits).
- "Humans are just really bad at understanding odds" — Fire Emblem/Civ massage odds; pity timers.
- Physical metaphors (dice, cards) are understood: "we understand things that we can hold in our hand" (Zach Gage).
- "If there's randomness where you're expecting something bad and then you get something good, no one ever ever complains" (Justin Ma, Into the Breach).

### How Games Use Feedback Loops [H4kbJObhcHw]
**Core argument:** Positive loops snowball (end games decisively but create death spirals/runaway leaders); negative loops equalise (drama and comebacks but can feel unfair to winners). The best designs pair them, dampen them, or decouple rewards from power.
- Positive loops "reinforce successes with more successes, and compound failures with more failures."
- Positive loops push a game to its end and avoid stalemate; negative loops suit "party games where everyone should have a good time… an interesting ebb and flow of comebacks."
- Risks: "positive loops are frustrating for weaker players who get stuck in a death spiral… negative feedback loops feel unfair to successful players."
- Pair them: Pyre gives XP for losing and removes your best players by liberating them — "Mistakes became a road bump… not a tipping point."
- Scoring side sits out the next play (Pyre/basketball) — catch-up built into the rules.
- Negative loops "send mixed signals… telling good players to make mistakes" — why RE4 hid its dynamic difficulty. "It is still better to win a match than to lose it."
- Early-game decisions get magnified by positive loops.
- Players naturally gang up on the leader in multiplayer — "a naturally occurring negative feedback loop."
- Dampen loops (CoD: killstreaks no longer feed killstreaks).
- "Decouple rewards for doing well, from the progression of the game" — reward skill with harder optional content (DKC KONG letters), not power.

### How to Keep Players Engaged (Without Being Evil) [hbzGO_Qonu0]
**Core argument:** "Engaging, not addictive." Healthy engagement comes from pacing (switching pillars and intensities), novelty teased by mystery/anticipation, long-term goals broken into short ones with planning and growth, and well-tuned challenge where failure is cheap.
- Explicitly excludes "skinner boxes, daily rewards, resource decay, loss aversion."
- Pacing: swap gameplay "pillars", and modulate intensity: "too long on calm gameplay can obviously be boring… max intensity for too long will lead to exhaustion or desensitisation."
- Novelty: Mario "consistently introducing novel new ways to play."
- Tease before you deliver: "if you tease the player, you can get them excited before you've even dropped the new content… It's economical!"
- Long-term goals (Stardew) with short-term milestones, planning, self-expression, exponential growth, and optimisation.
- Players "fantasise about what it will be like when they finally reach that point."
- Flow: challenge "not so easy as to be boring, but… not so difficult as to be stressful."
- Failure is fine "if the runs are relatively short, if they feel a sense of getting better each time, and if… the next session will be markedly different."
- Vary the kind of challenge: problem solving, spatial awareness, decision making.
- "Different things will work for different players" — competition, show-off rewards.

### This Psychological Trick Makes Rewards Backfire [1ypOUn6rThM]
**Core argument:** Explicit goals and rewards can crush intrinsic motivation (overjustification effect). In games about exploration, creativity or self-improvement, prefer broad goals, comparative metrics, optional/hidden goals, and unexpected, low-value, performance-tied rewards.
- Don't Starve quests: players "optimised their play in really boring ways… avoided doing anything risky… became completely demotivated the second the quests ran out." Klei: "we taught the player to depend upon those tasks to create meaning in the game."
- Onboarding solved by subtle UI hints (highlighting key crafts), not quests.
- Zach Barth: "a goal that you set yourself is way more powerful than a goal someone else sets for you" — histograms, personal bests, friend leaderboards beat achievement thresholds.
- Mini Metro: unlock thresholds become a "means to an end"; players stop once everything is unlocked. "Goals are a checklist that can be completed"; skill measures "have no finish."
- Overjustification: rewards for intrinsically fun tasks reduce interest, creativity and problem solving.
- Some players need structure ("how do I decide when I am satisfied?") — so use goals carefully.
- Prefer "large, overarching goals that players can complete however they want", comparative metrics, optional (Hitman) or hidden (Outer Wilds) goals.
- Rewards that don't backfire: "unexpected, reasonably low value, and feel tied to the actual performance of the action" — e.g. Overwatch's Play of the Game.
- Nintendo: "There are things you can do in the game that will result in some sort of reward or unexpected surprise" (Bill Trinen).

### How Fortnite Exploits Your FOMO [V1kbBcm9XRI]
**Core argument:** Content turnover keeps Fortnite fresh and approachable, but time-limiting rewards (item shop, expiring battle passes, weekly quests, streaks) weaponises fear of missing out; change in the *game* is good, pressure in the *rewards* is the problem.
- Removing content stops the game being "overwhelming to new players."
- "Having content be limited makes it feel more special and memorable."
- FOMO toolkit: "Daily rewards, weekly quests, seasons… battle passes that expire… streaks you have to maintain at the peril of going back to zero."
- Player quote: "I feel like I'm playing to minimise missing a reward rather than playing to maximise my progression."
- Tricks are "more effective on children and young adults."
- Mitigations: Halo Infinite's non-expiring pass; Destiny reducing penalties for missed weeks.
- The test for players (and designers): "are you playing this game because it's fun, or because you feel pressured to keep up with its rewards?"

### Playing Past Your Mistakes [Go0BQugwGgM]
**Core argument:** If you want players to live with setbacks (where the best stories are), build it into the game: a wide, reversible failure spectrum; small unpredictable recoverable setbacks; no power reward for perfect play; make failure as interesting as success; or remove rewind.
- "If you've got an intention for how players should experience the game, you've got to build it into the game itself" (not the manual).
- Failure spectrum (Tom Francis): "the range of states between perfect success and total failure"; make it wide and reversible.
- Setbacks bounce you from execution back to planning — "improvisational" play (Clint Hocking).
- "It is exactly because the loss is small and unpredictable that players don't attempt to reload the game to escape it."
- "All of this falls apart if the player is rewarded for perfect play, or punished for making mistakes"; aspirational ranks are fine.
- Make failure interesting (Shadow of Mordor nemesis remembers you).
- Permanent saves make risk meaningful (Darkest Dungeon: "should I go a little further?").
- Suspend-save lets players take breaks without rewinding.
- "Given the opportunity, players will optimise the fun out of a game" (Soren Johnson).

### How Game Designers Protect Players From Themselves [7L8vAGGitr8]
**Core argument:** Players drift to the safest dominant strategy even when it's boring. Designers should steer them toward the intended experience — preferably by encouraging (rewards, scores, mechanics that pay off the intended style) rather than punishing, and by de-emphasising unwanted options, never by forcing a single playstyle.
- Sid Meier: "protect the player… from themselves."
- Soren Johnson: "given the opportunity, players will optimise the fun out of a game."
- XCOM 2 turn limits worked but "players hated the turn limits… made mods to rip them out" — "some players will always react negatively to punishment."
- WoW rest XP: same numbers, reframed as a bonus → loved. "It's often better to encourage the behaviour you want, than discourage the behaviour you don't."
- Encourage in moment-to-moment mechanics: DOOM glory kills, Bloodborne rally, Burnout boost for risky driving.
- Scores/grades and diminishing points for repeats (Tony Hawk) steer toward varied, intended play.
- Don't push "from discouraging a playstyle, to practically forcing you not to use it."
- Keep the unwanted tactic valid "for certain situations — but tweaking them so the player will not abuse or completely rely on them."
- Depth signals importance: Mark of the Ninja cut combat until "the amount of presence it had in the design was about proportional to how important we thought it should be."
- Diagnostic: if players reach goals "more easily through ways that don't match that intention, and are actually pretty boring, then the game might have a problem."

### Three Other Approaches to Turn Timers | GMTK Extra [QAVf7rb0IwM]
**Core argument:** Three gentler alternatives to XCOM 2's fail-state turn limits: escalating challenge (Invisible Inc's security level), rewarding speed (Mario + Rabbids par-turn grading), and optional time-limited bonuses (XCOM EW meld canisters). Rewards and pressure produce different feelings — pick by the intended emotion.
- Invisible Inc wanted "interesting tradeoffs with every move, and keeping busywork to a minimum."
- Escalation, not failure: "It's not a fail state — it just ramps up the challenge… extra security measures can add surprising new wrinkles."
- Make it clear and predictable; even naming matters: renaming "'Alarm' to 'Security Level'" helped.
- "Rewarding players for being fast… is fundamentally a different experience to feeling the pressure of death looming."
- Mario + Rabbids gets speed from fun tools (slide, team jump) — the reward is "just an extra incentive."
- Meld canisters: "speeding up is optional and the punishment for running out of time is a missed opportunity — not a completely failed mission."
- Goal stated by XCOM EW: conservative play should be fine, just not "a no-brainer."
- Options can turn the system off for players who hate it.

### Are Score Systems Still Relevant? [K6y9PJipfpk]
**Core argument:** Scores layered on modern games give self-selected difficulty, reveal deeper ways to play, and steer players toward the intended experience. Risks — demoralising grades and players never seeing the real game — are solved by making the core experience mirror the expert one and hiding hard grades until earned.
- Scores as difficulty without a select screen: "you're rewarded for whatever skill level you bring to table."
- Opus Magnum histograms vs. world averages: "It's up to you whether good enough is good enough."
- Multiple axes of score (cost, area, cycles) let players pick what to optimise.
- Scores reveal "a fundamentally different way" to play (Bayonetta, Tony Hawk).
- Tony Hawk: diminishing points for repeats, combos raise risk, gaps push exploration → high-score play = "the way the designers intended."
- MGSV ranks reward sneaky play without punishing Rambo play.
- Downsides: "slapped down with a crappy grade" after a good run feels bad; optional scores mean some never see the depth.
- Assault Android Cactus fix: novice experience "neatly mirrors the veteran experience"; Pro Mode hidden until earned — "a secret second game."

### The Power of Invisible Choices [6HZuSzlN2eI]
**Core argument:** Choices made through the game's normal verbs (not menus) can hide extra options, be unequal in cost, track fine-grained behaviour, and deliver surprising consequences — but must be signposted loudly when they pay off, or players never notice.
- Explicit choices list every option and spoil the clever ones ("it says it right there on the screen").
- Hidden options "make players feel smart… more like an organic and believable world."
- Choices "don't have to be equal" — the better outcome can cost effort or skill.
- Fine-grained tracking personalises (Hades comments on your last run; Shadow of War orcs remember).
- Every action counts → "you end up playing in a more deliberate and thoughtful way."
- Surprise: explicit choices set high expectations; with invisible ones "even tiny consequences are impressive and memorable by comparison."
- Risk: players don't know options exist → "feel cheated."
- Risk: unseen consequences — Dishonored testers thought the game linear. "Be quite heavy handed… make it crystal clear to players that this is an outcome of their earlier actions. Too subtle, and all your hard work is wasted."

### Super Mario's Invisible Difficulty Settings [gkvyYTSKTQY]
**Core argument:** Mario has three connected "pipes": an average critical path, an easier lower pipe, and a harder upper pipe. Players shift between them mid-game (even mid-level) instead of choosing a difficulty before playing. Assists are temporary, cost the "true" reward, and appear only when needed; skill rewards unlock more challenge, never make the game easier.
- Miyamoto: "it just isn't possible to settle on a difficulty level that will satisfy everyone… the best method is when the player can adjust the difficulty [themselves] while playing."
- Upper pipe: risky one-off rewards, optional star coins, scoring criteria/par scores, post-game content, bonus worlds, expert DLC.
- Ending the story before the difficulty peak: "pretty much everyone can see the game through to the end."
- Lower pipe: choose which levels to play (need 70 of 120 stars), easier characters, temporary assist badges, Super Guide, invincible suit, co-op help.
- Timing assists: "it's fine if it appears when you're on the verge of tears, but [not] if it pops up when you're still brimming with determination" (Iwata).
- Assists cost the real reward (bronze star) and stop file-select stars shining → nudge players back up.
- Miyamoto: "Simply lowering the hurdle doesn't necessarily mean that the challenge will be fun."
- Don't let skill make the game easier — expert rewards that give 1-UPs are "a nasty negative feedback loop that… pushes you out of the top pipe." Reward skill with harder content.
- Medals on the file/title screen let players show off progress.
- Wonder even rewards *failing* with a bonus coin level.
- Mario asks at every step "can I do this?" — "and Nintendo wants them to say 'yes'."

### What's The Point Of Hard Games, Anyway? [Ip5pYl-MuYs]
**Core argument:** Difficulty has three purposes — bigger satisfaction, matching the theme, and forcing the intended playstyle — but it's a toolbox of separate tools, and "BS" difficulty (unfair, repetitive, unpredictable) turns triumph into relief or quitting. Offer ways to adjust or route around it.
- "The harder a challenge is, the more satisfying it feels to finally overcome it."
- Difficulty should match the fiction (Celeste, Pharloom).
- "Difficulty acts like a teacher: punishing you if you play it wrong, rewarding you if you play it right… easy games let you get away with simple and repetitive strategies."
- Fair difficulty: "you can see how you might learn from your mistakes, you can feel yourself getting better, you blame yourself for slip-ups, and you have ample opportunity to repeat and improve."
- BS: "long, repetitive journey to the boss… unpredictable troll moves… extremely random patterns."
- Bad difficulty changes the emotion of winning to "sheer relief that they'll never have to do that again."
- "We can't think of difficulty as a single monolithic thing… it's a broad category that includes a whole catalogue of different tools."
- "Difficulty is a really subjective thing" — adjustments let "everyone find a place where they feel challenged."
- Let players route around: Silksong lets you "explore somewhere else"; "the solution is almost never to just keep hitting your head against a brick wall."

### How Games Get Balanced [WXQzdXPTb2A]
**Core argument:** Balance = all options viable at equal skill. Tools: trade-offs (power budget), counters (rock-paper-scissors, hard/soft), data (win rate by matchup and skill tier, pick rate), the self-correcting meta, careful nerfs/buffs, and communication. For mixed skill, use catch-up mechanics, luck, handicaps or alternative roles — sparingly.
- "The perception of balance is more powerful than balance itself" (Jeff Kaplan).
- Trade-offs and a "power budget": "Advantages are a cost, but disadvantages are a discount."
- "Celebrate the big differences between choices"; Rob Pardo: balancing into mediocrity gives "a game where everything kinda feels the same… is it fun? Probably not."
- Counters: "everything has a counter, and everything is a counter"; hard vs. soft counters.
- Hands (locked before the match) must be balanced; throws (in-match choices) are deliberately unbalanced to create counter-play.
- Win rate misleads: check match-ups and skill tiers (Akali: 44% overall, 72% at Worlds).
- Pick rate reveals options that are balanced but not fun/used (Symmetra); Siege crosses win rate × pick rate.
- The meta can self-balance; innovation by players "is the best-case scenario."
- Find *why* something dominates before nerfing; buffing counters is an alternative.
- Communicate changes — a nerf only in patch notes still dropped pick and win rate.
- Mixed skill: catch-up mechanics ("contentious and must be used sparingly"), more luck, handicaps, low-skill roles.

### How Synergies Make Slay the Spire Fun [terD4Bk3L_8]
**Core argument:** Synergies (combinations worth more than the sum) make players feel powerful and smart, and add depth with fewer parts ("lenticular design"). They work best when they need planning (per turn / per combat / per run), when randomness forces you to improvise with what you're given, and when permadeath resets dominant combos.
- Synergy: "two or more elements combine to produce a more powerful effect than the sum of the individual elements."
- Feel powerful: "it feels utterly thrilling to do a massive combinatorial attack."
- Feel smart: "you found them… you can almost feel like you got one over on the developer… the devs planned this all along."
- Depth with fewer parts: "10 cards and they can work together, that's half as many cards to learn, but 100 different strategies!"
- Lenticular design (Rosewater): simple on the surface, hidden complexity seen only by advanced players.
- "A synergy that comes together too easily isn't quite as fun as one that requires a bit of set-up."
- Planning at three time scales: per turn, per combat, per run.
- Removing/skipping is as important as adding (lean decks).
- Randomness forces you to "respond to what the game gives you"; resets stop synergies becoming a stale "optimal strategy."
- Gradual acquisition makes building approachable vs. CCG deckbuilding being "so overwhelming."

### Balatro's 'Cursed' Design Problem [zk3S3o1qOHo]
**Core argument:** Balatro hides the score preview to keep the suspense of watching the scoring "machine" go — but the number is calculable, so optimisers do tedious maths outside the game. Information that is "hidden but attainable" creates busywork; either reveal it, truly hide it, or gate the option carefully.
- LocalThunk: "the game is more fun when you set up your Rube Goldberg machine and watch it go before knowing whether or not the hand will win."
- The reveal's pageantry ("numbers tick up, with escalating sound effects… multiplier will set on fire") only matters if the result is unknown.
- A preview would also incentivise "players to check every possible hand"; changes the feel from "chill… vibing" to "stern spreadsheet-style strategy."
- "How much information a player has will change their behaviour, and change the way the game feels."
- The flaw: information "hidden, but attainable if you really want it" → players use calculators.
- Deck view was added because playtesters were tracking cards manually "even though it really wasn't much fun."
- "Making a game better for one group can make it worse for another… be certain who the game is for and then protect that player base."
- Binding of Isaac's hidden item effects → everyone played with a wiki open; McMillen called it the game's biggest flaw.
- Options to soften: late-game unlock, explained option (Celeste), polite ask (Heat Signature), mods, cheat codes.
- "The best intentions in game design sometimes have to change, when you see how players actually interact with your game."

### Blue Prince: Can a random puzzle game actually work? [9K7zYN6_-2I]
**Core argument:** Puzzle games are "join the dots" (clue A → lock B); randomness can deny you B when you hold A, blocking theory-testing and focused play. Randomness still earns its place (novelty, mystery, an extra puzzle layer, finale, no dead ends), so fix with player control over the pool, reference tools, kinder framing (no day counter), and multiple granular goals.
- Puzzle genre = "You find A, you apply it to B."
- Randomness means "you've got A, but your house doesn't have B" — and you can't test hunches.
- "It's really hard to get fixated on a single puzzle"; players must pivot to what the house gives.
- Reasons to keep randomness: novelty, mystery/discovery, a puzzle layer of its own, a final-run challenge, no brick walls ("Just start a new day").
- Fixes: in-game reference/notes system; more control to manipulate the draw pool ("Let players game the RNG"); remove rooms like deckbuilders do.
- Communication matters: a visible day count "can add an unnecessary sense of time pressure… put a real emphasis on… wasted runs."
- Make the goal granular ("unlock eight safes") to match a game that wants you juggling threads.
- Verdict: great, but "The game doesn't really respect my time."

### Roguelikes, Persistency, and Progression [G9FB5R4wVno]
**Core argument:** No persistent power (roguelike) = pure skill but walls for weaker players and runs that feel wasted; persistent power (roguelite) = every run counts but a backwards difficulty curve and ambiguity over whether you improved. Good designs give progression without power (variety, characters, cosmetics, story) or require skill to bank progress.
- Roguelike: "Nothing is standing between you and the final boss, except for your own ability."
- Cost: "every failed run can feel like a waste of time… nothing tangible to show for it."
- Roguelite: "almost every run is given meaning" but "Did you get better, or did the game just get easier?"
- Progression without power: more variety in the pool (Gungeon), sidegrade characters (Nuclear Throne), cosmetics (Downwell), story/lore on failure (Hades).
- Help that doesn't permanently rebalance: shortcuts that don't count for leaderboards (Spelunky); a one-run carry-over (Into the Breach).
- Make progress require skill: Rogue Legacy's Charon takes unspent money; Dead Cells must bank at stations.
- Players turn minimal-upgrade runs into a meta challenge.

### How To Combine Video Game Genres [H63Bqex1Urs]
**Core argument:** Three ways to combine genres — hand-off (alternate), play style (choose your approach), blend (fuse into something new) — each with risks. Keep secondary modes simple/optional, signal which mode is active, make modes feed each other, avoid forcing a style, and pick genres whose strengths cancel each other's weaknesses.
- Hand-off gives pacing/variety, but "some players may not like every genre in the mix" → keep secondary genres simple ("palette cleansing fluff") or optional.
- Pick genres needing similar skills; be wary of "asking players to suddenly need entirely different ones."
- Communicate which mode you're in (Grapple Dog's speed-run doors); Mark's own magnet game confused players: "engage their brain… or engage their thumbs."
- Long side-modes make players forget the main thread (Sid Meier's Covert Action) → keep segments short and make modes feed each other (XCOM base ↔ battles).
- "Consider the game's core focus, and… make sure everything is pointing in that same direction" (Persona: friendship in both halves).
- Play-style method: players pick one and stick with it; don't reward a style with tools that only help that style (positive loop) — give general points, allow respec, reward switching (Hades).
- Never force a style suddenly (Deus Ex HR bosses): "players are simply going to feel betrayed."
- Blend: choose complementary genres — Spelunky: "each part only boosted the signal of the other parts" (Derek Yu).
- Look for shared traits (Pocket Dungeon: grids, simple controls, randomness, thinking ahead).
- Incompatible blends undermine fantasies (RPG levels blocking stealth kills in Assassin's Creed).

### How Video Game Economies are Designed [Zrf1cou_yVo]
**Core argument:** Economies are flows between five entities — taps, inventories, converters, drains, traders. Their rates shape pace, behaviour, decisions and risk; positive loops cause grinding/exploits, fixed by turning growth into a puzzle, rising costs (negative loops), drains, or market dynamics.
- Taps "can be used to incentivise player behaviour" — put rewards on the behaviour you want.
- Tap flow sets scarcity, value, pace and balance; "a broken tap can create economy-busting exploits."
- Inventory caps force "challenging decisions about what items are most essential, right now" and force spending.
- Converters set pace (XP cost vs. drop rate).
- "If you want to create difficult decisions for the player, have fewer currencies… that can be spent on lots of different things" (Metro vs. Ghost of Tsushima).
- Repeating content for more power = positive loop = "Grinding."
- Fixes: make growth a puzzle (Factorio), escalating costs (Elden Ring), drains (spoilage, breakage, risk of loss).
- Drains "force players to get on and act" and "force you to mix up your strategies"; risk grows with what you carry.
- Drains can be downward spirals (Monopoly).
- Traders/markets: supply and demand (Moonlighter), risk (turnips).
- Fixes create new exploits (Witcher monster head) — re-test.

### What Makes Good AI? [9bbhJi0NBkk]
**Core argument:** Good game AI isn't the smartest; it serves the experience. It lets the player cheat invisibly, telegraphs its thinking, is predictable in actions (unpredictable in consequences), interacts with systems, reacts to and remembers the player, has its own goals, and has personality.
- Perceived intelligence: same AI, tougher enemies → players rating them "very intelligent" jumped "from 8% to 43%" (Halo).
- AI must fit the intended experience: DOOM enemies chasing you made players defensive, so they "hold their ground."
- "Good AI lets the player cheat, just not in ways that the player will actually notice" (Uncharted 0% first shots, Far Cry shooter limits). "It's all about making the game feel more fair."
- "Good AI tells you what it's thinking" — barks, animation, vision cones.
- "Distinct personalities" (Pac-Man ghosts, Civ leaders) make AI seem smarter and readable.
- "The goal is not to create something that is unpredictable… you want an artificial intelligence that is consistent" (Halo) → enables "intentionality." "Predictable actions but unpredictable consequences."
- AI that uses the game's systems seems smart and can be exploited.
- Reacts and remembers (Shadow of Mordor) → "memorable and very personal stories."
- Adapt to the player's habits to stop "the same boring strategy" (MGSV); pacing directors (Left 4 Dead; Pac-Man ghost waves "too stressful… to be continually… hunted").
- Friendly AI can add character with no gameplay value (Prompto's photo album).
- "A patrolling guard's goal isn't to find the player, it's to present interesting gameplay."

### The Genius AI Behind The Sims [9gf2MT-IOsg]
**Core argument:** Sims use utility (needs-based) AI: objects advertise what they offer, Sims weight offers by need curves, personality and distance, then pick randomly among the top options. Data lives on objects, so content scales. The art is knowing what *not* to simulate: ambiguity (Simlish) and "yes, and" let players author their own stories.
- Objects "broadcast what they can offer" ("advertisements"); the Sim weighs and ranks them.
- Need curves (Maslow-inspired): urgent needs dominate when low; fun/social matter more when basics are met.
- Personality weights choices (playful Sim → pinball; serious Sim → book); distance weights too.
- "The Sim doesn't actually choose the best option every time… picks one of the top scoring interactions… at random. This stops the Sims from feeling robotic… and… gives the player something to do."
- Data on objects → "add hundreds of objects… without touching the rest of the code."
- Sims 3 traits become extra motives; context adds temporary motives (in a gym, as a host).
- Hand-authored "production rules" ranked by specificity can't clash — "designers can simply keep adding more and more to the pile."
- Background Sims are simulated at low detail and "snapped" to plausible state when seen.
- Urinal rule removed: following it was "predictable and dull"; random choice made "funny and memorable moments."
- Players build stories: "It was fascinating to me how readily people would build a story around this" (Will Wright).
- Ambiguity: "If we used actual language, the game would flatten and shrink, and everyone would be having the same experience." Ambiguity also hides AI mistakes.
- "Yes, and": autonomy should "build on the player's actions… not negate them."

### The Games That Designed Themselves [kMDe7_YwVKI]
**Core argument:** "Follow the fun" (full phrase: "fail fast, follow the fun") — build a quick prototype, notice the most interesting part, and rebuild the game around it, even dropping your original plan. Speed up with jams, rapid tools, placeholders, level tools, and one fixed anchor (a theme) that never changes.
- Ape Out dropped stealth/time-loops to centre the grab-and-throw that tested best.
- Into the Breach: one enemy telegraphing its attack "was the single most enjoyable part" → the whole game followed from it.
- "It's our job to simply play the game, listen to it, feel it, and kind of feel out what it seems to want to become" (Sam Coster).
- Accidents/bugs become features (Rocket League aerials, Devil May Cry juggling).
- "Gunpoint just kind of told me what it wanted to be" (Tom Francis).
- Content can come from the engine's surprising consequences — designer as "curator" (Jonathan Blow).
- Lean into player exploits when they serve the experience (SpyParty).
- Risk: unpredictable schedules; Heat Signature took years to find its fun.
- "Fail fast": cheap attempts that tell you the next direction.
- Placeholder everything (Don't Starve's hero was Link); build content tools (Mario Galaxy 2).
- "It can actually help to have something about the game that absolutely cannot change" (Journey: love).
- "They're great designers not because they came up with amazing ideas — but because they knew how to listen to the game."

### Nintendo - Putting Play First [2u6HTG8LuXQ]
**Core argument:** Nintendo starts every game from a new way to play (a verb) and derives everything else — characters, world, music, story — from it ("form follows function"). A small verb set that touches everything makes games easy to learn but broad.
- "We get the fundamentals solid first then do as much with that core concept as our time and ambition will allow" (Miyamoto).
- Prototype with a dot: "think about what kind of movement would be fun" (Gunpei Yokoi).
- Everything serves the verb (Mario: fire flower angle, flagpole one brick up, stomping enemies).
- A small action set with many interactions: Pikmin "is very simple… and yet… opens up broad possibilities."
- Attach new mechanics to existing verbs (Splatoon: reload/climb by swimming in ink — "no extra buttons required").
- New play required: "why F-Zero, what do you want that we haven't done before?"
- "Form follows function": Boos blush, spinies replace turtles because players kept jumping on them.
- Presentation and story derive from mechanics (Splatoon → punk/graffiti; Yoshi's Island protecting Baby Mario).
- Characters can personify mechanics (Navi = targeting, Lakitu = camera).
- "When every aspect of the game is suggesting the way you play it it becomes effortless to pick the game up."

### The Secret of Mario's Jump (and other Versatile Verbs) [7daTGyVZ60I]
**Core argument:** "Versatile verbs" — one action with many outcomes depending on how it's performed (press vs. hold, release, repeat with timing, combine with another verb or with movement) — create rapid decisions, expression and satisfaction with few buttons. Advanced uses should be optional.
- Verbs are "the actions that a player can perform"; "press A to do B" is the basic case.
- Press vs. hold creates choices: small now vs. big later (charge shot); risk vs. reward (cooked grenade).
- Releasing as a verb: Luftrausers heals when you stop shooting → "a choice between offence and defence" and "a feisty back-and-forth feel."
- Second press within a timing window (double jump, active reload) adds "satisfying, tactical bite."
- Combine verbs, not buttons: moves should "feel like the natural outcome of the combined verbs."
- Advanced moves are optional: "you almost never need to do any of these advanced moves to get to the end."
- "Versatile verbs let you do more, with less" (heal tied to shoot removes clutter).
- Accessibility caution for holds/mashing.

### Downwell's Dual Purpose Design [i5C1Uj7jJCg]
**Core argument:** Almost every element in Downwell does two or three jobs (jump = shoot; stomp = reload + combo; gems = shop + unlocks + power mode; pickups = weapon + health). This gives depth with half the parts, reduces things to learn, nudges players toward the intended fast play, and makes combos an invisible difficulty mode.
- Miyamoto: "a good idea is something that does not solve just one single problem but rather can solve multiple problems at once."
- Gun boots kill, carve, slow your fall and steer.
- "Downwell can offer a huge amount of depth with essentially half the number of moving parts."
- "You don't need to learn loads of obtuse systems… as long as you understand the basics the rest will flow."
- Dual-purpose systems push the intended style (Gem High and combos reward speed and risk).
- "These combo systems also act like a difficulty mode without making you select it."
- Combos make the early levels fun again on the 50th run.
- Trade-offs in pickups and styles create tough decisions.
- Art does a job too: red = danger, readable "at 100 mph."

### How Overcooked's Kitchens Force You to Communicate [C3M8BvWcJQY]
**Core argument:** Symmetric co-op tends to become parallel solo play. Asymmetric abilities or information force communication, but Overcooked gets the same result with symmetric chefs through level layout and time-based scoring, then keeps roles from settling through disruptions (cooking waits, burning, washing up, moving kitchens).
- Symmetric co-op → "you feel like you're just off playing your own games."
- Different abilities (Revelations 2) or different information (Keep Talking) force cooperation.
- Asymmetric roles let mixed-skill players play together (Galaxy co-star).
- Overcooked keeps symmetry so it scales 1–4 players and roles can be handed out by skill.
- Level layout makes passing faster than going it alone; score is time-based, so cooperation is rewarded.
- Settled roles risk "a predictable pattern"; disruptions (waits, burning, plates, moving stations) "force you to keep switching roles."
- Washing up "doesn't have the nice, predictable rhythm of the other tasks… no one wants to do it" — the key disruptor.
- Success measure: "you'll never stop talking to each other."

### Are Lives Outdated Game Design? [c2CLO8CcBjg]
**Core argument:** Lives (temporary vs. permanent checkpoints) raise stakes, create valuable rewards and a meta-challenge, but frustrate and are hard to balance. Better versions: tie lives to the level, soften Game Over, risky checkpoints, or flip it — reward few retries instead of punishing many.
- Don't ask players to make fundamental design decisions "before they've even started playing" (Crash 4 mode select).
- Against: repeating finished content is frustrating, esp. for new players; balance swings between meaningless and brutal.
- For: stakes → "precise and intentional play, rather than sloppy, brute-force attrition"; relief at save points; 1-UPs become valuable; carry-over meta challenge.
- Fixes: fixed lives per level (Furi); keep upgrades after Game Over (Kero Blaster); new routes on repeat.
- Risky checkpoints (Shovel Knight breakable; Ori pay to save).
- Flip: reward finishing with few retries (1CC, Sonic Forces ranks, Crash 4 gem for <3 deaths) — "new players never need to worry… advanced players can opt-in."
- "Great games aren't made by thoughtlessly copying trends and tropes… every single system is added with intention."

### What's the Point of Prototyping? [8tHJgtbj6rs]
**Core argument:** A prototype answers a question, quickly: is it fun, is it viable to build, will people like it. Keep them ugly (except juice that's core to the fun), use any medium, keep them small and specific, and don't prototype everything — but prototype at any point a question arises.
- "Our brains are terrible video game simulators"; Nintendo: "make before we talk."
- Luke Muscat: "at least half of them weren't fun at all"; a simple idea can have "a feeling when playing it that just isn't right."
- Prototype art, camera, narrative too (Thronefall; Pixar animatics).
- Viability signal: "if it's really easy to make puzzles for the puzzle game, you know you're somewhere fertile."
- Prototype build time predicts project time.
- Word Play (Mark's word game) prototype built in two days at a jam; enthusiasm proved true.
- A failed prototype "told me this isn't it" after weeks not years (Luck of the Draw).
- "Don't make it flashy" — but juice "can be part of the fun"; beware "band-aiding over the problem that the core game isn't fun" with juice.
- Other mediums: Mark prototyped Word Play with "Scrabble tiles… modifiers on a deck of hand-made cards"; spreadsheets or board games for systems.
- "A prototype is not just a crap version of the whole game" — small, specific, separate; Mini Motorways ~20 prototypes.
- "Most of my games, like, the prototypes are pretty thin… we'll figure out the rest of it out there" — know when to stop.
- "Can't decide whether the game should have a double jump or a dash? Make quick prototypes for both, put them in front of playtesters, and go with the winner."

### Valve's "Secret Weapon" [9Yomqk0C6kE]
**Core argument:** Valve treats designs as hypotheses and playtests as experiments: test early, test every week, stay silent and watch, have the designers themselves run tests, use the right audience, challenge assumptions — and interpret data against a clear goal rather than obeying it.
- Portal testers: "that was a great tutorial, I can't wait to play the actual game" → GLaDOS solved a gameplay problem (motivation/context), not a story wish.
- Loop: goal → design → playtest → change, until "no longer excruciatingly painful to watch the playtests."
- "We see our game designs as hypotheses and our playtests as experiments" (Mike Ambinder).
- Early: Portal tested after one week, with one half-finished room. Fix early or you get "a flimsy band-aid solution."
- Often: weekly cadence (test Friday, discuss Monday); ~100 testers per HL2 chapter to find trends, not outliers.
- Learned rules: "players don't learn when stressed", "players don't look up."
- "Shut up and watch… you'll often learn more by watching players than by talking to them"; "you'll really tell by their body language."
- Tester-proposed solutions "are usually better left ignored."
- Designers run their own playtests; player behaviour inspires mechanics (covering mouth in Alyx).
- Right audience: hardcore FPS testers wanted a harder boss; most Portal players were "frustrated, confused, and dissatisfied" → harder stuff went into optional content.
- Challenge assumptions: the easiest puzzle (fire-pit escape) felt most climactic — "time pressure, the visual impact, and the high drama."
- Positive feedback is also just data (HL2 delayed combat for emotional payoff).
- "If you just bend the game to the whims and desires of every playtester… design-by-committee sludge"; "go in with a clear goal… then use playtesting to validate whether you are hitting that goal."

### What Makes a Game Feel Mysterious? [ilnq1ZNmhoM]
**Core argument:** Mystery = deliberately withholding information (locked doors, rules, landscape, narrative), which opens a "curiosity gap" the player closes themselves. Knowledge-based keys give the deepest "aha". Budget how many open threads exist, avoid predictable templates, layer mandatory vs. optional mysteries, and the best are "invisible questions" the player didn't know existed.
- Mystery is the "withholding of information, [and] doing that intentionally" (JJ Abrams).
- Locked doors = "paths into the darkness… curiosity and speculation is fun" (Andrew Shouldice).
- Budget the mental load: "it can be overwhelming to walk into a room and see six doors" (Billy Basso).
- Hidden rules are intriguing but risk bounce-off: "be conscious about which elements of the game should aim for usability and which should aim for ambiguity" (Rune Johansen). Hide optional or inherently unknowable things first.
- Don't let chatty companions over-explain ("Thank you! I can see it myself!!").
- Curiosity needs bait: "players would only be drawn to things that were particularly weird… eye-catching" and to narrative that "felt personal and directed at them" (Outer Wilds).
- Curiosity gap: "the space between the information we're given, and the information that's being withheld."
- Players as active participants: "discovering things on my own, making my own mistakes" (Derek Yu).
- Knowledge-based keys: force attention, can be solved any time (sequence breaks), and give "aha, I figured it out!"
- Layer mysteries: layer 1 for everyone, layer 2 for enthusiasts, layer 3 for communities (Animal Well).
- "If the act of solving the mystery is really fun, then the answer doesn't particularly matter."
- Templates kill mystery (Elden Ring catacombs) → add unique cases and break established patterns.
- Invisible questions (The Witness environment puzzles): "the entire path that you've traveled becomes littered with question marks"; must be optional — "legitimately likely that you could finish the game and never see that stuff" (Blow).

### How I Made Word Play [uuXrwA9nzM8] — *added: Mark's own word game*
**Core argument:** Mark built Word Play (Balatro + Scrabble roguelike) in seven months by prototyping at a jam, building "a really good spelling game" first, then the roguelike loop, then content, then QA — "ruthless" scope decisions and a layered build order. Playtest feedback shaped word-game specifics.
- Jam prototype ("Wordy") → strong response → commit quickly.
- Layer 1 was purely the word game: "just build a really good spelling game. Something where it was nice and juicy to spell words", across mouse/controller/keyboard/touch.
- Only then the roguelike layer (shop, perks, special tiles, rounds), then content (perks to 160), then QA/balance.
- Naming from feel: losing a "life" for spelling a word correctly "just feels weird" → "plays" → "Word Play".
- Feedback-driven word-game changes: rearrange tiles on the board; bonus for long words ("otherwise you barely get any points for dropping a single mega word"); submit words over 10 letters; petition to add dictionary words; peek at bag/board during perk screen.
- Perks based on word specifics (same first/last letter) "would prove to be very important in the game's overall sense of strategy and balance."
- Accessibility: alternative controls, dyslexia-friendly fonts, spelling suggestions; moddable dictionaries/letter bags.
- Added analytics early "to help with future balancing."
- QA testers "found perks that were overpowered, and perks that were pointlessly weak… helped me balance the difficulty curve."
- Clone panic resolved: "I can't control what anyone else makes. The only thing I can control is how good my game is."
- Scope: "which choice is going to take the least amount of time" — simple icons instead of 160 unique arts.

### 3 Lessons from a Real-time, Turn-based Game [1ythOI5yEqw] — *added: turn-based relevance*
**Core argument:** Nova-111 mixes turn-based and real-time (born from a bug). Lessons: even opposite genres combine if they complement each other; stay open to serendipity; and a central idea must shine through every part of the game or it remains "just a good idea."
- Real-time pressure inside a turn-based game swings pacing from deliberate to manic — but makes players "throw all that careful planning out the window."
- A real-time fuel drain was removed because "it never gave players time to sit back and think on their next move."
- "Players must be rewarded or forced to do something risky and fun or they'll do something easy and boring."
- Too many sections ignore the core idea → "without smart execution a good idea is just a good idea."
- "If something is at the beating heart of your game it needs to shine through in every aspect."

### The 100 Games That Taught Me Game Design [gWNXGfXOrro]
**Core argument:** Learn design by playing widely and naming the *one* lesson each game teaches. Together the entries make a reference library of design concepts. Below are the ones most relevant to small turn-based, board, word and cozy games.
- Space Invaders: the "undulating staircase" difficulty curve gives "rising tension… but also moments of relief."
- Pac-Man: swinging between two emotional states, "a dramatic back-and-forth tussle between power and powerlessness."
- Tetris: "diegetic difficulty". The game gets harder as "a natural outcome of the play space… clearly visible and immediately understandable" (unlike artificial speed-ups).
- Resident Evil: "make a player feel empowered, or disempowered, simply by turning the big dial labelled 'resources'."
- Crazy Taxi: the arcade lesson. Games must "hook you immediately, explain their gameplay in seconds", giving "a lot of fun in a short period of time."
- Animal Crossing (patient zero for cozy games): "no pressure to finish any of them anytime soon"; "real value in giving players a reason to switch off."
- WarioWare: each microgame has to show how to play "in the blink of an eye… through colour, shape, composition, and a single-word prompt."
- Plants vs. Zombies: to learn a genre, "find a game that boils it down to its absolute essentials and start there."
- Civilization: the "inverted pyramid of decision making". One choice at first, dozens later once you're invested. A familiar theme lowers the barrier: "never underestimate the power of using stuff that the player likely already knows about."
- Mark of the Ninja vs. Thief: more information turns observation into planning. This shows "how your interaction with a world changes, depending on how much you know about it."
- Into the Breach: "when almost nothing is left up to chance, and almost everything is shown to the player", the result is an elegant puzzle.
- Disco Elysium: "micro-reactivity". Referencing small choices is "the closest an RPG can come to… a very good dungeon master."
- Mario Kart: rubber-band items let "everyone [to] have fun together."
- Among Us / Spaceteam / Journey: games "more about the people you play with, than the game itself", plus local play and non-violent connection.
- Celeste: grace mechanics "permit the player's intention — if not their exact inputs". Explain assist modes, and "most players… don't need to turn on assist mode unless they really need it."
- Hitman: "'Repetitive' isn't necessarily a dirty word if it leads to a feeling of true mastery."
- Rimworld: an "AI storyteller" picks events "based on what would be most interesting."
- Far Cry 2: friction can be the point. Play it back to back with Far Cry 3 to learn your own preferences.
- Downwell: risk and reward create "a natural difficulty curve where new players will shoot… expert players will… graduate to bopping enemies."
- Closing advice: learn from "card games, and board games, and tabletop roleplaying games" too.

---

## 2. Mark's design toolkit (recurring frameworks, stated as usable rules)

**A. Judge every mechanic by the experience it produces.**
1. *MDA chain:* "Mechanics happen in the code, dynamics happen in the player's actions, and aesthetics happen in the player's feelings." You can only change mechanics, so predict the behaviour they cause, then the feeling. [iIOIT3dCy5w]
2. *No right or wrong mechanic.* Judge it only on "whether or not it can contribute to the experience you're trying to forge." Never add a mechanic because the genre or a trend says so (lives, saves, timers, levels). [Cm2_drGLGbc, c2CLO8CcBjg]
3. *One-line vision as a lodestar.* Every mechanic, sound and image must "sing the same notes". Cut fun features that fight the target emotion (Flower). [iIOIT3dCy5w]
4. *Name feelings precisely.* Not "fun" but tense, clever, sneaky, cozy, smug, relieved. [iIOIT3dCy5w]
5. *Aesthetics are subjective.* Time pressure and scores can feel exciting to one player and anxious or judged to another, so decide who the game is for and protect them. [iIOIT3dCy5w, zk3S3o1qOHo]
6. *Borrowing test.* Before copying a mechanic, say why it works in its source game and whether that reason exists in yours. [iIOIT3dCy5w]

**B. Players optimise, so steer them instead of forcing them.**
7. *"Given the opportunity, players will optimise the fun out of a game"* (Soren Johnson). For every mechanic, ask what the safest, most boring dominant strategy is, and whether it's easier than the intended one. [7L8vAGGitr8, Go0BQugwGgM, zk3S3o1qOHo]
8. *Encourage rather than punish.* The same numbers framed as a bonus beat them framed as a penalty (WoW rest XP). Reward the intended style, and keep other styles valid but not "a no-brainer." [7L8vAGGitr8, QAVf7rb0IwM]
9. *Pressure ladder for pace problems,* from gentlest to harshest: reward speed (par) → optional expiring bonus (meld) → escalating challenge (security level) → fail state (XCOM 2). Pick the lowest rung that creates the feeling you want. [QAVf7rb0IwM]
10. *Presence matches importance.* How deep a system is tells players how much it matters, so trim systems that aren't the point (Mark of the Ninja). [7L8vAGGitr8]
11. *Scores as steering.* Scoring rules (diminishing points for repeats, combos, bonuses) push players toward the intended play and act as self-chosen difficulty. [K6y9PJipfpk]

**C. Randomness and information.**
12. *Input vs. output randomness.* Luck before the decision supports strategy; luck after it undercuts strategy. Turn output luck into input luck where you can ("Output became input"). [dwI5b-wRLic]
13. *Favourable-only output luck.* Surprise that only ever helps the player: "no one ever ever complains." [dwI5b-wRLic]
14. *Constrain distributions.* Bags, split decks, pity timers and mercy rules stop streaks that feel unfair. Humans misread odds, so nudge the numbers in the player's favour or use physical metaphors (dice, cards, bags). [dwI5b-wRLic]
15. *Information horizon.* Complete information breeds analysis paralysis and flat, airtight plans; some hiddenness creates drama. Spiky information flow means big reveals at regular intervals. [dwI5b-wRLic]
16. *Information sets behaviour and feel.* More information makes a planning game; less makes an observation or suspense game. [gWNXGfXOrro, zk3S3o1qOHo]
17. *Hidden-but-attainable is a trap.* If information is hidden for feel but can still be worked out, optimisers will do tedious busywork. Either show it, truly hide it, or gate it. [zk3S3o1qOHo]
18. *Mystery = withheld information + a curiosity gap the player closes themselves.* Limit how many open threads there are at once, and break your own templates. [ilnq1ZNmhoM]

**D. Feedback loops and economies.**
19. *Feedback loops.* Positive loops end games decisively but cause death spirals and runaway leaders. Negative loops create comebacks but punish success and send "mixed signals." Pair them, dampen them, or stop rewards from turning into power. [H4kbJObhcHw]
20. *"It is still better to win… than to lose."* Catch-up rules must never make losing the smart move. [H4kbJObhcHw]
21. *Skill rewards must not make the game easier.* Reward skill with harder content or prestige, not power. (Mario's expert 1-UPs pushed experts "out of the top pipe".) [gkvyYTSKTQY, H4kbJObhcHw]
22. *The parts of an economy.* Taps (put rewards on the behaviour you want), inventories (caps force choices), converters (set the pace), drains (force action, add risk) and traders. "Fewer currencies… spent on lots of different things" means harder decisions. [Zrf1cou_yVo]

**E. Difficulty, failure and help.**
23. *Three pipes.* An average main path, plus connected easier and harder paths the player can switch between mid-game. Don't make players predict their skill before they've played. [gkvyYTSKTQY, c2CLO8CcBjg]
24. *Assist timing and cost.* Offer help "on the verge of tears", not while the player is "brimming with determination". Assists are temporary and cost the "true" reward. [gkvyYTSKTQY]
25. *Fair vs. BS difficulty.* Fair means you can see how to improve and you blame yourself. BS means repetition, randomness and troll moves, and winning brings relief instead of triumph. [Ip5pYl-MuYs]
26. *Wide, reversible failure spectrum.* Setbacks should be small, unpredictable and recoverable. Don't give power rewards for perfect play, and make failure interesting. [Go0BQugwGgM]
27. *Flip punishments into rewards.* Reward few retries instead of punishing many (Crash 4's gem, one-credit clears). [c2CLO8CcBjg, rJZyPdYIbZI]
28. *Explain your options* (Celeste). An assist that comes with an explanation rarely gets misused. [Cm2_drGLGbc, gWNXGfXOrro]

**F. Motivation and engagement.**
29. *Engaging, not addictive.* Use pacing (alternate intensity), novelty teased by anticipation, long goals split into short ones, and fair challenge. No streaks, daily rewards or FOMO. [hbzGO_Qonu0, V1kbBcm9XRI]
30. *Overjustification.* Explicit goals and rewards can kill fun that players already enjoy for its own sake. Safe rewards are "unexpected, reasonably low value, and… tied to the actual performance." Prefer comparisons or self-set goals over fixed thresholds and checklists. [1ypOUn6rThM]

**G. Elegance.**
31. *Dual purpose.* Each element should solve several problems at once (Miyamoto), giving depth with fewer parts. [i5C1Uj7jJCg, rJZyPdYIbZI]
32. *Versatile verbs.* One action with many outcomes depending on how, when or where it's done. [7daTGyVZ60I]
33. *Play first; form follows function.* Start from a new way to play, then derive theme, art and story from it. [2u6HTG8LuXQ]
34. *Synergies and lenticular design.* Simple on the surface, deep in combination. Synergies should need set-up and be found by the player, not handed over. [terD4Bk3L_8]
35. *The core idea must show up in every part of the game,* or "a good idea is just a good idea." [1ythOI5yEqw]

**H. AI.**
36. *AI's job is interesting gameplay, not intelligence.* Let the player cheat without noticing; telegraph the AI's thinking (spoken barks); give distinct personalities; keep actions consistent but consequences unpredictable; let the AI use the game's systems; have it react and remember; give it its own goals. [9bbhJi0NBkk]
37. *Utility AI with a random pick among the top options.* This avoids robotic play and leaves room for the player. Ambiguity hides AI mistakes, and "yes, and" means the AI never undoes the player's story. [9gf2MT-IOsg]

**I. Process.**
38. *Brains are bad game simulators.* Prototype to answer one named question, quickly. Keep it ugly, except for juice that *is* the fun. [8tHJgtbj6rs, Cm2_drGLGbc]
39. *Follow the fun* (full phrase: "fail fast, follow the fun"). Find the most enjoyable part of the prototype and rebuild around it, while keeping one anchor that never changes. [kMDe7_YwVKI]
40. *Problem-solving moves.* Find the root cause and make sure everyone agrees on the problem. List the levers, treating what can't change as the thing's identity. "Double it, or cut it in half." Flip it, or solve it somewhere else. Prefer fixes that solve several problems. Study what players actually do, check for knock-on effects, and re-test without telling testers what changed. [rJZyPdYIbZI]
41. *Playtesting.* Designs are hypotheses. Test early and weekly, and "shut up and watch": body language beats answers. Ignore testers' proposed solutions, test with the right audience, and challenge your assumptions. Positive feedback is data too. [9Yomqk0C6kE]
42. *Feedback.* Look for problems, not solutions, and don't mistake a vocal minority for everyone. Be "data informed, not data driven" (watch for hidden causes). Don't sand away what makes the game interesting, and explain your decisions. [P05ONfLOqmY]
43. *Balance.* Trade-offs (a power budget); counters (rock-paper-scissors: characters picked before the match must be balanced, while the moves made during it are deliberately unbalanced); win rates by match-up and skill tier; pick rates; and the perception of balance. [WXQzdXPTb2A]
44. *Layered build and ruthless scope* (Word Play). Make the core verb juicy first, then the loop, then content, then QA. For scope calls, choose "which choice is going to take the least amount of time." [uuXrwA9nzM8]

---

## 3. Applied to Glyphtender

Based on the current GDD (.planning/GDD.md, read 2026-10-09). Each point is marked **✓ confirms the design**, **⚠ risk**, or **→ idea**.

**Secret Magic and the reveal**
1. **⚠ Biggest finding: Secret Magic may be "hidden but attainable" (Balatro's cursed problem).** The GDD says score pops show each turn's Magic ("Only this turn's Magic — running totals stay secret"). If every player sees every turn's pops, a determined player can add them up on paper and know the exact standings. That turns "Am I ahead…?" into bookkeeping, and makes "Called it" a reward for maths, not nerve. Mark: "the only way to square that circle is to hope that players won't bother to calculate". Soren Johnson: players "will optimise the fun out." Three options in Mark's spirit: (a) truly hide it: rival turns show the words and a feel tier (small, big, huge) but not exact numbers; (b) keep it fuzzy on purpose: the tangle bonus already stays uncertain until the end, which helps; (c) accept it and make it official: an optional "show scores" table setting, explained the way Celeste explains its assists. Decide, and write the reason in the TDD. To test it, ask everyone in a playtest to guess the standings before the reveal and log how close they were.
2. **✓ The staged reveal is Balatro's "watch the machine go" moment.** The ceremony only works if the result is unknown, which is why point 1 protects the reveal. The Story chart showing hidden lead changes is the right payoff: like Disco Elysium and Hades, it tells your past choices back to you.
3. **⚠ Hidden scores remove the natural "gang up on the leader" brake.** Mark calls players ganging up on the leader "a naturally occurring negative feedback loop." The GDD values hidden Magic for blunting kingmaking, which suits a cozy game. The cost is that the table can't rein in a runaway leader. → Sim metrics: lead changes in the final third, and how often the leader at the two-thirds mark wins. If runaway wins are common, fix it in the rules (a catch-up rule such as more generous refreshes), not by revealing scores.

**Tangles, self-tangling and invisible choices**
4. **✓ The self-tangle is an "invisible choice".** You choose to end the game with the normal verbs (move, cast), not a menu button. Mark says invisible choices make players "feel smart" and make consequences more surprising. His warning applies: "make it crystal clear… that this is an outcome of their earlier actions. Too subtle, and all your hard work is wasted." The "Called it" award and the Story chart do exactly this, so keep both.
5. **⚠ A positional death spiral.** A hemmed-in glyphling has fewer moves, so fewer casts, so less Magic, so it's more likely to be tangled, and its tangle bonus goes to rivals. Failure compounds itself (a positive loop). The GDD's counters (refresh when you made no Magic, the snake draft, the tangle check every turn) push back the other way, which is good. → Sim metric: the win rate of the first player whose glyphling drops to 2 or fewer moves. Pyre's lesson is to pair the loop with a counter-loop so a mistake is "a road bump… not a tipping point."
6. **✓ A wide failure spectrum.** Moves count down gradually and the danger cue shows it, so trouble is recoverable rather than instant failure, and "Close call" rewards the recovery. This is Tom Francis's reversible failure spectrum.

**Turn timers and pace**
7. **✓ F52 "Nobody waits" follows "encourage, don't punish".** When you idle, a bot plays for you and you can tap to take back over; there's no fail state. Its wording is help, not penalty (like WoW's rest-XP framing). Keep it that way.
8. **→ Any future competitive turn timer should use the gentlest rung of the pressure ladder.** Mark's rule for Mario + Rabbids applies to a cozy game: "stress is not really the aim". Make fast play attractive (snappy controls, the AI speed setting) rather than adding a countdown. Time pressure "might feel… anxiety-inducing to another", so make a timer an opt-in table option and explain why it exists.
9. **⚠ Analysis paralysis.** A fully visible board plus 8 seeds × moves × leylines makes choices multiply fast (Into the Breach players spend "10, 20 minutes… staring"). Hidden hands and hidden Magic limit how far ahead players can plan, a little. → Watch for long turns in playtests. The planned hint tool (Should: "show me a move") is Mario's Super Guide: offer it only after the player is stuck (Iwata's timing), and don't let hinted turns earn awards (the assist costs the true reward).

**Randomness**
10. **✓ Almost all of Glyphtender's luck is input randomness:** you draw seeds before deciding, and nothing random happens after the cast. Mark calls this the kind of luck that supports strategy. The bag works like a card deck, where each draw changes the odds of the next, so players can read it. Refresh builds in Blue Prince's fix ("let players game the RNG").
11. **→ Favourable-only surprise (Into the Breach's buildings sometimes survive):** if luck after a decision is ever added, make it only ever help the player, e.g. a rare bonus draw.

**Awards (Highlights)**
12. **✓ The awards fit what the research says about rewards that don't backfire:** they're "unexpected, reasonably low value, and… tied to the actual performance". They give no Magic, they're measured from board effects, and they appear after the game. Muzzy's rule ("indicating to a player that they did something right") is Mark's point exactly. Keep three guards: never show awards as a checklist before or during play (Don't Starve's quests made players "optimise… in really boring ways"); never let them add Magic (Mario: skill rewards mustn't add power); never award luck.
13. **✓ The awards teach the hidden layer.** "This game is secretly more about positioning" is Rosewater's lenticular design: a spelling game on the surface with deeper play underneath. Awards like Lockdown and Weed toss work like The Witness's "invisible questions". They show a returning player that the board they've been playing on was a positioning puzzle all along. → Have the Highlights carousel lead with a positioning award when one was earned.
14. **→ Compare instead of setting fixed bars.** Zach Barth found self-set goals beat fixed thresholds. Later stats (the 1.0 radar) should compare you with your own past games or with friends (a histogram, a personal best), not with fixed targets.

**AI opponents**
15. **✓ The AI design already meets much of Mark's good-AI checklist.** Fuzzy beliefs let "the player cheat, just not in ways… [they] notice". Banter tells you "what it's thinking". Three personalities in a rock-paper-scissors loop give distinct, readable characters that counter each other. → Add the Sims trick if it isn't there: pick at random among the top few moves, weighted by personality, so the AI feels human and never perfectly optimal. From Halo: keep *what* a personality does consistent, and *exactly where* it does it unpredictable.
16. **⚠ The "Hunted, but cozy" AI target meets DOOM's lesson:** enemies that chased players made them back off and play defensively. A hunting Strategist could push humans into turtling, the opposite of the clever positional play the game wants. → The Personality Check should measure the *human's* behaviour against each personality (moves kept, risks taken), not just the AI's win rate.
17. **→ Balance by match-up and skill tier, not by overall win rate.** (League of Legends' Akali won 44% overall but 72% at the World Championship.) For 3 personalities × 3 skills, report a match-up matrix per skill tier. Once real players exist, also log pick rate: which personality players choose.

**Engagement, scoring, onboarding**
18. **⚠ Word Play's long-word lesson.** In Mark's word game, players felt they "barely get any points for dropping a single mega word", so he added a length bonus. Glyphtender deliberately has no letter values ("best speller doesn't always win"). Watch the feeling, not the number: does a 7-letter word *feel* big? Audio and score-pop feel tiers can make it feel big without changing Magic, which keeps the reveal honest.
19. **→ Word-game polish from Word Play:** a way to dispute or suggest dictionary words (Mark added "petition for more words"), a dyslexia-friendly font, spelling suggestions, and peeking at the board or bag from other screens. Candidates for the 1.0 accessibility pass.
20. **✓ Civilization's "inverted pyramid of decision making" suits the 1.0 tutorial:** the first turn is one choice (move), then the cast, then words through others' seeds, then tangles.
21. **⚠ Don't front-load design decisions** (like Crash 4's lives-mode menu before you've played). New Game already asks about word indicators, hidden seeds, 2-letter words, board size and AI skill. Keep sensible defaults and tuck the rest under "table options".
22. **✓ Pacing:** Space Invaders' staircase and Pac-Man's power swings fit the arc of a game. Calm drafting, then a rising squeeze as the board fills (Tetris-style "diegetic difficulty": the garden itself gets harder), then the release of the reveal. Keep the reveal as the big relief beat.
23. **→ Engagement ethics:** no daily streaks, expiring rewards or FOMO (Mark asks: "are you playing this game because it's fun, or because you feel pressured"). "Again?" within a minute is the right engagement measure.

---

## 4. BMUZ implications (concrete changes, each with evidence)

1. **mda-analyze: add an "Optimiser test" step.** For every mechanic ask: what would a player who optimises the fun out of this do? Is that route easier than the intended one? Can any hidden information be worked out? *Evidence:* the Soren Johnson quote recurs in 4 videos [7L8vAGGitr8, Go0BQugwGgM, zk3S3o1qOHo, gWNXGfXOrro]; Balatro players using calculators and Isaac players relying on a wiki [zk3S3o1qOHo]; Alien: Isolation players dying on purpose to reach the checkpoint [iIOIT3dCy5w].
2. **mda-analyze: add an "Information audit" table.** Mark each piece of game state as Shown, Hidden or Hidden-but-attainable, with the feeling it's meant to create. Hidden-but-attainable items need a decision: show, truly hide, or gate. *Evidence:* [zk3S3o1qOHo, dwI5b-wRLic; gWNXGfXOrro on Mark of the Ninja vs. Thief]. First use: Glyphtender's Secret Magic (§3.1).
3. **mda-analyze: add a "Loops map".** List the positive and negative feedback loops and who each one helps. Check for death spirals and runaway leaders, check that winning is always better than losing, and check whether skill rewards add power. *Evidence:* [H4kbJObhcHw, gkvyYTSKTQY, Zrf1cou_yVo]. Sim measures: lead changes in the last third; win rate of the first player into danger.
4. **mda-analyze: add a "Randomness audit".** Mark each random element as input (before the decision) or output (after it). Turn output into input, or make it favourable-only. *Evidence:* [dwI5b-wRLic] (Slay the Spire's "Output became input"; Justin Ma's favourable-only rule).
5. **mda-analyze: add an "Encourage, don't punish" rule plus the pressure ladder** (reward → optional expiring bonus → escalation → fail state) for any pace or behaviour problem. *Evidence:* WoW rest XP, the XCOM 2 timer backlash, Invisible Inc, Mario + Rabbids and XCOM's meld canisters [7L8vAGGitr8, QAVf7rb0IwM].
6. **mda-analyze and /define: add a "Reward check" for awards, achievements and unlocks.** Is it unexpected? Low value? Tied to performance? Free of power? Kept off any visible checklist? *Evidence:* the overjustification effect and Don't Starve's quests [1ypOUn6rThM]; Mario's 1-UP loop [gkvyYTSKTQY]; Fortnite's FOMO [V1kbBcm9XRI].
7. **/define: add a one-line vision "lodestar" and a "Who is it for?" line** to the GDD header, plus a note on any copied mechanic: "Borrowed from…, works there because…". *Evidence:* the Subnautica, RE Village and DOOM vision statements; Alien: Isolation's save system; Mark's Spider-Man audience lesson [iIOIT3dCy5w, Cm2_drGLGbc].
8. **/define: add "Dual-purpose" and "core idea everywhere" checks.** Does each new system do 2 or more jobs? Does the core verb show up in every part of the game? *Evidence:* Downwell and Miyamoto [i5C1Uj7jJCg, rJZyPdYIbZI]; Nova-111's "a good idea is just a good idea" [1ythOI5yEqw]; Nintendo's play-first approach [2u6HTG8LuXQ].
9. **/discover: "Verb first, follow the fun".** Start a game idea from its core verb, prototyped as a dot or a box. After each prototype, write down the single most enjoyable part and ask whether to rebuild around it. *Evidence:* [2u6HTG8LuXQ, kMDe7_YwVKI] (Into the Breach, Ape Out, Gunpoint).
10. **/discover and /develop: "A prototype answers one named question".** State the question first (Is it fun? Can we build it? Will people like it? A or B?). Keep it ugly unless juice is the fun, and stop once the risky questions are answered. *Evidence:* [8tHJgtbj6rs]; Mark prototyped Word Play with Scrabble tiles and hand-made cards, a cheap physical prototype.
11. **/develop tuning: "Swing big, then settle".** BMUZ already says "pick one knob". Add Sid Meier's "double it, or cut it in half" for the first adjustment, and Bungie's habit of listing what can't change (the thing's identity) before choosing from what can. *Evidence:* [rJZyPdYIbZI].
12. **/bug and /develop: a problem-solving checklist.** Restate the root cause in terms of what players do. Check everyone agrees on the problem. Look for a fix somewhere else, or a flip. Prefer fixes that solve 2 problems. Check for knock-on effects. Re-test without telling the tester what changed. *Evidence:* Dying Light, Astroneer, Shovel Knight, The Last of Us, NSMB's bubble, Rainbow Six Siege and Halo's Jaime Griesemer [rJZyPdYIbZI].
13. **A playtest protocol (in PROJECT-FILES or the live-playtest skill).** "Shut up and watch." Log body language and "again?". Record what testers *feel*, and turn their proposed fixes back into problems. Never tell them what changed. One odd tester is an outlier; a pattern across testers is a signal. *Evidence:* Valve [9Yomqk0C6kE]; the Nioh and XCOM feedback stories [P05ONfLOqmY].
14. **Sims and the proto skill: "data informed, not data driven".** Before acting on a sim finding, check for a hidden cause (Slay the Spire's Madness card looked overpowered only because a late event handed it out). Report win rates as match-up matrices per skill tier, plus first-player and "leader at two-thirds wins" stats, not just overall win rate. *Evidence:* [P05ONfLOqmY, WXQzdXPTb2A].
15. **ai-opponent skill: Mark's good-AI checklist.** The player can "cheat" without noticing; the AI telegraphs its thinking (barks); personalities are readable; actions are consistent but consequences unpredictable; it picks at random among the top few moves, weighted by personality; and the *human's* behaviour is measured against each personality (does it push them to turtle?). *Evidence:* [9bbhJi0NBkk, 9gf2MT-IOsg] (Halo's 8% → 43%, DOOM's enemies, the Sims' random pick among top options).
16. **A difficulty and assist lens (a new section in mda-analyze or PROJECT-FILES).** Three connected pipes. Hints and assists appear only after the player has struggled (Iwata), are temporary, and cost the true reward. Explain options the way Celeste does. Don't ask for fundamental choices before play. *Evidence:* [gkvyYTSKTQY, c2CLO8CcBjg, Cm2_drGLGbc].
17. **An ethics line in PROJECT-FILES:** "Engaging, not addictive: no streaks, daily rewards, expiring unlocks or FOMO. Measure 'again?', not retention tricks." *Evidence:* [hbzGO_Qonu0, V1kbBcm9XRI].
18. **A build-order rule (BMUZ is already close):** make the core verb juicy, then build the full loop, then content, then QA and balance. For scope calls ask "which choice takes the least time?" and accept a slightly worse game that ships. *Evidence:* Word Play took 7 months; Mind Over Magnet took over 3 years [uuXrwA9nzM8].
19. **/gdd "what if…": a feedback filter.** When Muzzy or a tester proposes a fix, first restate the problem and the feeling it hurts, then weigh other options ("there are other routes to this same feeling"). Don't sand off what makes the game interesting. *Evidence:* [P05ONfLOqmY, 9Yomqk0C6kE].
