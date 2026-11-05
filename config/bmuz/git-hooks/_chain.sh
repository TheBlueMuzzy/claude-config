#!/bin/sh
# Runs the repo's own .git/hooks/<this hook's name> when it has one (F184). Pointing core.hooksPath at the BMUZ folder
# would otherwise switch those off without a word (found by test-scripts: a repo's pre-commit stopped running).
# Each git-hooks/<name> sources this. (`git rev-parse --git-path hooks` would answer this folder — so the common dir.)
own="$(git rev-parse --git-common-dir)/hooks/$(basename "$0")"
if [ -x "$own" ]; then "$own" "$@" || exit $?; fi
