---
type: regex
pattern: '(?<!not |n.t )safe to switch machines\.?\s*$'
flags: im
match: not_contains
---
It never ends a line with a plain "safe to switch machines" (only "NOT safe …").
