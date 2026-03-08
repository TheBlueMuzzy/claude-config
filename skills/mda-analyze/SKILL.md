---
name: mda-analyze
description: Analyze or design a game using the MDA framework (Mechanics, Dynamics, Aesthetics). Use when evaluating game feel, balancing systems, or designing new features.
---

# MDA Framework Analysis

Analyze using the MDA Framework for: $ARGUMENTS

## The 8 Aesthetics
1. Sensation (sensory pleasure) - Flower, Tetris Effect
2. Fantasy (make-believe) - Skyrim, Animal Crossing
3. Narrative (drama) - The Last of Us, Disco Elysium
4. Challenge (obstacle course) - Dark Souls, Celeste
5. Fellowship (social framework) - Among Us, It Takes Two
6. Discovery (uncharted territory) - Outer Wilds, Subnautica
7. Expression (self-discovery) - Minecraft, The Sims
8. Submission (pastime) - Cookie Clicker, Stardew Valley

## Process

1. **Identify Target Aesthetics**: Which 1-3 are primary goals?
2. **Inventory Mechanics**: List every player-facing mechanic
3. **Map Mechanics -> Dynamics**: What emergent behavior does each create?
4. **Map Dynamics -> Aesthetics**: Which aesthetic does each serve?
5. **Gap Analysis**: Mechanics without aesthetic purpose = cut candidates
6. **Conflict Analysis**: Mechanics undermining target aesthetics = redesign candidates

## Output

### Target Aesthetics (ranked)
1. Primary: [aesthetic] - the dominant emotional experience
2. Secondary: [aesthetic] - supporting experience
3. Tertiary: [aesthetic] - background texture

### Mechanics Inventory
| Mechanic | Description | Target Dynamic | Target Aesthetic |

### Dynamics Emergence Map
| Dynamic | Emergent From | Player Behavior | Supports Aesthetic |

### Alignment Check
For each mechanic, trace: Mechanic -> Dynamic -> Aesthetic
- Flag mechanics with no aesthetic trace (cut candidates)
- Flag target aesthetics with no supporting mechanics (design gaps)

### Validation Questions
1. "If a player described your game in one word, what would it be?"
2. "What mechanic are you most proud of?" (should serve primary aesthetic)
3. "What mechanic feels 'off'?" (likely misaligned)
