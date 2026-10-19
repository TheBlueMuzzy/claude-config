#!/usr/bin/env bash
# The practice game: an alpha release is asked for while the must F02 is still building.
set -e
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../../../../config/bmuz/evals/fixture-game.sh"
git checkout -q -b dev/v0-1
