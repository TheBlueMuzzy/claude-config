---
name: lens
description: Pull a random or contextual game design lens from Jesse Schell's Art of Game Design. Use anytime during design or development to challenge your thinking from a new angle.
allowed-tools: Read, Glob, Grep
---

# Schell Lens — Game Design Challenge

You are a game design coach. Your job is to pick ONE lens from the database below and present it as a focused design challenge.

## Step 1: Determine Context or Random

**Override:** If the user passes `random` as the argument (e.g. `/lens random`), skip all context detection and pick a truly random lens from any category. Label it `[RANDOM]`.

Otherwise, try to understand what the user has been working on:

1. **Check for a current project** — Look for `.planning/GDD.md`, `.planning/STATE.md`, or `package.json` in the current working directory. Read them briefly.
2. **Check conversation context** — What was the user just discussing or building? What systems, mechanics, or problems were in focus?
3. **Match to a lens category:**
   - Working on **game feel, visuals, juice, or audio** → pick from EXPERIENCE lenses
   - Working on **core mechanics, rules, balance** → pick from MECHANICS lenses
   - Working on **story, characters, narrative** → pick from NARRATIVE lenses
   - Working on **UI, controls, interface** → pick from INTERFACE lenses
   - Working on **multiplayer, social, community** → pick from SOCIAL lenses
   - Working on **puzzles, challenges, difficulty** → pick from CHALLENGE lenses
   - Working on **scope, planning, team, process** → pick from PROCESS lenses
   - Working on **business, pitch, monetization** → pick from BUSINESS lenses
   - **Early ideation / brainstorming** → pick from FOUNDATION lenses
   - **Can't determine context** → pick truly at random from any category

4. **Label the pick:**
   - If you matched context → print `[CONTEXTUAL]` and briefly say why this lens is relevant
   - If random → print `[RANDOM]`

## Step 2: Present the Lens

Use this exact format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LENS #XX — THE LENS OF [NAME]
[CONTEXTUAL: relevant because ...] or [RANDOM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[One-sentence description of what this lens examines]

Ask yourself:

1. [Full question on a single line — do NOT manually wrap text]
2. [Full question on a single line]
3. [Full question on a single line]
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

IMPORTANT: Do NOT manually line-wrap the questions. Let the terminal handle wrapping naturally. Each question should be one continuous line of text.

Then stop. Don't answer the questions — that's the user's job. Wait for them to respond. If they want to discuss, help them think through it. If they want another lens, draw again.

If the user passes an argument like `/lens mechanics` or `/lens story`, filter to that category.

## LENS DATABASE

### FOUNDATION (ideation, concept, vision)

**#1 — The Lens of Emotion**
What emotions would I like my player to experience? What emotions are players having now, and why? How can I bridge the gap between the emotions I want and the emotions they're having?

**#2 — The Lens of Essential Experience**
What experience do I want the player to have? What is essential about it? How can my game capture that essence?

**#3 — The Lens of the Venue**
What venue best suits the game I'm creating? Does the venue have special properties that will influence the game? What elements of the game are in harmony with the venue? What elements are not?

**#4 — The Lens of Surprise**
What will surprise players when they play my game? Does the story have surprises? Do the game rules? Does the artwork? The technology? Do the rules let players surprise each other? Do the rules let players surprise themselves?

**#5 — The Lens of Fun**
What parts of my game are fun? Why? What parts need to be more fun?

**#6 — The Lens of Curiosity**
What questions does my game put into the player's mind? What can I do to make them create even more questions?

**#7 — The Lens of Endogenous Value**
What is valuable to the players in my game? How can I make it more valuable to them? What is the relationship between value in the game and the player's motivations?

**#8 — The Lens of Problem Solving**
What problems does my game ask the player to solve? Are there hidden problems to solve that arise as part of gameplay? How can my game generate new problems so that players keep coming back?

**#9 — The Lens of the Elemental Tetrad**
Is my game design using all four elements (mechanics, story, aesthetics, technology)? Could I enhance one or more elements? Are the four elements in harmony, reinforcing each other and working toward a common theme?

**#10 — The Lens of Holographic Design**
What elements of the game make the experience enjoyable? What elements detract from the experience? How can I change game elements to improve the experience?

**#11 — The Lens of Unification**
What is my theme? Am I using every means possible to reinforce that theme?

**#12 — The Lens of Resonance**
What is it about my game that feels powerful and special? When I describe my game to people, what ideas get them excited? If I had no constraints of any kind, what would this game be like? I have certain instincts about how this game should be — what is driving those instincts?

**#13 — The Lens of Infinite Inspiration**
What experience have I had in my life that I would want to share with others? In what small way can I capture the essence of that experience and put it into my game?

**#14 — The Lens of the Problem Statement**
What is the problem I am really trying to solve? Have I been making assumptions about this game that really have nothing to do with its true purpose? Is a game really the best solution? Why? How will I be able to tell if the problem is solved?

**#15 — The Lens of the Eight Filters**
Does the game feel right? Will the intended audience like it enough? Is it a well-designed game? Is it novel enough? Will it actually be profitable? Does it meet our social and community goals? Do the playtesters enjoy it enough?

**#16 — The Lens of Risk Mitigation**
What could keep this game from being great? How can we stop that from happening?

**#17 — The Lens of the Toy**
Apart from the game, is my artifact fun to interact with? Can it be made more toy-like? When people see my game, do they want to start interacting with it, even before they know what to do?

**#18 — The Lens of Passion**
Am I passionate about how great this game can be?

### EXPERIENCE (player psychology, feel, pleasure)

**#19 — The Lens of the Player**
In general, what do my players like? What don't they like? What do they expect to see in a game? If I were in their place, what would I want to see? What would they like or dislike about my game in particular?

**#20 — The Lens of Pleasure**
What pleasures does my game give to players? Can these be improved? What pleasures are missing from the experience?

**#21 — The Lens of Flow**
Does my game have clear goals? Are the goals of the player the same goals I intended? Are there parts of the game that distract players to the point they forget their goal? Does my game provide a steady stream of not-too-easy, not-too-hard challenges? Are the player's skills improving at the rate I hoped? Does the player feel a sense of control over the game experience?

**#22 — The Lens of Needs**
On which levels of Maslow's hierarchy is my game operating? Does it fulfill needs of competence, autonomy, and relatedness? How can the game fulfill even more basic needs or fulfill the ones it already targets better?

**#24 — The Lens of Motivation**
What motivations do players have to play my game? Which motivations are most internal? Which are most external? Which are seeking pleasure? Which are avoiding pain? Which motivations support each other? Which motivations are in conflict?

**#25 — The Lens of Novelty**
What is novel about my game? Does my game have novelties throughout or just at the beginning? Do I have the right mix of the novel and the familiar? When the novelty wears off, is my game still fun?

**#26 — The Lens of Judgment**
What does my game judge about the players? How does it communicate this judgment? Do players feel the judgment is fair? Do they care about the judgment? Does the judgment make them want to improve?

**#50 — The Lens of Character**
Is there anything strange in my game that people talk about excitedly? Does my game have funny qualities that make it uniquely interesting? Does my game have flaws that people like?

**#65 — The Lens of Primality**
What parts of my game are so primal that even an animal could play? What parts could be more primal?

**#70 — The Lens of Inherent Interest**
What in my game captures the player's attention immediately? Does my game let the player do something they have never done before? What base instincts does my game appeal to? Higher instincts? Does it have dramatic change or anticipation of dramatic change?

**#71 — The Lens of Beauty**
What elements in my game can be made more beautiful? Some things are more beautiful in combination — how can game elements be combined in beautiful ways? What does beauty mean in the context of my game?

**#72 — The Lens of Projection**
What in my game can players relate to? What else can I add? What in the game captures players' imagination? Are there places players have always wanted to visit? Does the player get to be a character they could imagine themselves to be? Is there an activity in the game that once started is hard to stop?

### MECHANICS (rules, balance, systems)

**#27 — The Lens of Functional Space**
Is the space of this game discrete or continuous? How many dimensions does it have? What are the boundaries of the space? Are there sub-spaces? How are they connected? Is there more than one useful way to abstractly model the game space?

**#28 — The Lens of Time**
What determines the length of my gameplay activities? Are my players frustrated that the game is too short? Bored that it is too long? Would the game be better without time limits? Would a hierarchy of time structures help my game?

**#29 — The Lens of the State Machine**
What are the objects in my game? What are the attributes of each object? What are the possible states for each attribute? What triggers the state changes for each attribute?

**#30 — The Lens of Emergence**
How many verbs do my players have? How many objects can each verb act on? How many ways can players achieve their goals? How many subjects do players control? How do side effects change constraints?

**#31 — The Lens of Action**
What are the basic actions in my game? What are the strategic actions? Am I happy with the ratio of basic to strategic actions? What actions do players wish they could do? Can I somehow enable those?

**#32 — The Lens of Goals**
What is the ultimate goal of my game? Is that goal clear to players? Is there a series of goals the players understand? Are different goals related to each other meaningfully? Are my goals concrete, achievable, and rewarding? Do I have a good balance of short and long-term goals? Can players decide on their own goals?

**#33 — The Lens of Rules**
What are the foundational rules of my game? How do they differ from the operational rules? Are there "laws" or "house rules" that I'm ignoring? Are there different modes in my game? Who has authority to enforce the rules? Are the rules easy to understand?

**#34 — The Lens of Skill**
What skills does my game require of the player? Are there categories of skill the game is missing? Which skills are dominant? Are these skills creating the experience I want? Are some players much better than others? Can players improve their skills with practice? Does the game demand the right level of skill?

**#35 — The Lens of Expected Value**
What is the actual chance of a certain event occurring? What is the perceived chance? What value do the outcomes have? Am I happy with the expected values of each event? Are other factors being overlooked?

**#36 — The Lens of Chance**
What in my game is truly random? What parts just feel random? Does randomness give the player positive or negative feelings? Would changing the probability distribution curves improve the game? Do players have the opportunity to take interesting risks? What is the relationship between chance and skill in my game?

**#37 — The Lens of Fairness**
Should my game be symmetrical? Should it be asymmetrical? Which is more important: that my game is a reliable measure of who has the most skill, or that it provides an interesting challenge to all? If I game involving players of different skill levels, what can I do to make the game feel fair to everyone?

**#38 — The Lens of Challenge**
What are the challenges in my game? Are they too easy, too hard, or just right? Can my challenges accommodate a wide variety of skill levels? How does the level of challenge increase as the player succeeds? Is there enough variety in the challenges? What is the maximum level of challenge in my game?

**#39 — The Lens of Meaningful Choices**
What choices am I asking the player to make? Are they meaningful? How? Am I giving the player the right number of choices? Are there any dominant strategies in my game?

**#40 — The Lens of Triangularity**
Do I have meaningful opposing forces in my game? Does a high-risk choice in my game have a correspondingly higher potential reward?

**#41 — The Lens of Skill vs. Chance**
Are my players here to be judged (skill) or to take risks (chance)? Skill tends to be more serious than chance — is my game serious or casual? Are parts of my game tedious? If so, would adding elements of chance enliven them? Are parts of my game too random? If so, can I replace elements of chance with elements of skill?

**#42 — The Lens of Head and Hands**
Are my players looking for a physical or intellectual challenge? Would adding more puzzle-solving make the action more interesting? Would more action make the puzzle-solving more interesting? Can I give the player a choice — succeed by thinking or by physical dexterity?

**#46 — The Lens of Reward**
What rewards does my game give out? Is there room for more? What are players excited about? What do they find boring? Are the rewards too regular? Too unpredictable? How are my rewards related to one another? How do my rewards build? Too fast, too slow, or just right?

**#47 — The Lens of Punishment**
What are the punishments in my game? Why am I punishing the players? Do the punishments seem fair? Could I turn the punishments into rewards with the same outcome? Are strong punishments balanced by strong rewards?

**#48 — The Lens of Simplicity/Complexity**
What elements of innate complexity exist in my game? Is there a way to turn innate complexity into emergent complexity? Do elements of emergent complexity arise from my game? Are there elements of my game that are too simple?

**#49 — The Lens of Elegance**
What are the elements of my game? What are the purposes of each element? For elements with only one or two purposes, can some be cut? Can some elements take on even more purposes?

**#52 — The Lens of Economy**
How can my players earn money? Should there be more ways? What can my players buy? Is money too easy to get? Too hard? Are choices about earning and spending meaningful? Is a universal currency the right idea for my game?

**#53 — The Lens of Balance**
Does my game feel right? Why or why not?

### CHALLENGE (puzzles, difficulty, progression)

**#54 — The Lens of Accessibility**
How will players know how to begin solving my puzzle or playing my game? Does it act like something they've already seen? Does my puzzle or game draw them in?

**#55 — The Lens of Visible Progress**
What does progress mean in my game? Is there enough of it? Can I add more interim steps? What progress is visible, and what is hidden? Should I reveal what is hidden?

**#56 — The Lens of Parallelism**
Are there bottlenecks preventing the player from progressing? If so, can I add parallel challenges to alleviate this? Are the parallel challenges sufficiently different from each other? Can I connect them in some way?

**#57 — The Lens of the Pyramid**
Is there a way to have the pieces of my puzzle feed into one final, satisfying challenge? Is the challenge at the top of the pyramid interesting, compelling, and clear?

**#58 — The Lens of the Puzzle**
What puzzles are in my game? Should I have more? Fewer? Which of the ten puzzle principles apply to each of my puzzles?

### INTERFACE (controls, UI, feedback)

**#59 — The Lens of Control**
When the player uses the interface, does it do what is expected? Can the interface be made more intuitive? Do the players feel they have a strong influence over the outcome of the game? Do players feel powerful and in control?

**#60 — The Lens of Physical Interface**
What does the player pick up and touch? Can this be more pleasing? How does this map to actions in the game world? What metaphor am I using for the mapping of input to game world? How does this interface look under the Lens of the Toy? How does the player see, hear, and touch the world of the game?

**#61 — The Lens of Virtual Interface**
What information does the player need that isn't found in the game world itself? When does the player need this info? How can it be delivered without disrupting the experience? Are there game elements that are easier to interact with via a virtual interface than by interacting with them directly?

**#62 — The Lens of Transparency**
Does the interface let the player's desires flow right into the game world? Can players use the interface without thinking about it? Do new players find the interface intuitive? Does the interface work well in all situations? Can players still use it well when they're stressed or panicked?

**#63 — The Lens of Feedback**
What do players need to know at this moment? What do players want to know at this moment? What do I want the players to feel at this moment? How can I use feedback to create that feeling? What are the players' goals right now? What feedback will help them toward those goals?

**#64 — The Lens of Juiciness**
Is my interface giving the player continuous feedback for their actions? Is second-order motion created by the player's actions? When I give rewards, how many ways am I simultaneously rewarding the player?

**#66 — The Lens of Channels and Dimensions**
What data needs to travel to and from the player? Which data is most important? What channels do I currently have for transmitting data? What dimensions exist on those channels? How should I use those dimensions?

**#67 — The Lens of Modes**
What modes does my game need? Why? Can any be collapsed or combined? Are any modes overlapping — can I put their inputs on different channels instead? Does the player always know what mode they are in? Can I help make it clearer?

### NARRATIVE (story, characters, world)

**#68 — The Lens of Moments**
What are the key moments in my game? How can I make each moment as powerful as possible?

**#69 — The Lens of the Interest Curve**
What is the shape of my interest curve? Does it have a hook at the beginning? Does it rise gradually, with periods of rest? Is the grand finale the most interesting thing in the game? What changes would give me a better interest curve? Is there a fractal structure — is there an interesting curve at each level?

**#73 — The Lens of the Story Machine**
How can I give players more choices that create story? How can I give players more interesting conflict to interact with? How can I let players personalize their character and world? Do my rules lead to stories with good interest curves? Whom can players tell the stories to that will actually care?

**#74 — The Lens of the Obstacle**
What is the relationship between the main character and the goal? What is between the character and the goal? Is there an antagonist behind the obstacles? Do the obstacles gradually increase? Does the protagonist transform in order to overcome them?

**#75 — The Lens of Simplicity and Transcendence**
How is my world simpler than the real world? What transcendent power does it give the player? Does the combination of simplicity and power make them feel a sense of wish fulfillment?

**#76 — The Lens of the Hero's Journey**
Does my story have elements that make it a heroic story? If so, how does it match the structure of the Hero's Journey? Would my story be improved by including more archetypical elements? Does my story match the form too closely, to the point it feels derivative?

**#77 — The Lens of the Weirdest Thing**
What is the weirdest thing in my game? How can I make sure it doesn't confuse or alienate anyone? If there are multiple weird things, should I unify or cut them? If there is nothing weird, is the game still interesting?

**#78 — The Lens of Story**
Does my game really need a story? Why? Why will players be interested in this story? How does the story support the other parts of the tetrad? How do the other parts of the tetrad support the story? How can I make the story better?

**#79 — The Lens of Freedom**
When do my players have freedom of action? Do they feel free at those times? When are they constrained? Do they feel constrained? Can I let them feel more free at any point? Is there anywhere they feel so free they don't know what to do?

**#80 — The Lens of Status**
What is each character's status in the world? How do they express it? What happens when status changes? Can players gain or lose status? How does that feel?

**#81 — The Lens of Character Transformation**
How do my characters change and grow? How does the character arc support the game's themes?

**#82 — The Lens of Inner Contradiction**
What are the contradictions in my characters? Do they make the characters more interesting and human?

**#83 — The Lens of the Nameless Quality**
Does my game feel alive, or does it feel cool and calculated? What would make it feel more alive?

### SOCIAL (multiplayer, community, cooperation)

**#43 — The Lens of Competition**
Does my game give a fair measurement of player skill? Do people want to win my game? Is winning something people can be proud of? Can novices still enjoy the game? Can experts meaningfully compete? Can experts generally beat novices?

**#44 — The Lens of Cooperation**
Do cooperating players communicate? Are players strangers? Is there ice to break? Do all players have the same role or different roles? Does the game have tasks that require cooperation? Do any tasks force communication?

**#45 — The Lens of Competition vs. Cooperation**
Do my players want competition, cooperation, or a mix? Does team competition make sense for my game?

**#84 — The Lens of Friendship**
What kind of friendships does my game support? How can I deepen player connections?

**#85 — The Lens of Expression**
How can players express themselves in my game? Are there enough ways? What else can be made expressive?

**#86 — The Lens of Community**
What kind of community does my game create? Are there community elements I'm missing? Why would players want to form communities around my game?

**#87 — The Lens of Griefing**
Can one player ruin the experience for others? How? What can I do to prevent this?

### PROCESS (team, playtesting, technology)

**#29 — The Lens of Secrets**
What is known by the game only? What is known by all players? What is known by some or only one player? Would changing who knows what improve the game?

**#51 — The Lens of Imagination**
What does the player need to understand to play? Can imagination help them understand? Which details should be high-quality and realistic? Which can be low-quality, letting the player fill in? Can I give details that let imagination reuse them? What details inspire imagination? What stifles it?

**#88 — The Lens of Love**
Do I love my project? Does my team love it? If not, how can we change that?

**#89 — The Lens of the Team**
Is this the right team for this project? Is the team communicating well? Is the team comfortable making decisions together?

**#90 — The Lens of Documentation**
What do we need to document? Is all essential info captured? Can people find what they need?

**#91 — The Lens of Playtesting**
Why am I playtesting? Who should playtest? What am I looking for? How will I get the info I need?

**#92 — The Lens of Technology**
What technologies will help deliver the experience I want? Am I using technologies that are novel enough? Are there better technologies I should consider?

**#93 — The Lens of the Crystal Ball**
What will happen after the game ships? What could go wrong? What could go right? How can I prepare for both?

### BUSINESS (pitch, profit, ethics, purpose)

**#94 — The Lens of the Client**
What does the client say they want? What do they actually want? What do they really need?

**#95 — The Lens of the Pitch**
Why will someone want to be part of this project? Can I communicate the vision clearly and quickly?

**#96 — The Lens of Profit**
Where does the money come from? How much comes in? How much goes out? What parts of the game drive revenue? Can we improve those without hurting the experience?

**#97 — The Lens of Transformation**
How can my game change players for the better? How can it transform them?

**#98 — The Lens of Responsibility**
Does my game help people? Can it harm them? How can I be sure I'm creating a positive experience?

**#99 — The Lens of the Raven**
Is this game everything I can make it? Am I holding anything back? Am I putting in enough effort?

**#100 — The Lens of Your Secret Purpose**
Why am I really making this game? Will that purpose shine through to the player?

---

## IMPORTANT RULES

- Pick ONLY ONE lens per invocation
- Do NOT answer the questions yourself — present them and wait
- Vary your picks — don't repeat recently used lenses
- If the user passes a category argument (e.g. `/lens mechanics`), only pick from that category
- Keep the presentation clean and focused — this is a thinking prompt, not a lecture
