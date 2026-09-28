# itch.io release recipe (HTML5 web build)
Last used: never. Written ahead from the 2026-09-28 research, so steps marked ⚠ are untested. Fix this recipe the first time it's used.

## Prerequisites
- An itch.io account (Muzzy's). A project page made once by hand: itch.io → Dashboard → **Create new project**, Kind of project = **HTML**.
- **butler** (itch's free upload tool). ⚠ Windows install: download it from https://itchio.itch.io/butler, unzip it to `C:/Users/Muzzy/bin/butler/`, and add that folder to PATH. Check it with `butler -V`.
- `butler login` once per machine. It opens the browser and saves the key in the user folder. Never paste the key into a repo or this file.
- For CI: a `BUTLER_API_KEY` from itch.io → Settings → API keys, stored as a GitHub secret (never in the repo).

## One-time setup per project
1. **Vite `base: './'`** (relative paths). itch serves the game from a random sub-folder inside an iframe, so the default `/` or GitHub Pages' `/<repo>/` makes every file 404 and you get a blank screen. If the game also goes to GitHub Pages, keep its base in the config and build for itch with `npx vite build --base=./`.
2. Check the build: `dist/index.html` sits at the top of the zip (not inside a folder), there are **≤1,000 files**, **≤500 MB** unzipped, **≤200 MB per file**, and the file names' upper/lower case matches the code exactly (itch is case-sensitive; Windows isn't).
3. Multiplayer games: set the server address in the itch build too (e.g. `VITE_PARTY_HOST=... npx vite build --base=./`).
4. Page → **Embed options**:
   - **Viewport size**: the game's design size, e.g. 960×600. Phones ignore it.
   - Tick **Fullscreen button**.
   - Tick **Mobile friendly** plus the orientation. It forces fullscreen on phones.
   - "Click to launch in fullscreen" instead of embedding, if the game needs the whole screen.
5. Record `Release: itch — https://<user>.itch.io/<game> (butler channel html5)` in STATE Key facts.

## Every release
1. Build: `npm run build` (or `npx vite build --base=./`, see setup 1).
2. Push: `butler push dist <user>/<game>:html5 --userversion X.Y.Z`
   - The channel name tags the platform: `html5` for web, `windows`, `osx`, `linux`, `android` for downloads. Keep the same channel every time; butler only uploads what changed.
   - `butler status <user>/<game>` shows when itch has finished processing.
3. First upload only: in Edit game → Uploads, tick **"This file will be played in the browser"** on the html5 upload. ⚠
4. Optional: post the patch notes from /deliver as a devlog.

## Check it's live
- Open `https://<user>.itch.io/<game>` in Playwright (use the password while the page is Restricted). The game loads in the frame, the fullscreen button works, and the console is clean.
- Processing takes about a minute after `butler status` says it's done.

## Optional: auto-publish from GitHub (on a version tag)
Uses `manleydev/butler-publish-itchio-action` (GPL-3.0, but it's only a CI tool and doesn't ship with the game). ⚠
```yaml
# .github/workflows/itch.yml
on: { push: { tags: ['v*'] } }
jobs:
  itch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci && npx vite build --base=./
      - uses: manleydev/butler-publish-itchio-action@master
        env:
          BUTLER_CREDENTIALS: ${{ secrets.BUTLER_API_KEY }}
          CHANNEL: html5
          ITCH_GAME: <game>
          ITCH_USER: <user>
          PACKAGE: dist
          VERSION: ${{ github.ref_name }}
```

## Store-page checklist
- [ ] **Cover image 630×500** (minimum 315×250, same shape). Readable at small size.
- [ ] 3–5 screenshots (any size); an animated GIF of the core moment helps a lot.
- [ ] Short description / tagline, the full description, and **credits** (every 🟡 line from `content/credits.json`).
- [ ] Genre, up to 10 tags, Kind = HTML, pricing (free / pay-what-you-want / paid).
- [ ] Embed options set (viewport, fullscreen button, mobile friendly).
- [ ] Visibility: **Draft** → **Restricted** (password, for friends) → **Public**.

## Release-stage extras
- alpha: Restricted page with a password; send the link + password to friends.
- beta: Public but low-key; a feedback link in the game's menu; add a devlog per release.
- 1.0: Full page art (cover, screenshots, GIF, background), pricing decided, privacy note if analytics collect device data.

## Gotchas
- Blank screen on itch but fine locally → almost always the Vite `base` (setup 1) or upper/lower-case file names (setup 2).
- Too many files (big icon sets, unbundled audio) → itch refuses the zip. Pack sprites into atlases (organize-assets) or bundle the audio.
