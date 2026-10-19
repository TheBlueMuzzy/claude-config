---
type: regex
target: { source: file, path: .planning/BUGS.md }
pattern: '^### B\d{3} · P[0-3] · open'
flags: m
---
A BUGS.md entry headed "### B001 · P2 · open · …".
