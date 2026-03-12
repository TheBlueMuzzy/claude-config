# Automatic Versioning

Projects with `version.json` get automatic version management: **X.Y.Z.B**
- **B** (build): increment on every commit
- **Z** (patch): bug fix or value tweak — reset B
- **Y** (minor): milestone completed — reset Z, B — `git tag vX.Y.Z`
- **X** (major): deploy/ship — reset Y, Z, B — `git tag vX.Y.Z`

On bump: read `version.json`, update fields, append to `history` array
(`{"version", "date", "summary"}`), write back. If unsure, just bump B.
