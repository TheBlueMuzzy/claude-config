import { section, LOCAL_LINK } from './_shared.mjs'

export default {
  id: 'HC5',
  name: 'card.links-answer',
  what: 'A localhost / LAN link under **Try it:** must answer (any HTTP status within 3 s)',
  why: '"Start the servers, curl them" (/develop §4) was only remembered — Muzzy clicks them next (F80)',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  async check({ message }) {
    // (a link ending a sentence or a list item — "…:5173, phone …" — loses its trailing punctuation first)
    const links = [...new Set(((section(message, 'Try it') || '').match(LOCAL_LINK) || []).map(link => link.replace(/[.,;:!?*]+$/, '')))].slice(0, 6)
    const dead = (await Promise.all(links.map(async link => (await answers(link)) ? null : link))).filter(Boolean)
    if (dead.length) return `These links under **Try it:** don't answer: ${dead.join(', ')}. Start the servers they need the way /play does (dev server with --host, plus the online server if it's in it), check each link answers, then hand off — Muzzy clicks them next.`
  },
}

// Does a local link answer at all (any HTTP status)? A refused connection or 3 s of silence = no.
async function answers(link) {
  try {
    await fetch(link, { signal: AbortSignal.timeout(3000), redirect: 'manual' })
    return true
  } catch {
    return false
  }
}
