#!/usr/bin/env bash
# A tiny game with a roadmap and some code, no sprint yet.
set -e
mkdir -p .planning src/hand
cat > .planning/ROADMAP.md <<'EOF'
# Card Test — Roadmap
Release target: alpha
## v0.1 — Cards in your hand ← current
Goal: draw five cards and play one
- ✅ F01 🧱 Project skeleton — must:alpha
- 🟢 F02 🎮 Fanned hand: cards fan out in an arc, hover lifts a card — must:alpha · needs: F01
- ⏳ F03 ✨ Card wiggle on hover — could · needs: F02
EOF
cat > .planning/STATE.md <<'EOF'
# Card Test — State
## ▶ RESUME HERE
2026-10-19 — F01 done. Next: /sprint.
## Where we are
Stage: develop   Milestone: v0.1   Sprint: —
EOF
cat > src/hand/Hand.tsx <<'EOF'
export function Hand({ cards }: { cards: string[] }) {
  return <div className="hand">{cards.map((c) => <div key={c} className="card">{c}</div>)}</div>
}
EOF
cat > src/main.tsx <<'EOF'
import { Hand } from './hand/Hand'
export const app = <Hand cards={['A', 'B', 'C', 'D', 'E']} />
EOF
