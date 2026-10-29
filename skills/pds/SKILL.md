---
name: pds
description: Muzzy's work PDS (Product Design Spec) Google Slides decks — make a new PDS deck from the template, install or update the PDS menu (Set up deck, Add pages, Mark revised, Archive pages) in one deck or every deck in a folder, and change the shared "PDS Tools" library code. Use when Muzzy says /pds, "new PDS", "make a PDS for <item>", "update the PDS script/menu", "push the PDS changes to all decks", or asks to change what the PDS menu does.
---

# PDS decks

A PDS is the factory-facing spec deck for one product (Google Slides, 11×17 in, exported to PDF). Muzzy's **work** Google account owns them. Project notes (decisions, page specs, history): the Google Doc **"PDS Template Redesign — Project Notes"** in the work Drive folder **"PDS Template Redesign"** — read it before changing the design.

## How the pieces fit (why updates are automatic)

- **Template deck** — **"TEMPLATE Games - PDS"** in the top of the shared Product Specs folder (moved there 28 Oct 2026; Muzzy: "that's the MAIN file"). The old "XXX#### - GAME - PDS" next to it is the pre-redesign template — leave it; Muzzy removes things in the shared folder himself. Has the 9 named layouts ("PDS - Overview" … "PDS - Archive"; "PDS - Component Overview" added 29 Oct 2026 — frame only, soft green #A8E6A1, badge COMPONENTS, title = game name, all component renders laid out in the middle) with locked frames and a type-in box per field. Drive tag `pdsRole=template`.
- **"PDS Tools" library** — one Apps Script project holding ALL the menu code (`library/Code.js` here is its source of truth). Drive tag `pdsRole=library`.
- **Stub** — small script in each deck (`stub/`), loads the library as `PDS` in **development mode**, so a library update reaches every deck the next time it opens. Menu items are slots (`pdsMenu1…25`) the library assigns, so new menu items need no stub change (11 used).
- **The template carries the stub** (since 28 Oct 2026), so every copy — `new-deck`, `fresh-test`, the menu's **New PDS…**, or File → Make a copy — has a working menu at once. Copied stubs can't be traced; they keep working through the library and only miss a *stub* change. Tracked stubs: tag `pdsStubScriptId` + `pdsStubFor=<deck id>`.
- Copies carry their source's tags, so a tag only counts on the file it names: template = `pdsRole=template` + `pdsSelf=<its id>`. ① pds.mjs `template()` / `installStub` check this
- Files are always found by those Drive tags — never store IDs in this skill (the repo is public). The library's template id is injected by `deploy-library` (placeholder `TEMPLATE_ID_SET_AT_DEPLOY`). ① pds.mjs

## Commands (run from this folder)

```bash
node pds.mjs status                              # what library/template are tagged
node pds.mjs new-deck <folderId> <item#> "<Game Name>"
node pds.mjs deploy-library [folderId]           # push library/ code (creates it the first time)
node pds.mjs install-stub <presentationId>       # add/refresh the menu in one deck
node pds.mjs update-folder <folderId>            # add/refresh the menu in every PDS deck under a folder
node pds.mjs mark-template <presentationId>      # tag THE template (only one may be tagged)
```

## Procedures

**Template backup** — one always-current copy, "TEMPLATE Games - PDS (backup)", in Muzzy's personal _Templates folder (tag `pdsBackupFolder` on the template). `backup-template` copies only if the template changed and bins the older backup. ① runs automatically after `deploy-library` and `fresh-test`; ③ after Muzzy edits the template by hand in Slides, run `backup-template` (nothing can detect a manual edit until the next command runs). Muzzy declined a nightly auto-backup (29 Oct 2026): he'll say when he's edited the template — then run `backup-template`

**Shared folder etiquette** — if anything Claude's tools made lands in the shared Product Specs tree (e.g. a test New PDS), tell Muzzy the file + link and let him delete it; never delete or move things there yourself. ③ judgement

**Testing** — Muzzy always tests from scratch (28 Oct 2026): after any change, run `fresh-test <folderId of "PDS Template Redesign">` — it bins the previous test deck (tag `pdsTest=1`) and makes a clean "TEST <date time> - Example Game - PDS" from the template, menu installed. Give him that link; never reuse an old test deck. ① pds.mjs fresh-test

**New deck** — ask for item #, game name and destination folder (default: the folder of the team's PDS decks). Run `new-deck`, give Muzzy the link, then tell him: open it → **PDS → Set up deck…** → fill the four boxes → Save. First use asks him to allow the script (one time per deck).

**Change what the menu does** — edit `library/Code.js` (bump `VERSION`), `node --check` it, run `deploy-library`, then verify in a test deck (open it, use the changed item, screenshot via Slides thumbnails). Done: every deck has it. Commit the skill change through the claude-config sync (`/sync` or copy to `~/.claude-config` and push).

**Stub change (rare)** — edit `stub/`, then `update-folder` on each PDS folder. Decks copied by hand (not via `new-deck`) have no stub; `update-folder` installs one.

**Layout/design change** — layouts can only be CREATED in Slides (Slide → Edit theme → right-click a layout → Duplicate → Rename); Muzzy does that step, Claude fills them via the Slides API. Duplicate the layout closest in shape (frame-only → Packaging). The editor gives the copy's header boxes new ids, so re-make them as `…_ph0/_ph1/_ph2` (duplicateObject with chosen ids, delete the old) or the menu can't find the dates/status. ③ manual check — add a page of the new type in a fresh test deck and confirm its dates and status fill. Add the page type to GAME_PAGES / ADDABLE / CHIPS / SECTION in the library and a placement test. Existing decks keep their old layouts; change the template for new decks.

## What the menu does (library)

- **Set up deck…** — Game Name (also Item Name), Item #, Project Owner, Date Created → writes the Item line on every layout, the game name into Overview / How to Play / Component Overview titles, and Date Created onto every page still on the old/blank date (pages added later keep theirs).
- **Add page(s)…** — page types + name (required for component pages); Date Created and Revised = today, status DRAFT; a new Color & Deco page gets one callout (card + real line, dot end, attached to the card). ① library code
- **Page-order SOP** (Muzzy, 28 Oct 2026) — deck order: 1 Overview · 2 How to Play · 3 Component Overview · 4 Components (one group per component name: Control → Color & Deco → Texture) · 5 Printed Sheets · 6 Packaging · Archive. New page: same-type section → after its last page; component already has pages → inside its group by type order; new component → after the last component group; nothing of that kind yet → after the nearest earlier section (start if none); never in the Archive. ① library `placeIndex` + `test/placement.test.mjs` (25 cases), which `deploy-library` runs and refuses to deploy on failure; `test/defined.test.mjs` refuses a deploy that calls a missing helper.
- **Set status of selected pages ▸ Draft / Revisions Needed / Complete / Superseded / Dropped** — sets the pill's wording and colour (Draft = layout's own pill; Revisions Needed = soft red; Complete = soft green; Superseded = navy; Dropped = dark grey). Archiving sets Superseded/Dropped on the archived page automatically. Slides can't hold a real drop-down, so this menu is the "drop-down". ① library code
- **Unarchive selected pages** — for pages after the divider: band removed, unskipped, moved back by the page-order rule, Date Revised today, status Complete. Works on a fresh copy (editor-redraw rule). ① library code
- **New PDS…** — Season drop-down (every "SPRING ####"/"FALL ####" folder in the shared Product Specs folder, read live, newest first; opens on "Choose a season…" or the person's last-used season — never "newest" or "today", because future seasons' folders exist early, Muzzy 28 Oct 2026) → copies the template as "XXX#### - GAME - PDS" into that season's **Games** folder; optional pasted folder link overrides. Shows an Open link. Needs Drive permission (asked once per deck). ① library code (seasons_, newPds)
- **The shared Product Specs folder is never changed** (Muzzy, 28 Oct 2026: many people rely on it): no tags, renames or moves there; only reads, plus the new PDS file a user asks for. Its id is recorded as tag `pdsSpecsRoot` on OUR template (`set-specs-root`) and injected at deploy. ③ judgement — before any write into that folder tree, confirm it's a file Muzzy asked to create
- Folder layout there (rescanned 28 Oct 2026): `<Product Specs>/<SPRING|FALL YYYY>/Games/` holds the PDS decks; other top-level folders (D40, Evergreen Items, NFL…) aren't seasons and are ignored.
- **Testing New PDS:** paste the "PDS Template Redesign" folder link in the override box, so tests never land in a real season folder. ③ a manual step in Muzzy's browser — say it in every hand-off that tests New PDS
- **Set up deck** also renames the file "Item # - Game Name - PDS" (Muzzy, 28 Oct 2026: one place to type the info). ① library code
- Menu slots in use: 1 setup · 2 add · 3 revised · 4 archive · 5 unarchive · 6–10 statuses · 11 New PDS. Slots 12–25 are free for new items with no stub change.
- **Changing the template's design**: edit the template (it's the source); new copies get it. Existing decks keep their own layouts.
- **Mark selected pages revised today.**
- **Archive selected pages…** — pick **Replace** or **Drop**, give a reason (required). Replace: an exact copy goes after the Archive divider, skipped, band "SUPERSEDED | Archived | Reason" (no "Replaced by" — Muzzy, 28 Oct 2026); the live page is left untouched except Date Revised = today. Both modes band a fresh copy (the editor doesn't redraw a page open on screen when a script changes it); Drop then removes the original. Drop: the page itself moves after the divider, skipped, band "DROPPED | Archived | Reason". (Muzzy rejected "clear the live page", 28 Oct 2026.) ① library code
- **Set up deck** also fills Date Revised on pages never revised (shows their Date Created). ① library code
- Field matching: a page's boxes are matched to the layout box they came from (`_ph0` created, `_ph1` revised, `_ph2` status). Layouts are recognised by name, or by their chip text if renamed.

## One-time access (already done on the laptop; redo on a new machine)

1. Work login for gws lives in `~/.config/gws-relatable` (see memory `gws-relatable-account`). Scopes needed:
   `GOOGLE_WORKSPACE_CLI_CONFIG_DIR=~/.config/gws-relatable gws auth login --scopes https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/script.projects`
2. The work account must have **Google Apps Script API: On** at https://script.google.com/home/usersettings ② pds.mjs stops with the error below until it is
3. The Apps Script API must be enabled on the Cloud project behind the gws login (Muzzy's personal `bmuz-workspace-cli`): https://console.cloud.google.com/apis/library/script.googleapis.com?project=bmuz-workspace-cli ② pds.mjs stops with the error below until it is

Errors: "Apps Script API 403 … has not been used/disabled" → step 3. "User has not enabled the Apps Script API" → step 2. "insufficient authentication scopes" → step 1.
