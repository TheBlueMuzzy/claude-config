---
name: icon-text
description: Set up inline icon replacement in game text using ligatures, icon fonts, or component-based substitution. Use when you want text like "Press [attack] to fight" to render with actual icons inline.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Inline Icon Text System

Set up icon replacement for: $ARGUMENTS

## What This Does

Lets you write game text with placeholder tokens like `[attack]`, `[heart]`,
`[coin]` and have them automatically render as actual icons inline with the
text. No code changes needed — just edit your content files.

## Approaches (pick based on project)

### Approach A: Component Substitution (React — Recommended)
Best for React projects. Create a `<GameText>` component that parses tokens
and replaces them with icon components.

```tsx
// Usage:
<GameText>Press [attack] to fight the [enemy_slime]!</GameText>

// Renders as:
// Press ⚔️ to fight the 🟢!
// (where ⚔️ and 🟢 are actual image/SVG components)
```

**Implementation:**
1. Create icon registry: `src/content/icons.ts`
   ```typescript
   export const icons = {
     attack: { src: '/assets/icons/attack.svg', alt: 'attack' },
     heart: { src: '/assets/icons/heart.svg', alt: 'health' },
     coin: { src: '/assets/icons/coin.svg', alt: 'coin' },
     // controller buttons
     button_a: { src: '/assets/icons/btn-a.svg', alt: 'A button' },
     button_b: { src: '/assets/icons/btn-b.svg', alt: 'B button' },
   };
   ```

2. Create `<GameText>` component that:
   - Splits text on `[token]` pattern
   - Looks up each token in the icon registry
   - Renders inline `<img>` or `<svg>` sized to match text line-height
   - Falls back to the `[token]` text if icon not found
   - Supports accessibility (alt text, aria-labels)

3. Create CSS for inline icon sizing:
   ```css
   .inline-icon {
     height: 1em;
     width: auto;
     vertical-align: middle;
     display: inline;
   }
   ```

### Approach B: CSS Ligature Font (Advanced)
Best for non-React or when you need icons in Canvas/WebGL text.

1. Create a custom font where specific character sequences map to glyphs
2. Use a tool like Fontello or IcoMoon to generate
3. Apply via CSS `font-feature-settings: "liga"`

### Approach C: Emoji Mapping (Quick & Simple)
For prototyping — map tokens to Unicode emoji:
```json
{
  "attack": "⚔️",
  "heart": "❤️",
  "coin": "🪙",
  "star": "⭐"
}
```
Simple find-and-replace before rendering. No build step.

## Process

### Step 1: Ask the User
1. What icons do you need? (attack, health, coin, controller buttons, etc.)
2. Do you have SVG/PNG icons already, or should I use emoji as placeholders?
3. React project or vanilla?

### Step 2: Implement Chosen Approach
Follow the approach above. For React, create:
- `src/content/icons.ts` — icon registry
- `src/components/GameText.tsx` — parsing component
- `src/components/GameText.css` — inline sizing
- `assets/icons/` — icon assets directory

### Step 3: Integrate with Text System
If `/externalize-text` was run, update the `t()` function to support icons:
```typescript
// In strings.json:
"tutorial_step_1": {
  "text": "Press [attack] to clear the [goop]!",
  "context": "Tutorial step with inline icons"
}

// In JSX:
<GameText>{t('tutorial_step_1')}</GameText>
```

### Step 4: Report to User
```
ICON TEXT SYSTEM READY

Registered X icons: attack, heart, coin, ...
Component: <GameText> (wraps any text that needs icons)

HOW TO ADD A NEW ICON:
  1. Add your icon image to assets/icons/
  2. Register it in src/content/icons.ts:
     myicon: { src: '/assets/icons/myicon.svg', alt: 'description' }
  3. Use [myicon] anywhere in your game text

HOW TO USE IN TEXT:
  <GameText>Collect [coin] to buy [heart] at the shop!</GameText>
```
