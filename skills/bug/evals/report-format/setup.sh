#!/usr/bin/env bash
# The practice game, no BUGS.md yet.
set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../../../config/bmuz/evals/fixture-game.sh"
git checkout -q -b dev/v0-1
