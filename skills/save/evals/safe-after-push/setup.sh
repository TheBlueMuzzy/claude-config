#!/usr/bin/env bash
# The practice game, pushed — then a change that isn't saved yet.
set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../../../config/bmuz/evals/fixture-game.sh"
printf '{ "spread": 34, "lift": 12 }\n' > content/tuning/hand.json
