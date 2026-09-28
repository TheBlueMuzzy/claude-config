# Release recipes

One file per platform (`github-pages.md`, `vercel.md`, `itch.md`, `google-play.md`…), shared by every project.
They're written by `/deliver` the **first time** a game goes to that platform, and corrected every time
something turns out different. No recipe exists until it's needed.

## Recipe template
```markdown
# <Platform> release recipe
Last used: <date> (<project> v<version>)

## Prerequisites
- <accounts, CLIs, keys — and where they live (never paste secrets here)>

## One-time setup per project
1. <e.g. set Vite `base` to '/<repo>/'>
2. ...

## Every release
1. <exact commands / clicks>
2. ...

## Check it's live
- <URL pattern, what to look for, how long it takes to update>

## Release-stage extras
- alpha: <e.g. unlisted link only>
- beta: <e.g. feedback link in the menu>
- 1.0: <e.g. store listing, screenshots, privacy policy>

## Gotchas
- <things that went wrong before and the fix>
```
