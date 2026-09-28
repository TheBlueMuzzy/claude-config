# Automatic Versioning

Projects with `version.json` use **X.Y.Z.B** (`version` holds X.Y.Z, `build` holds B).
New projects start at `0.0.0` build 0, so delivering the first milestone makes it `0.1.0`.

| Part | Changes when | Who | Resets |
|---|---|---|---|
| **B** build | every `/save` — so B = saves since the last delivery | /save | — |
| **Z** patch | a `/deliver` update (no milestone finished) | /deliver | B |
| **Y** minor | a `/deliver` that finishes a milestone or reaches a release stage | /deliver | Z, B |
| **X** major | Muzzy says it's the public 1.0 release | /deliver (only when told) | Y, Z, B |

- `/develop` task commits do **not** touch version.json (keeps branches from conflicting).
- Every `/deliver` tags `vX.Y.Z` (so every released version can be rolled back to).
- On Z/Y/X: append to `history` (`{"version", "date", "summary"}`). If `package.json` has a `version`, set it to X.Y.Z too.
- Older projects whose milestone names don't match their version (e.g. milestone v1.6, version 0.2.0) just keep bumping Y — don't renumber anything.
