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

# F180 — Sync knows its own pushes: this machine commits straight in its repo (not through `push`, so the marker
# stays behind) — a skill file it also has live, and a repo-only file (setup.sh). Its own work isn't "incoming".
echo v3-pc > "$T/pc/.claude/skills/a/SKILL.md"; cp "$T/pc/.claude/skills/a/SKILL.md" "$T/pc/.claude-config/skills/a/SKILL.md"
echo "# setup" > "$T/pc/.claude-config/setup.sh"
git -C "$T/pc/.claude-config" add -A; git -C "$T/pc/.claude-config" commit -qm "pc direct"; git -C "$T/pc/.claude-config" push -q 2>/dev/null
HOME="$T/pc" bash "$SYNC" status 2>/dev/null | sed 's/^/STATUS-OWN /'
echo v4-pc > "$T/pc/.claude/skills/a/SKILL.md"
HOME="$T/pc" bash "$SYNC" push "pc after its own direct commit" 2>/dev/null | sed 's/^/PC-PUSH-OWN /'
# …while a real change from the other machine still counts: the laptop changes the skill, the PC's live copy differs
HOME="$T/laptop" bash "$SYNC" status >/dev/null 2>&1; cp "$T/laptop/.claude-config/skills/a/SKILL.md" "$T/laptop/.claude/skills/a/"
git -C "$T/laptop/.claude-config" rev-parse HEAD > "$T/laptop/.claude/.config-applied"
echo v5-laptop > "$T/laptop/.claude/skills/a/SKILL.md"
HOME="$T/laptop" bash "$SYNC" push "laptop again" >/dev/null 2>&1
HOME="$T/pc" bash "$SYNC" status 2>/dev/null | grep '^INCOMING' | sed 's/^/STATUS-OTHER /'

# F176 — Sync keeps unpushed edits: setup.sh (what /sync runs) must not wipe a file edited here since the last sync.
# The real setup.sh, copied into a fake machine's repo; plugins off. (2026-11-03: another session's /sync wiped the
# F172 hook fix at 13:17:59.)
SETUP="$HOME/.claude-config/setup.sh"
if [ -f "$SETUP" ]; then
  git init -q --bare -b main "$T/remote2.git"
  mk2() {
    local h="$T/$1"; mkdir -p "$h/.claude"
    git clone -q "$T/remote2.git" "$h/.claude-config" 2>/dev/null
    git -C "$h/.claude-config" config user.email t@e.st; git -C "$h/.claude-config" config user.name t
    git -C "$h/.claude-config" config core.autocrlf false
  }
  mk2 a; R="$T/a/.claude-config"
  cp "$SETUP" "$R/setup.sh"
  for f in CLAUDE.md QUICKSTART.md settings.json statusline.sh; do echo "$f" > "$R/$f"; done
  for s in a b c synced/x; do mkdir -p "$R/skills/$s"; echo "$s-v1" > "$R/skills/$s/SKILL.md"; done
  mkdir -p "$R/agents" "$R/config" "$R/references"; touch "$R/agents/.keep" "$R/config/.keep" "$R/references/.keep"
  git -C "$R" add -A; git -C "$R" commit -qm seed; git -C "$R" push -q -u origin main 2>/dev/null
  HOME="$T/a" BMUZ_SETUP_NO_PLUGINS=1 bash "$R/setup.sh" >/dev/null 2>&1
  # the other machine changes b and c; this one edits a and c without pushing
  mk2 b2; R2="$T/b2/.claude-config"
  echo "b-v2-other" > "$R2/skills/b/SKILL.md"; echo "c-v2-other" > "$R2/skills/c/SKILL.md"
  echo "synced-other" > "$R2/skills/synced/x/SKILL.md" # claude.ai's own synced skills update on each machine by themselves
  git -C "$R2" commit -qam other; git -C "$R2" push -q 2>/dev/null
  echo "synced-here" > "$T/a/.claude/skills/synced/x/SKILL.md"
  printf 'a-local\r\n' > "$T/a/.claude/skills/a/SKILL.md"   # (a CRLF edit still counts as an edit)
  echo "c-local" > "$T/a/.claude/skills/c/SKILL.md"
  git -C "$R" pull -q --ff-only 2>/dev/null
  HOME="$T/a" BMUZ_SETUP_NO_PLUGINS=1 bash "$R/setup.sh" 2>&1 | grep -iE "kept|both" | sed 's/^/SETUP-OUT /'
  echo "SETUP-A $(tr -d '\r' < "$T/a/.claude/skills/a/SKILL.md")"
  echo "SETUP-B $(cat "$T/a/.claude/skills/b/SKILL.md")"
  echo "SETUP-C $(cat "$T/a/.claude/skills/c/SKILL.md")"
  # a file only line endings apart from the repo is not an edit: it takes the repo's copy quietly
  printf 'b-v2-other\r\n' > "$T/a/.claude/skills/b/SKILL.md"
  HOME="$T/a" BMUZ_SETUP_NO_PLUGINS=1 bash "$R/setup.sh" 2>&1 | grep -iE "kept.*skills/b" | sed 's/^/SETUP-CRLF /'
fi
echo "DONE"
