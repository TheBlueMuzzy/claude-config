export default {
  id: 'PL27',
  name: 'plan.bug-heading-readable',
  what: 'A "### B…" heading the reader can\'t parse → write it "### B014 · P2 · open · found <date> …" (middle dots ·)',
  why: 'An unreadable bug drops out of the counts and the P0 gate (F80)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  check({ text, add }) {
    text.split('\n').forEach((line, n) => {
      if (/^###\s*B\d/.test(line) && !/^### (B\d+) · (P\d) · ([^·\n]+)/.test(line)) add('BUGS.md', n + 1, `"${line.slice(0, 60)}" isn't read as a bug — write it "### B014 · P2 · open · found <date> …" (middle dots ·), or it drops out of the counts and the P0 check`)
    })
  },
}
