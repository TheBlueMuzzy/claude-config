export default {
  id: 'HC4',
  name: 'card.posted-time',
  what: 'A progress line\'s "posted HH:MM" is within 10 minutes of the clock',
  why: 'Muzzy, 2026-10-13: "I don\'t have a time to reference if I walk away and come back" — framework sprint 48 posted 08:05 PM at 07:55 PM, and 07:58 PM twice',
  on: true,
  mode: 'block',
  tests: 'handoff-check',
  check({ message }) {
    const posted = message.match(/posted\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i)
    if (!posted) return
    const said = ((Number(posted[1]) % 12) + (/pm/i.test(posted[3]) ? 12 : 0)) * 60 + Number(posted[2])
    const now = new Date()
    const real = now.getHours() * 60 + now.getMinutes()
    const off = Math.min(Math.abs(said - real), 1440 - Math.abs(said - real))
    const clock = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    if (off > 10) return `The progress line says "posted ${posted[1]}:${posted[2]} ${posted[3]}", but the clock says ${clock} — run \`date "+%I:%M %p"\` first and post the real time (Muzzy, 2026-10-13: the posted time is what he reads when he comes back).`
  },
}
