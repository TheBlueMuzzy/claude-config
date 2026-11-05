// STATE.md read as sections (the STATE rules PL28, PL8, PL29, PL30, PL7 share it): its lines, and a section's start +
// non-empty body lines (up to the next "## "), or null when there's no such heading.
export function stateSections(text) {
  const lines = text.replace(/\n+$/, '').split('\n')
  const section = (re) => {
    const start = lines.findIndex(l => re.test(l)); if (start < 0) return null
    let end = lines.findIndex((l, n) => n > start && /^## /.test(l)); if (end < 0) end = lines.length
    return { start, body: lines.slice(start + 1, end).filter(l => l.trim()) }
  }
  return { lines, section }
}
