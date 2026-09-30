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

## Path conventions
Always use `~\` for home directory references — never hardcode usernames.
