# Style-guide ideas from Word Play (GMTK, 2025)

> Source study: `dev/games/glyphtender/.planning/research/wordplay.md` (links + frame-by-frame notes). These are general lessons that could feed into the Game UI kit / `game-feel` skill / a BMUZ style guide. They are proposals and haven't been adopted.

## 1. The juice ladder (feedback tiers)
Size the feedback to how much the moment matters. Word Play gets a lot of punch with **no screen shake at all**, just sequence, pop and sound.
| Tier | When | Motion | Sound | Budget |
|---|---|---|---|---|
| 0 Touch | hover, pick up, drag | lift 2–4 px, shadow grows | tiny click | < 100 ms |
| 1 Place | put a piece down | drop + settle tilt, slot lights | physical thunk (3–4 variants) | 150–250 ms |
| 2 Result | a scoring action | things count up in sequence, changed digit pops to about 1.2× | rising ticks, one per item | 0.5–1.5 s |
| 3 Payoff | a round/game milestone | stages merge, colour change, glow ring pulse, banner | chord / sting + short silence first | 2–5 s, rare |
Rules: each tier up must feel different, not just louder. Shake, flash and particles belong to tier 3 only, and only if the game's feel allows them. Every tier has a reduce-motion version.

## 2. Reveal pacing rules
- **Build the number one piece at a time and let the player watch.** Show each part being added, in reading order, and keep each part visible on screen after it lands (Word Play leaves every slot's number behind). The player learns the maths without reading a rule.
- **Add first, multiply last, merge at the end.** Keep separate sums in separate places (two halves of one pill), then merge them into one number and change its colour when it's final.
- **The thing that scores lights up while it scores.** The perk, the piece, the neighbour: it flashes at the moment it contributes.
- **Put a beat before the biggest number.** A short pause (about 200–400 ms) before the final total does more than a bigger explosion.
- **Match the length to how often it happens.** Something that happens every turn stays under 1.5 s (and under 1 s in multiplayer, where others wait). Long staged reveals are for once-per-game moments. Offer a speed-up or skip.

## 3. Colour rules for dark (and bold) themes
- **One hue per context.** The background gradient says *where* you are (mode, phase, screen). The pieces keep the same colour everywhere.
- **Pieces are the brightest thing on screen.** Cream/white faces with dark type sit on the background. State is shown with rings, halos and glow, never by recolouring the text.
- **Background texture stays within ±5% of its own brightness,** so it can never compete with the letters.
- **Colour is never the only signal.** Every colour-coded kind also gets a symbol or shape (Word Play had to patch this in for Emerald vs Golden).
- Ship a high-contrast mode and a dyslexia-friendly font from the start, as kit options.

## 4. Menus & UI layering
- The board stays in the middle and always visible. Status sits in thin bars (top = where/score, bottom = resource/progress).
- **Put the cost inside the button:** "Re-roll | −2 Plays". Players see the trade-off before they tap.
- **Choices are cards:** a coloured header for the kind, an icon, short rules with the key words coloured, a rarity/footnote line, and a slight shine and paper texture so they feel physical.
- Let players peek at the board or bag during any modal choice.
- **Banners are pills** in the context colour, and they ease in, hold, then fade.

## 5. Onboarding
- An easy mode or quick-play mode is the tutorial. Tips show up when the player makes a mistake, one time only.
- Never charge a player for a mistake the game could have stopped (Word Play removed its misspelling penalty after playtests).
