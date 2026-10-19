#!/usr/bin/env bash
# The practice game every BMUZ skill test starts from (F71). A case's setup.sh runs:
#   source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../../../config/bmuz/evals/fixture-game.sh"
# then adds whatever its own test needs. It runs in the test's empty workspace, with an empty home folder.
# Gives: the BMUZ config in ~/.claude/config/bmuz (the scripts the skills call), a git repo on main with a
# GitHub stand-in (a bare repo in ~/remote.git), version.json, ROADMAP / SPRINT / STATE, and a little code.
set -e
fixture_bmuz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
mkdir -p "$HOME/.claude/config"
cp -r "$fixture_bmuz" "$HOME/.claude/config/bmuz"

git init -q --bare "$HOME/remote.git"
git init -q -b main .
git config user.email test@example.com
git config user.name test
git remote add origin "$HOME/remote.git"

mkdir -p .planning/archive src/hand content/tuning
printf '{\n  "name": "Card Test",\n  "version": "0.1.0",\n  "build": 3,\n  "history": []\n}\n' > version.json
printf '{\n  "name": "card-test",\n  "version": "0.1.0",\n  "scripts": { "test": "node -e \\"process.exit(0)\\"" }\n}\n' > package.json
printf '{ "spread": 30, "lift": 12 }\n' > content/tuning/hand.json
cat > .planning/ROADMAP.md <<'EOF'
# Card Test — Roadmap
Release target: alpha
## v0.1 — Cards in your hand ← current
Goal: draw five cards and play one
- ✅ F01 🧱 Project skeleton — must:alpha
- 🔨 F02 🎮 Fanned hand: cards fan out in an arc, hover lifts a card — must:alpha · needs: F01
- ⏳ F03 ✨ Card wiggle on hover — could · needs: F02
EOF
cat > .planning/SPRINT.md <<'EOF'
# Sprint 01 — a fanned hand you can play from
Started 2026-10-18 · Milestone v0.1 · Features: F02
## F02 🎮 Fanned hand
Done when: five cards fan out in an arc; hovering one lifts it
- [x] 🤖 1. Arc layout — src/hand/layout.ts
- [ ] 🤖 2. Hover lifts the card — src/hand/layout.ts
- [ ] 🙋 3. Look at it on a phone
Check: unit test for the arc; Muzzy fans 5 cards on a phone
Ask Muzzy: —
Notes:
EOF
cat > .planning/STATE.md <<'EOF'
# Card Test — State
## ▶ RESUME HERE
2026-10-19 — F02 building: the arc layout works, hover lift next.
## Where we are
Stage: develop   Milestone: v0.1   Sprint: 01   Doing: F02 — building   Branch: main
## Key facts
- Dev: npm run dev · tuning in content/tuning/hand.json
## Log
- 2026-10-18 — Project created.
EOF
cat > src/hand/layout.ts <<'EOF'
import tuning from '../../content/tuning/hand.json'
// Where each card sits in the fan: angle and drop, by its place in the hand.
export function cardPlace(index: number, count: number) {
  const middle = (count - 1) / 2
  const angle = (index - middle) * (tuning.spread / count)
  return { angle, drop: Math.abs(index - middle) * 4, lift: 0 }
}
EOF
git add -A && git commit -qm "start" && git push -q -u origin main
