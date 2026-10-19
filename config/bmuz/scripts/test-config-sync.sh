#!/bin/bash
# Two fake machines sharing one fake claude-config remote (never the real one) — run by test-scripts.mjs, suite
# config-sync. F80 review #1: after an INCOMING, the next status must still say INCOMING and a push must refuse, so a
# /save on one machine can't copy its older files over the other machine's newer ones.
set -e
SYNC="$(cd "$(dirname "$0")/.." && pwd)/config-sync.sh"
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
git init -q --bare -b main "$T/remote.git"
mk() {
  local h="$T/$1"; mkdir -p "$h/.claude/skills/a"
  git clone -q "$T/remote.git" "$h/.claude-config" 2>/dev/null
  git -C "$h/.claude-config" config user.email t@e.st; git -C "$h/.claude-config" config user.name t
  git -C "$h/.claude-config" config core.autocrlf false
}
mk pc
echo seed > "$T/pc/.claude-config/README.md"; git -C "$T/pc/.claude-config" add -A; git -C "$T/pc/.claude-config" commit -qm seed; git -C "$T/pc/.claude-config" push -q -u origin main 2>/dev/null
echo v1 > "$T/pc/.claude/skills/a/SKILL.md"
HOME="$T/pc" bash "$SYNC" status >/dev/null 2>&1
HOME="$T/pc" bash "$SYNC" push "first" 2>/dev/null | sed 's/^/PC-PUSH-1 /'
mk laptop; cp "$T/laptop/.claude-config/skills/a/SKILL.md" "$T/laptop/.claude/skills/a/"
HOME="$T/laptop" bash "$SYNC" status >/dev/null 2>&1
echo v2-laptop > "$T/laptop/.claude/skills/a/SKILL.md"
HOME="$T/laptop" bash "$SYNC" push "laptop change" 2>/dev/null | sed 's/^/LAPTOP-PUSH /'
HOME="$T/pc" bash "$SYNC" status 2>/dev/null | sed 's/^/STATUS-1 /'
HOME="$T/pc" bash "$SYNC" status 2>/dev/null | sed 's/^/STATUS-2 /'
HOME="$T/pc" bash "$SYNC" push "pc would overwrite" 2>/dev/null | sed 's/^/PC-PUSH-2 /'
echo "REMOTE $(git -C "$T/pc/.claude-config" show origin/main:skills/a/SKILL.md)"
# applying the laptop's change (what setup.sh does, marker included) → in sync, a push works again
cp "$T/pc/.claude-config/skills/a/SKILL.md" "$T/pc/.claude/skills/a/SKILL.md"
git -C "$T/pc/.claude-config" rev-parse HEAD > "$T/pc/.claude/.config-applied"
HOME="$T/pc" bash "$SYNC" status 2>/dev/null | sed 's/^/STATUS-3 /'
echo "DONE"
