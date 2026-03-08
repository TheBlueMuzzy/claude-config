---
name: style-guide
description: Generate an art style guide for a game project. Covers visual identity, color palette, character design rules, animation standards, and UI style. Use when establishing art direction for a new game.
disable-model-invocation: true
---

# Art Style Guide Generator

## Gather Info
Ask the designer:
1. Art style? (pixel art, low-poly, hand-drawn, realistic, etc.)
2. Perspective? (top-down, isometric, side-scroll, 3rd person)
3. Target resolution?
4. Reference games/art?
5. Mood/tone? (whimsical, dark, minimalist, vibrant)

## Output: docs/style-guide.md

### Visual Identity
- Art style: [description]
- Perspective: [type]
- Resolution: [target]

### Color Palette
| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | | #XXXXXX | Player, UI highlights |
| Secondary | | #XXXXXX | Environment |
| Accent | | #XXXXXX | Collectibles, interactive |
| Danger | | #XXXXXX | Enemies, hazards |
| Neutral | | #XXXXXX | Non-interactive |

### Character Design Rules
- Head-to-body ratio
- Line weight
- Silhouette test requirement
- Max colors per sprite

### Animation Standards
- Frame rate (e.g., 12fps for pixel art)
- Idle: [min frames]
- Walk cycle: [frame count]
- Attack: [anticipation, action, recovery]

### UI Style
- Font family
- Button style
- Menu transitions
- HUD elements

### Asset Naming Convention
- `entity_state_type_dimensions.png` (e.g., player_idle_spritesheet_64x64.png)
- `entity_variant_action_framecount.png` (e.g., enemy_slime_walk_4frames.png)
- `type_variant_subtype_dimensions.png` (e.g., tile_grass_base_32x32.png)

### DO and DON'T
| DO | DON'T |
|----|-------|
| Use defined palette | Introduce new colors without approval |
| Maintain consistent line weight | Mix weights in single asset |
| Test at 1x and 2x scale | Create for one scale only |
