## Google Workspace CLI (`gws`)

Access to Drive, Docs, Sheets, Slides, and Tasks via `gws` CLI.

**Two accounts — pick the right one without asking:**
- `joebrogno@gmail.com` (personal, default) → plain `gws ...` (config `~/.config/gws`)
- `muzzymade@gmail.com` (work/freelance) → `GOOGLE_WORKSPACE_CLI_CONFIG_DIR=~/.config/gws-muzzy gws ...`
- Work/freelance projects (e.g. folders ending `_work`, client board games) → muzzymade. A project's CLAUDE.md may name its account. Unsure, or a file 404s/is read-only → check owner with `gws drive files get --params '{"fileId":"ID","fields":"owners(emailAddress),capabilities(canEdit)"}'` on both and use the one that can edit.
- The claude.ai Google Drive MCP is one account only — prefer `gws` when the file may be on the other account.
Calendar has a dedicated MCP tool — prefer that for calendar tasks.
**Do NOT use Gmail MCP tools** — Muzzy has intentionally denied email access.

```bash
# Drive
gws drive files list --params '{"pageSize": 10}'
gws drive files list --params '{"q": "name contains '\''keyword'\''"}'
gws drive files get --params '{"fileId": "ID"}'
# Sheets
gws sheets spreadsheets.values get --params '{"spreadsheetId": "ID", "range": "Sheet1!A1:D10"}'
# Docs
gws docs documents get --params '{"documentId": "ID"}'
# Discover any API shape
gws schema drive.files.list
```

**New machine setup:** `npm install -g @googleworkspace/cli` → copy `client_secret.json` to `~/.config/gws/` → `gws auth login --no-browser`
Never sync `~/.config/gws/` — credentials are machine-specific. ① (config-sync only copies ~/.claude)

