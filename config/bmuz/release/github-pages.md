# GitHub Pages release recipe (web games, + optional PartyKit server)
Last used: 2026-09-29 (roll-better v0.2.2)

## Prerequisites
- GitHub remote under TheBlueMuzzy; `gh` CLI logged in (`gh auth status`).
- Free Pages needs the repo **public**.
- Online games: PartyKit CLI logged in (`npx partykit whoami` → thebluemuzzy). Never commit `.env`.

## One-time setup per project
1. Vite `base: '/<repo>/'` in `vite.config.ts`.
2. `.github/workflows/deploy.yml` on push to the default branch: `npm ci` → `npm test` → `npm run build` (type check included — never plain `npx vite build`, it hides type errors) → `actions/upload-pages-artifact` (`dist`) → `actions/deploy-pages`. Pass public build env (e.g. `VITE_PARTY_HOST: <name>.thebluemuzzy.partykit.dev`) in the Build step.
3. Repo Settings → Pages → Source: **GitHub Actions**.
4. Write the Live URL + "deploys on push to <branch>" in the project's STATE Key facts.

## Every release
1. On master after the merge + release commit + tag (see /deliver §4–5).
2. **Server first, if `party/` changed in the merge** (`git diff <last-tag>..HEAD --stat -- party/`): `npx partykit deploy` → "Deployed ./party/server.ts to https://<name>.thebluemuzzy.partykit.dev". Server first so a new front end never talks to an old server. Check the new server still accepts the OLD client's messages (players with the old page cached).
3. `git push origin master --tags` → starts the Pages workflow.
4. `gh run list --limit 1` → `gh run watch <id>` → then confirm with `gh run view <id> --json conclusion,jobs` (don't trust `$?` after a pipe).
5. Delete the merged work branch locally + on the remote.

## Check it's live
- `https://thebluemuzzy.github.io/<repo>/` in Playwright: version overlay shows the new `vX.Y.Z.0`, console has 0 errors (one `apple-mobile-web-app-capable` deprecation warning is harmless). Usually live within ~1 min of the workflow finishing; hard-refresh if the old version shows (service worker cache).
- Online games: press CREATE → a room code appears = front end reaches the new server.

## Gotchas hit
- Node 20 deprecation + ubuntu-latest migration notices in the Actions annotations (2026-09) — warnings only; bump `actions/*@v4` / `node-version` when convenient.

## Release-stage extras
- alpha: the Pages link is fine to share with friends.
- beta: add a feedback link in the menu.
- 1.0: privacy policy page linked in Settings (roll-better has one: `privacy.html`), credits screen from `content/credits.json`.
