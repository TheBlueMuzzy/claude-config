---
name: game-feel
description: Add "juice" so actions feel good — trauma-based screen shake, hit-stop / freeze frames, squash & stretch, eased tweens, particle bursts and paired sounds, sized by small / medium / big tiers in content/feel.json, with a "reduce motion / reduce shake" setting. Also tunes physics feel (dice damping, bounce, settle detection). Web/R3F first, Unity too. Use when something works but "feels flat", "feels weak", "has no impact", "no punch", "floaty", "lifeless", "needs juice/polish", or when Muzzy mentions game feel, screen shake, hit stop, tweening, easing, squash and stretch, particles, or dice that feel wrong.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Game Feel (juice)

Add feel to: $ARGUMENTS

## What This Does

A mechanic that *works* and one that feels *good* differ in feedback: the short, slightly
exaggerated response to each action. This skill layers that feedback on top of a working
mechanic. It doesn't build the mechanic, and it never changes the rules or the simulation.

## Where it fits (MDA)
- Feel is cause **(a)** in **mda-analyze** diagnose: "floaty, laggy, weak hits". Use it after the
  mechanic works, usually in a `(tuning)` task in /develop.
- Every feel change serves an **experience target** in the GDD. Big celebratory juice on a win
  supports Competition. Gentle juice fits a calm Submission game, where heavy shake would be wrong.
  Ask "which target does this moment serve?" before choosing a tier.
- **One knob at a time.** Change one value in `content/feel.json`, let Muzzy try it, and log
  `Tuning: knob old→new — why — result` in SPRINT Notes. Muzzy judges feel, preferably on his phone.

## The rules
1. **Layer small responses.** A satisfying hit is usually 5–8 tiny responses within ~100 ms:
   sound, particles, small shake, brief freeze, squash, flash, number pop. Start with 2–3 and add
   until it reads, then stop.
2. **Return to rest.** Juice is brief. Scale goes back to 1 and the camera goes back to its spot.
   If an exaggeration stays on screen, players stop reading it as feedback.
3. **Scale to importance.** A footstep isn't a boss death. Every event gets a tier (small / medium / big).
4. **Keep it off the simulation.** Shake moves the camera or a visual wrapper, never the physics
   body. Hit-stop pauses visuals and time, never game logic halfway through a step.
5. **Never block input.** Keep freezes short and let taps queue up during them.

## Process

### Step 1: Find the event hooks
Juice attaches to moments such as `onLand`, `onScore`, `onPickup`, `onWin` and `onButtonPress`.
If the code doesn't expose the moment yet, add a hook first. List each event with its tier.

### Step 2: Put the tiers in `content/feel.json`
```json
{
  "tiers": {
    "small":  { "trauma": 0.15, "hitStopMs": 0,   "squash": 0.08, "particles": 4,  "sfx": "tick",  "flashMs": 0 },
    "medium": { "trauma": 0.4,  "hitStopMs": 50,  "squash": 0.18, "particles": 12, "sfx": "hit",   "flashMs": 0 },
    "big":    { "trauma": 0.8,  "hitStopMs": 120, "squash": 0.3,  "particles": 40, "sfx": "boom",  "flashMs": 60 }
  },
  "events": { "diceLand": "small", "scoreCombo": "medium", "roundWin": "big" },
  "shake":  { "decayPerSec": 1.5, "maxOffset": 0.25, "maxRollDeg": 2, "speed": 25 },
  "ease":   { "popMs": 180, "settleMs": 250, "overshoot": 2.5 },
  "reduceMotion": { "shake": 0, "hitStop": 0.5, "squash": 0.5, "particles": 0.5, "flash": 0 }
}
```
Code reads only from this file (see tuning-setup). Moving an event to another tier is a
one-word edit Muzzy can make in the Dev Kit or Obsidian.

### Step 3: Build one `feedback(event)` call
`src/feel/feel.ts` is a plain module and does **not** use React state. `feedback('diceLand')`
looks up the tier and applies the reduce-motion multipliers. It then fires each channel: adds
trauma, starts a hit-stop, triggers squash on the target, bursts particles and plays the sound.
Game code only ever calls `feedback(...)`.

**Screen shake (trauma).** Trauma is a number from 0 to 1. Hits *add* to it, and it decays every
frame. The amount of shake is trauma², so small bumps barely move the camera and big ones punch.
Use smooth noise or sine waves instead of a new random number each frame, which buzzes like static.
```ts
// R3F: mutate refs in useFrame, never React state. Shake a wrapper group around the camera or scene
useFrame((_, delta) => {
  feel.trauma = Math.max(0, feel.trauma - cfg.shake.decayPerSec * delta)
  const s = feel.trauma ** 2 * feel.shakeScale           // shakeScale = player setting (0..1)
  t += delta * cfg.shake.speed
  rig.current.position.set(Math.sin(t * 1.7) * s * cfg.shake.maxOffset, Math.sin(t * 2.3) * s * cfg.shake.maxOffset, 0)
  rig.current.rotation.z = Math.sin(t * 1.1) * s * THREE.MathUtils.degToRad(cfg.shake.maxRollDeg)
})
```
drei's `<CameraShake>` is a ready-made alternative. It works alongside OrbitControls when the
controls use `makeDefault`.

**Hit-stop (freeze frame).** For 50–120 ms, set `feel.timeScale = 0` (or 0.05) and restore it
with a **real-time** timer (`setTimeout` or `performance.now()`), because a timer that runs on
game time never fires while time is frozen. Animation code uses `delta * feel.timeScale`.
Freeze once per impact, never every frame of a held action. For Rapier, flip `<Physics paused>` during the freeze.

**Squash & stretch.** Snap to squashed on the event, e.g. scale `(1+s, 1−s, 1+s)` to keep the
volume the same, then ease back to 1. `maath` easing gives a smooth settle:
`easing.damp3(mesh.current.scale, 1, cfg.ease.settleMs / 1000, delta)`. This eases out with no
overshoot. For a bouncy "pop" that overshoots and settles, use a back-out tween such as GSAP `back.out(2.5)`.

**Easing: which curve for what.** Pop or appear → back-out (overshoot). Settle or arrive →
ease-out. Leave or fall away → ease-in. Linear only for constant motion like conveyor belts.
Linear everywhere else looks robotic.

**DOM / UI juice.** **Motion** (`npm i motion`, `import { motion } from "motion/react"`): a
spring transition on buttons, score pops and card flips. **GSAP** (`npm i gsap @gsap/react`, now
free, `useGSAP` cleans up after itself) suits sequenced effects:
`gsap.fromTo(el, { scale: 1.3 }, { scale: 1, duration: 0.18, ease: "back.out(2.5)" })`.
Pick one per project and note the choice in the TDD.

**Particles.** In R3F use **three.quarks** (`npm i three.quarks`). Create one `BatchedRenderer`
per scene and call `batchRenderer.update(delta)` in useFrame. Design bursts in the quarks editor
and load them with `QuarksLoader` (`quarks.r3f` has a hook). Reuse emitters rather than creating
new ones per hit. Particle counts come from the tier. For a quick prototype, a small pool of
instanced quads is enough.

**Sound pairing.** Every tier has a sound, played through audio-setup's SoundManager **in the same
frame** as the visual. A sound that arrives late feels like lag. Play it when a hit-stop starts,
not when it ends, and add a little pitch variation (audio-setup covers this). ZzFX presets from
`content/sfx.json` make fine placeholders.

### Step 4: Reduce motion / reduce shake (accessibility)
- Add to Settings: a **Reduce motion** toggle and a **Screen shake** slider from 0 to 100%. Both
  are saved with the player's settings through save-system.
- The toggle starts from the device setting: `matchMedia('(prefers-reduced-motion: reduce)')`,
  Motion's `useReducedMotion()`, or `gsap.matchMedia()`.
- When it's on, apply the `reduceMotion` multipliers: shake off, no flashes, shorter freezes,
  less squash and fewer particles. Keep the sound and a gentle ease so the moment still reads.
- Motion must never be the *only* sign that something happened. Keep flashes under 3 per second.
  accessibility-check audits this.

### Step 5: Prove it (Muzzy judges the feel)
- Trigger each event 10× quickly. Check that the shake decays to exactly zero, the scale returns
  to 1, input still registers during a freeze, nothing piles up in memory, and the console is clean.
- Check that there are no React state updates per frame; the React DevTools highlight should stay quiet.
- Take Playwright screenshots mid-effect and at rest, and describe them to Muzzy. Then hand over
  with the feel question: "Did the dice landing feel <target in players' words>?"

### Step 6: Report to User
```
GAME FEEL ADDED

Events → tiers (edit in content/feel.json):
  diceLand → small · scoreCombo → medium · roundWin → big
Each tier: shake · freeze · squash · particles · sound
Settings: Reduce motion toggle + Screen shake slider (follows the phone's setting)

TRY IT: /play → roll 5 times, score a combo, win a round.
TO TUNE: change ONE number in content/feel.json, e.g. tiers.big.trauma 0.8 → 0.6
```

## Physics feel (dice, throws, bouncing things)
Aim for dice that *feel* right, not a perfect simulation. These values live in
`content/tuning/physics.json`.
- **Damping** (`linearDamping`, `angularDamping` around 0.1–0.5): higher values stop the dice sooner.
  This is the main knob for "rolls forever" versus "dead thud".
- **Restitution** (bounciness, about 0.2–0.4) and **friction** (about 0.5–0.8) are set on the
  colliders. Mass doesn't change how fast things fall. For a snappier drop, use stronger gravity
  (-20 to -30) or `gravityScale`.
- **Stability:** use the fixed timestep with `interpolate` (both are Rapier defaults). Turn on
  `ccd` for small, fast dice so they don't pass through a thin table, and cap the throw speed.
- **Settle detection:** a die counts as settled when its speed and spin stay under a threshold
  (e.g. 0.05 / 0.1) for about 300 ms, or when Rapier's `onSleep` fires. Then read the face that
  points most upward. If no face is clearly on top (a tilted die), nudge it. After ~4 s, force a
  nudge so a roll can never hang.
- **Juice hook:** `onContactForce` gives the impact strength. Play a "clack" whose volume follows
  the force, and at most one clack per die every 80 ms.

## Unity
- **PrimeTween** (free, allocation-free; install from the Asset Store or UPM
  `com.kyrylokuzyk.primetween`): `Tween.ShakeCamera(cam, strengthFactor, duration)`,
  `Tween.PunchScale(transform, strength, duration)`,
  `Tween.Scale(t, 1f, 0.18f, Ease.OutBack)` for the pop.
- **Hit-stop:** set `Time.timeScale = 0.05f`, `yield return new WaitForSecondsRealtime(d)`, then
  restore it. A plain `WaitForSeconds` never resumes because it waits on scaled time.
- For trauma shake, `CinemachineBasicMultiChannelPerlin` amplitude = trauma². Use Particle System
  bursts for particles. For settling, use `Rigidbody` Interpolate + Continuous collision,
  PhysicMaterial bounciness and `rb.IsSleeping()`.
- Read the same tiers from `content/feel.json` as a TextAsset, so web and Unity games share one feel vocabulary.

## Tips
- Juice the **player's** actions first. A juicy button press is worth more than a juicy background.
- If it feels noisy, remove a channel rather than shrinking every value.
- Inspiration: "Juice it or lose it" (Jonasson & Purho) and "The Art of Screenshake" (Jan Willem Nijman).

Adapted from gamedev-skills `game-feel` and `physics-tuning` (github.com/gamedev-skills/awesome-gamedev-agent-skills, Apache-2.0).
