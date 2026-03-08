---
name: accessibility-check
description: Audit your game for accessibility issues — color blindness, motor impairments, screen readers, motion sensitivity, and configurable controls. Reports findings with easy fixes.
allowed-tools: Read, Grep, Glob, Bash
---

# Accessibility Audit

Check accessibility for: $ARGUMENTS

## What This Does

Reviews your game for accessibility issues that would prevent some players
from enjoying it. Reports everything in plain English with specific fixes.
Good accessibility = more players = more reach.

## Checks to Run

### 1. Color Blindness (affects ~8% of men, ~0.5% of women)
Scan for gameplay elements that rely ONLY on color to convey meaning:
- Red vs green indicators (most common issue)
- Color-coded teams/factions
- Color-matching puzzles
- Status effects shown only by color
- UI indicators (health = red, mana = blue)

**Fix suggestions:**
- Add shapes/icons alongside colors (red circle + X, green circle + checkmark)
- Use patterns in addition to colors
- Offer a color blind mode with alternative palette
- Ensure sufficient contrast between game-critical colors

### 2. Motor Accessibility
Check for:
- Inputs that require very precise timing
- Inputs that require holding multiple buttons simultaneously
- Small touch targets on mobile (minimum 44x44px recommended)
- No pause ability during action sequences
- No control remapping options
- Rapid repeated inputs (button mashing)

**Fix suggestions:**
- Add configurable timing windows
- Allow one-button alternatives for multi-button combos
- Increase touch target sizes
- Always allow pause
- Add control remapping in settings
- Offer "assist mode" with reduced difficulty

### 3. Visual Accessibility
Check for:
- Text too small to read (minimum 16px body, 12px UI elements)
- Low contrast text (minimum 4.5:1 ratio for normal text)
- Flashing/strobing effects (can trigger seizures at 3+ Hz)
- Important UI outside safe zones on mobile
- No support for system font size preferences
- Animations that can't be reduced

**Fix suggestions:**
- Scalable text option in settings
- High contrast mode
- Remove or gate flashing effects behind a setting
- Respect `prefers-reduced-motion` CSS media query
- Keep UI within safe margins (10% from edges)

### 4. Audio Accessibility (affects ~15% of population)
Check for:
- Game-critical information conveyed only through sound
- No subtitles for dialogue/narration
- No visual indicators for sound cues (enemy approaching, timer, etc.)
- No volume controls per category

**Fix suggestions:**
- Add visual indicators for all sound-based cues
- Add subtitles/captions
- Provide visual rhythm indicators for music-based gameplay
- Per-category volume controls (SFX, Music, Voice)

### 5. Cognitive Accessibility
Check for:
- Tutorial that can't be replayed
- No way to review objectives/goals
- Complex UI with no explanation
- Time pressure without option to extend
- Too many simultaneous things to track

**Fix suggestions:**
- Replayable tutorials
- In-game help/hints available anytime
- Progressive complexity (don't overwhelm early)
- Optional extended timers
- Difficulty settings that affect cognitive load

### 6. Screen Reader Support (if applicable)
Check for:
- Interactive elements without aria-labels
- Images without alt text
- Focus order that doesn't make sense
- Custom UI components not using proper ARIA roles
- Canvas/WebGL content with no text alternative

## Report Format
```
ACCESSIBILITY REPORT
====================

CRITICAL (excludes some players entirely):
  1. [Issue] — [who it affects] — [how many people]
     Fix: [specific fix]

IMPORTANT (makes game harder for some players):
  2. [Issue] — [who it affects]
     Fix: [specific fix]

NICE TO HAVE (improves experience for everyone):
  3. [Issue]
     Fix: [specific fix]

SCORE: X/10

QUICK WINS (fix in under 5 minutes each):
  - [Quick fix 1]
  - [Quick fix 2]
  - [Quick fix 3]

RESOURCES:
  - Game Accessibility Guidelines: https://gameaccessibilityguidelines.com/
  - Xbox Accessibility Guidelines: https://learn.microsoft.com/gaming/accessibility
  - AbleGamers: https://ablegamers.org/
```
