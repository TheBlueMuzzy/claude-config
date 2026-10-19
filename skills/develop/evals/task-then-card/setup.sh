#!/usr/bin/env bash
# The practice game, on its work branch, with the next task a small one: hover lifts the card by `lift`.
set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../../../config/bmuz/evals/fixture-game.sh"
git checkout -q -b dev/v0-1
