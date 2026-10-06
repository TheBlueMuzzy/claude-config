# GitHub Pages release recipe (web games, + optional PartyKit server)
Last used: 2026-10-05 (glyphtender v0.4.1 — server first (wrangler), Pages; CI test timeout hit once, see Gotchas)

## Prerequisites
- GitHub remote under TheBlueMuzzy; `gh` CLI logged in (`gh auth status`).
- Free Pages needs the repo **public**.
- Online games: PartyKit CLI logged in (`npx partykit whoami` → thebluemuzzy). Never commit `.env`.
- ⚠ **NEW online games can't use PartyKit's shared `*.partykit.dev` any more** (2026-09-30: "exceeded the limit of 10000 Workers custom domains on zone 'partykit.dev'" — the shared zone stopped minting hostnames after the Cloudflare acquisition). Existing projects (roll-better) keep working. New ones: deploy to Muzzy's own free Cloudflare account — PartyKit cloud-prem (`CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… npx partykit deploy --domain …`) or partyserver + wrangler (→ `<name>.<account>.workers.dev`). Needs Muzzy's one-time `npx wrangler login`. Until then: ship web-only with "Play online" hidden (unset VITE_PARTY_HOST).

## One-time setup per project
1. Vite `base: '/<repo>/'` in `vite.config.ts`.
2. `.github/workflows/deploy.yml` on push to the default branch: `npm ci` → `npm test` → `npm run build` (type check included — never plain `npx vite build`, it hides type errors) → `actions/upload-pages-artifact` (`dist`) → `actions/deploy-pages`. Pass public build env (e.g. `VITE_PARTY_HOST: <name>.joebrogno.workers.dev`) in the Build step.
3. Repo Settings → Pages → Source: **GitHub Actions**.
4. Write the Live URL + "deploys on push to <branch>" in the project's STATE Key facts.
5. Offline cache (vite-plugin-pwa)? Add `import { registerSW } from 'virtual:pwa-register'; registerSW({ immediate: true })` to `src/main.tsx` + `"vite-plugin-pwa/client"` in tsconfig.app.json `types`. Without it, returning players see the OLD version until their next visit (Roll Better B020). Copy roll-better's `e2e/sw-update.mjs` as `npm run e2e:update` to guard it.

## Every release
1. On master after the merge + release commit + tag (see /deliver §4–5).
2. **Server first, if `party/` changed in the merge** (`git diff <last-tag>..HEAD --stat -- party/ src/engine src/rooms`): `npm run party:deploy` (wrangler → `https://<name>.joebrogno.workers.dev`; legacy Roll Better: `npx partykit deploy`). Server first so a new front end never talks to an old server. Check the new server still accepts the OLD client's messages (players with the old page cached).
3. `git push origin master --tags` → starts the Pages workflow.
4. `gh run list --limit 1` → `gh run watch <id>` → then confirm with `gh run view <id> --json conclusion,jobs` (don't trust `$?` after a pipe).
5. Delete the merged work branch locally + on the remote.

## Check it's live
- A fresh load (`?v=<timestamp>`) only proves the server — it can't see what a RETURNING player gets. PWA games: `npm run e2e:update` must pass before release.
- `https://thebluemuzzy.github.io/<repo>/` in Playwright: version overlay shows the new `vX.Y.Z.0`, console has 0 errors (one `apple-mobile-web-app-capable` deprecation warning is harmless). Usually live within ~1 min of the workflow finishing; hard-refresh if the old version shows (service worker cache).
- Online games: press CREATE → a room code appears = front end reaches the new server.

## Gotchas hit
- 2026-09-30 glyphtender: `npx partykit deploy` → 10,000-custom-domain limit on partykit.dev (see Prerequisites). Shipped web-only; online waits for Muzzy's Cloudflare account.
- 2026-09-29 roll-better: v0.4.0 live, but a returning browser showed v0.2.1 — PWA `autoUpdate` without `registerSW({ immediate: true })` only swaps on the next visit. Fixed in v0.4.1 (setup step 5).
- Node 20 deprecation + ubuntu-latest migration notices in the Actions annotations (2026-09) — warnings only; bump `actions/*@v4` / `node-version` when convenient.

## Release-stage extras
- alpha: the Pages link is fine to share with friends.
- beta: add a feedback link in the menu.
- 1.0: privacy policy page linked in Settings (roll-better has one: `privacy.html`), credits screen from `content/credits.json`.
- 1.0: Dev Kit out of the live game — set `content/devkit.json` `"inReleaseBuilds": false`, then run `npm run check:devkit` (must PASS) before releasing.
- 2026-10-01 glyphtender v0.2.0: moved to PartyServer + wrangler on Muzzy's account (`wrangler login` done on the PC) — see multiplayer-setup. A pre-release review caught a reconnect seat bug.
- 2026-10-04 glyphtender v0.4.0: ⚠ `VITE_PARTY_HOST=<host> npm run e2e:online` does NOT test the live server — the script always starts its own local wrangler. The live server test is the "Check it's live" step: on the live site, Play online → type a name → Create a room → a 4-letter code appears (Playwright, fresh `?v=` load). The version shows in Settings (not on the menu); to check it from outside: the live JS bundle contains `"X.Y.Z"`. Server + site must go out together when the action shape changes (old phones' moves are refused) — rooms live in memory, so a deploy simply closes rooms in progress.
- 2026-10-05 glyphtender v0.4.1: the Pages build failed once on a unit test that timed out (5 s default) on GitHub's slower runner — a whole AI-played game took 5.4 s there vs ~2 s on the PC. Heavy whole-game tests need their own timeout (`it(..., fn, 30_000)`). The server was already deployed by then — fine, since the new server accepts the old site's messages.
