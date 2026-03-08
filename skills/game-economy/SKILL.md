---
name: game-economy
description: Design and analyze game economy systems using Machinations-style resource flow modeling. Use when designing progression, currency, crafting, or any resource-based game system.
---

# Game Economy Design

Analyze/design economy for: $ARGUMENTS

## Concepts (Machinations Framework)
- **Pools**: Where resources gather (player inventory, bank, etc.)
- **Sources**: Generate resources (enemy drops, daily rewards, etc.)
- **Drains**: Consume resources (purchases, upgrades, decay, etc.)
- **Gates**: Conditional routing (if level >= 5, unlock shop)
- **Connections**: Flow paths between nodes

## Process

1. **Identify Resources**: What does the player collect/spend?
2. **Map Sources**: Where does each resource come from? At what rate?
3. **Map Drains**: Where does each resource go? At what cost?
4. **Balance Check**: Are sources > drains (inflation) or drains > sources (scarcity)?
5. **Progression Curve**: How does resource flow change over time?
6. **Edge Cases**: What happens if player hoards? Spends everything? Exploits?

## Output

### Resource Inventory
| Resource | Source(s) | Drain(s) | Equilibrium Target |

### Flow Diagram (ASCII)
```
[Source: Enemy Drops] ---> [Pool: Gold] ---> [Drain: Shop]
                                    |
                                    +---> [Drain: Upgrades]
```

### Balance Analysis
- Early game: [resource abundance/scarcity]
- Mid game: [inflection points]
- Late game: [endgame economy]

### Recommendations
- Sinks needed to prevent inflation
- Faucets needed to prevent frustration
- Gates for pacing
