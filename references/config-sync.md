# Multi-Machine Config Sync

Config is synced across machines via GitHub repo: https://github.com/TheBlueMuzzy/claude-config

**Source of truth:** Main PC (`~\` on Muzzy's desktop)
**Laptop:** `~\` on the laptop

## Synced files
HUB.md (→ `~/Documents/dev/HUB.md`, the project index), CLAUDE.md, QUICKSTART.md, settings.json, statusline.sh, statusline.ps1
agents/, config/, references/, skills/, RETIRED.txt

## Never sync
.credentials.json, settings.local.json, projects/, cache/, debug/, history/, telemetry/

## Workflow when config changes
1. Copy changed file(s) to `~\.claude-config\`
2. `git add . && git commit -m "description" && git push`
3. On other machine: `cd ~/.claude-config && git pull && bash setup.sh` (copies everything and archives anything listed in RETIRED.txt)
   - setup.sh never wipes a file changed on THIS machine since the last sync (F176, 2026-11-03): it keeps it and prints "Kept N file(s)…" — push those with /save; one "changed on both machines" → compare with `git -C ~/.claude-config show HEAD:<path>` before pushing. Line endings alone don't count. A brand-new machine (no `~/.claude/.config-applied`) gets everything, as before.

## Path conventions
Always use `~\` for home directory references — never hardcode usernames.
