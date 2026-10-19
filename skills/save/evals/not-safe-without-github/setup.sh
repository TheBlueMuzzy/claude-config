#!/usr/bin/env bash
# The practice game with NO GitHub copy (the remote is removed) and unsaved work.
set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../../../config/bmuz/evals/fixture-game.sh"
git remote remove origin
printf '{ "spread": 34, "lift": 12 }\n' > content/tuning/hand.json
