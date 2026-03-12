# Multi-Machine Config Sync

Config is synced across machines via GitHub repo: https://github.com/TheBlueMuzzy/claude-config

**Source of truth:** Main PC (`~\` on Muzzy's desktop)
**Laptop:** `~\` on the laptop

## Synced files
CLAUDE.md, PIPELINE.md, QUICKSTART.md, settings.json, statusline.sh
agents/, commands/, config/, skills/, get-shit-done/

## Never sync
.credentials.json, settings.local.json, projects/, cache/, debug/, history/, telemetry/

## Workflow when config changes
1. Copy changed file(s) to `~\.claude-config\`
2. `git add . && git commit -m "description" && git push`
3. On other machine: `git pull` then copy file(s) to `~\.claude\`

## Path conventions
Always use `~\` for home directory references — never hardcode usernames.
