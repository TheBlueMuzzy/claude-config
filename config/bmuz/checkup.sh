#!/usr/bin/env bash
# BMUZ checkup — gathers the facts; the `checkup` skill reads them and reports to Muzzy.
# Read-only, except `--done` (below), which closes a checkup.

C="$HOME/.claude"
cd "$C" || exit 1

# `checkup.sh --done` closes a checkup (F80 — the close steps were remembered, so a forgotten date nagged daily):
# refuses until today's report is saved, then writes today's date to last-checkup and syncs the setup to the laptop.
if [ "$1" = "--done" ]; then
  TODAY=$(date +%F)
  REPORT="config/bmuz/reviews/checkups/$TODAY.md"
  if [ ! -s "$REPORT" ]; then
    echo "REFUSED: save today's report first → ~/.claude/$REPORT (the one-screen report you showed Muzzy), then run --done again."
    exit 1
  fi
  echo "$TODAY" > config/bmuz/last-checkup
  echo "✓ last-checkup = $TODAY (the session start stops saying 'checkup due' for 30 days)"
  if [ -f config/bmuz/config-sync.sh ]; then
    bash config/bmuz/config-sync.sh push "BMUZ checkup $TODAY" || { echo "SYNC FAILED — explain it to Muzzy in plain English (the laptop won't get today's changes yet)"; exit 1; }
  else
    echo "config-sync.sh not found — sync by hand (references/config-sync.md)"
  fi
  exit 0
fi

echo "== 1. Upstream changes since we last matched (sources.json)"
node -e '
const s = require("./config/bmuz/sources.json").skills;
for (const x of s) console.log([x.skill, x.repo, x.path, x.how, x.checked].join("|"));
' | while IFS='|' read -r skill repo path how checked; do
  if [ -z "$repo" ]; then echo "  ? $skill — no known upstream"; continue; fi
  last=$(gh api "repos/$repo/commits?path=$path&per_page=1" --jq '.[0].commit.committer.date' 2>/dev/null | cut -c1-10)
  if [ -z "$last" ]; then echo "  ! $skill — couldn't reach $repo/$path"
  elif [ "$checked" = "unknown" ] || [[ "$last" > "$checked" ]]; then echo "  ↑ $skill ($how) — upstream changed $last, we matched $checked  [$repo/$path]"
  else echo "  ✓ $skill — up to date ($checked)"; fi
done

echo; echo "== 2. Reference cards due for a re-check"
node -e '
const c = require("./config/bmuz/sources.json").cards, now = new Date();
for (const x of c) {
  const months = (now - new Date(x.checked)) / (1000*60*60*24*30.4);
  console.log((months >= x.recheck_months ? "  ↻ DUE " : "  ✓ ") + x.file + " (checked " + x.checked + ": " + x.what + ")");
}'

echo; echo "== 3. Skill use on THIS machine (transcripts only keep ~30 days)"
for d in skills/*/; do
  n=$(basename "$d"); [ "$n" = synced ] && continue
  calls=$(grep -h -o "\"skill\":\"$n\"" projects/*/*.jsonl 2>/dev/null | wc -l)
  slash=$(grep -h -o "<command-name>/$n</command-name>" projects/*/*.jsonl 2>/dev/null | wc -l)
  reads=$(grep -h -o "skills/$n/SKILL.md" projects/*/*.jsonl 2>/dev/null | wc -l)
  echo "  $n: $((calls + slash)) used, $reads file reads"
done

echo; echo "== 4. Wiring — which BMUZ files name each specialist skill"
BMUZ="bmuz discover define develop deliver roadmap sprint gdd tdd play save bug checkup ppp sketch sync"
for d in skills/*/; do
  n=$(basename "$d"); [ "$n" = synced ] && continue
  echo " $BMUZ " | grep -q " $n " && continue
  refs=$(grep -l -w "$n" skills/*/SKILL.md config/bmuz/*.md 2>/dev/null | grep -v "skills/$n/" | sed 's|skills/||; s|/SKILL.md||; s|config/bmuz/||' | tr '\n' ' ')
  [ -z "$refs" ] && echo "  ✗ $n — nothing calls it" || echo "  ✓ $n ← $refs"
done

echo; echo "== 5. Plugins and MCP servers (this machine)"
grep -A10 '"enabledPlugins"' settings.json | sed -n '2,/}/p' | sed 's/^/  /'
timeout 60 claude mcp list 2>/dev/null | grep -v "^Checking" | sed 's/^/  /'

echo; echo "== 6. Sync — ~/.claude vs ~/.claude-config"
if [ -d "$HOME/.claude-config/.git" ]; then
  for p in skills config references; do
    diff -rq "$C/$p" "$HOME/.claude-config/$p" 2>/dev/null | grep -v "synced\|active-project.json\|last-checkup" | sed 's/^/  /'
  done
  (cd "$HOME/.claude-config" && git fetch -q 2>/dev/null; git status -sb | head -1 | sed 's/^/  repo: /')
else
  echo "  ~/.claude-config not found on this machine"
fi

echo; echo "== 7. Every game gets the same safety kit (F79 — a ✗ names the fix)"
for g in "$HOME"/Documents/dev/games/*/; do
  [ -f "$g/package.json" ] || continue
  name=$(basename "$g"); miss=""
  # framework copies sit at src/<piece>/VERSION or one deeper (src/ui/kit/VERSION, src/ai/kit/VERSION) — review fix
  pieces=""; ls "$g"/src/*/VERSION "$g"/src/*/kit/VERSION >/dev/null 2>&1 && pieces=1
  if [ -f "$g/scripts/check-all.mjs" ] && ! grep -q "check-lock" "$g/scripts/check-all.mjs"; then
    miss="$miss · check-all.mjs has no one-run-at-a-time lock (copy it from config/bmuz/templates/check-all.mjs)"; fi
  if [ -f "$g/scripts/check-all.mjs" ] && ! grep -q "heldPorts" "$g/scripts/check-all.mjs"; then
    miss="$miss · check-all.mjs has no port pre-flight (F118: copy its 'Port pre-flight' block + the import from config/bmuz/templates/check-all.mjs, and templates/ports.mjs to scripts/ports.mjs)"; fi
  if grep -q '"check:fast"' "$g/package.json" && [ -d "$g/.git" ] && git -C "$g" remote get-url origin >/dev/null 2>&1 && [ ! -f "$g/.github/workflows/checks.yml" ]; then
    miss="$miss · no GitHub checks (copy config/bmuz/templates/checks.yml to .github/workflows/)"; fi
  if [ -n "$pieces" ] && ! grep -q '"check:framework"' "$g/package.json"; then
    miss="$miss · framework pieces but no check:framework (reinstall the Dev Kit with install-module.mjs)"; fi
  if [ -n "$pieces" ] && grep -q '"check:framework"' "$g/package.json" && ! grep -qs "check-framework.mjs --static\|check:framework -- --static" "$g/scripts/check-all.mjs" "$g/package.json"; then
    miss="$miss · check:fast doesn't run the framework's code checks (add the 'framework (code)' line from config/bmuz/templates/check-all.mjs)"; fi
  [ -z "$miss" ] && echo "  ✓ $name" || echo "  ✗ $name$miss"
done

echo; echo "== 8. Dependencies + licences — the packages players get, per project (F85; needs the network)"
# per game + the framework (root and each module): licences + npm's security list (deps-check.mjs, production only),
# how many shipped packages have a newer version, and whether .npmrc waits 7 days before taking a brand-new version
DEPS="$C/config/bmuz/scripts/deps-check.mjs"
for g in "$HOME"/Documents/dev/games/*/ "$HOME"/Documents/dev/framework/ "$HOME"/Documents/dev/framework/*/; do
  [ -f "$g/package.json" ] || continue
  case "$g" in */framework/) name="framework" ;; */framework/*/) name="framework/$(basename "$g")" ;; *) name=$(basename "$g") ;; esac
  outdated=$(cd "$g" && npm outdated --omit=dev --json 2>/dev/null | node -e 'let s = ""; process.stdin.on("data", d => s += d).on("end", () => { try { console.log(Object.values(JSON.parse(s || "{}")).filter(p => p.current && p.current !== p.latest).length) } catch { console.log("?") } })')
  npmrc=no; grep -qs '^[[:space:]]*min-release-age' "$g/.npmrc" && npmrc=yes
  node "$DEPS" "$g" --json 2>/dev/null | node -e '
    let s = ""; process.stdin.on("data", d => s += d).on("end", () => {
      const [name, outdated, npmrc] = process.argv.slice(1)
      let r = null; try { r = JSON.parse(s) } catch {}
      const bits = []
      let bad = false
      if (!r) { bits.push("deps-check gave no answer"); bad = true }
      else if (r.skipped) bits.push("no packages players get")
      else if (r.refusals.some(([t]) => /aren.t installed|couldn.t list/.test(t))) { bits.push("packages not installed on this machine — npm ci there to check them"); bad = true }
      else {
        const lic = r.refusals.filter(([t]) => !/security problem/.test(t))
        const sec = r.refusals.filter(([t]) => /security problem/.test(t))
        bits.push(`${r.packages.length} packages players get`)
        bits.push(lic.length ? `licence problems: ${lic.map(([t]) => t.split(" ")[0]).join(", ")}` : "licences fine")
        bits.push(!r.audit.checked ? "security not checked (offline?)" : sec.length ? `security: ${sec.map(([t]) => t.split(" ")[0]).join(", ")} (high)` : "no high security problems")
        if (lic.length || sec.length) bad = true
        const warn = r.warnings.filter(w => !/^security:/.test(w)).length
        if (warn) bits.push(`${warn} licence${warn > 1 ? "s" : ""} to read`)
      }
      bits.push(outdated === "?" ? "outdated: no answer from npm" : `${outdated} with a newer version`)
      if (npmrc !== "yes") { bits.push(".npmrc has no min-release-age=7 (install-module.mjs adds it, or add the line)"); bad = true }
      console.log(`  ${bad ? "✗" : "✓"} ${name} — ${bits.join(" · ")}`)
    })' "$name" "$outdated" "$npmrc"
done

echo; echo "== Last checkup: $(cat config/bmuz/last-checkup 2>/dev/null || echo never)"
