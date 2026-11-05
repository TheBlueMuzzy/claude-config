import { isFileEdit } from '../../lib.mjs'
import { section } from './_shared.mjs'

export default {
  id: 'HC6',
  name: 'card.screenshot',
  what: 'A turn that changed how the game looks (src/**/*.tsx|jsx|css…) took a screenshot, or **Proof:** says "no visual change"',
  why: 'Visual work is checked by looking at it, not assumed (CLAUDE.md "Verify your work", F80)',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  check({ turn, message }) {
    const visual = turn.tools.filter(t => isFileEdit(t) && /[\\/]src[\\/].*\.(tsx|jsx|css|scss|vue|svelte)$/i.test(t.input.file_path || '')).map(t => t.input.file_path)
    const looked = turn.tools.some(t => /screenshot/i.test(t.name) || ((t.name === 'Bash' || t.name === 'PowerShell') && /screenshot|playwright|e2e|check:full|check:framework|shots/i.test(t.input.command || '')) || (t.name === 'Agent' && /screenshot/i.test(t.input.prompt || '')))
    if (visual.length && !looked && !/no visual change/i.test(section(message, 'Proof') || '')) {
      return `You changed how the game looks (${visual.slice(0, 2).map(f => f.split(/[\\/]/).pop()).join(', ')}) but took no screenshot this turn. Open it in Playwright, screenshot it at phone and desktop size, look at it yourself and describe it under **Proof:** — or, if nothing on screen changed, write "no visual change" there.`
    }
  },
}
