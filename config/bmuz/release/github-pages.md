# GitHub Pages release recipe (web games, + optional PartyKit server)
Last used: 2026-09-29 (roll-better v0.4.0)

## Prerequisites
- GitHub remote under TheBlueMuzzy; `gh` CLI logged in (`gh auth status`).
- Free Pages needs the repo **public**.
- Online games: PartyKit CLI logged in (`npx partykit whoami` → thebluemuzzy). Never commit `.env`.

## One-time setup per project
1. Vite `base: '/<repo>/'` in `vite.config.ts`.
2. `.github/workflows/deploy.yml` on push to the default branch: `npm ci` → `npm test` → `npm run build` (type check included — never plain `npx vite build`, it hides type errors) → `actions/upload-pages-artifact` (`dist`) → `actions/deploy-pages`. Pass public build env (e.g. `VITE_PARTY_HOST: <name>.thebluemuzzy.partykit.dev`) in the Build step.
3. Repo Settings → Pages → Source: **GitHub Actions**.
4. Write the Live URL + "deploys on push to <branch>" in the project's STATE Key facts.
5. Offline cache (vite-plugin-pwa)? Add `import { registerSW } from 'virtual:pwa-register'; registerSW({ immediate: true })` to `src/main.tsx` + `"vite-plugin-pwa/client"` in tsconfig.app.json `types`. Without it, returning players see the OLD version until their next visit (Roll Better B020). Copy roll-better's `e2e/sw-update.mjs` as `npm run e2e:update` to guard it.

## Every release
1. On master after the merge + release commit + tag (see /deliver §4–5).
2. **Server first, if `party/` changed in the merge** (`git diff <last-tag>..HEAD --stat -- party/`): `npx partykit deploy` → "Deployed ./party/server.ts to https://<name>.thebluemuzzy.partykit.dev". Server first so a new front end never talks to an old server. Check the new server still accepts the OLD client's messages (players with the old page cached).
3. `git push origin master --tags` → starts the Pages workflow.
4. `gh run list --limit 1` → `gh run watch <id>` → then confirm with `gh run view <id> --json conclusion,jobs` (don't trust `$?` after a pipe).
5. Delete the merged work branch locally + on the remote.

## Check it's live
- A fresh load (`?v=<timestamp>`) only proves the server — it can't see what a RETURNING player gets. PWA games: `npm run e2e:update` must pass before release.
- `https://thebluemuzzy.github.io/<repo>/` in Playwright: version overlay shows the new `vX.Y.Z.0`, console has 0 errors (one `apple-mobile-web-app-capable` deprecation warning is harmless). Usually live within ~1 min of the workflow finishing; hard-refresh if the old version shows (service worker cache).
- Online games: press CREATE → a room code appears = front end reaches the new server.

## Gotchas hit
- 2026-09-29 roll-better: v0.4.0 live, but a returning browser showed v0.2.1 — PWA `autoUpdate` without `registerSW({ immediate: true })` only swaps on the next visit. Fixed in v0.4.1 (setup step 5).
- Node 20 deprecation + ubuntu-latest migration notices in the Actions annotations (2026-09) — warnings only; bump `actions/*@v4` / `node-version` when convenient.

## Release-stage extras
- alpha: the Pages link is fine to share with friends.
- beta: add a feedback link in the menu.
- 1.0: privacy policy page linked in Settings (roll-better has one: `privacy.html`), credits screen from `content/credits.json`.
- 1.0: Dev Kit out of the live game — set `content/devkit.json` `"inReleaseBuilds": false`, then run `npm run check:devkit` (must PASS) before releasing.
