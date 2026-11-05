export default {
  id: 'PL14',
  name: 'plan.graph-matches',
  what: 'A live milestone\'s Mermaid graph shows the same needs as its item lines (every arrow is a `needs:`, every `needs:` between graph nodes is an arrow)',
  why: 'The graph and the lines must tell the same story — the planner draws both (F67)',
  on: true,
  mode: 'block',
  tests: 'plan-lint',
  // (released milestones are history — not re-checked)
  check({ roadmap, byId, add }) {
    for (const m of roadmap.milestones.filter(m => m.mermaid && !m.released)) {
      const edges = mermaidEdges(m.mermaid)
      const inGraph = new Set(edges.flatMap(([a, b]) => [a, b]))
      for (const [from, to] of edges) {
        if (!byId[from] || !byId[to]) { add('ROADMAP.md', null, `graph in "${m.name}": ${!byId[from] ? from : to} isn't in the roadmap`); continue }
        if (!byId[to].needs.some(n => n.replace(/^~/, '') === from)) add('ROADMAP.md', byId[to].lineNo, `graph in "${m.name}" says ${from} → ${to}, but ${to} doesn't list "needs: ${from}"`)
      }
      for (const item of m.items.filter(i => i.id && inGraph.has(i.id))) {
        for (const need of item.needs.map(n => n.replace(/^~/, ''))) {
          if (inGraph.has(need) && !edges.some(([a, b]) => a === need && b === item.id)) add('ROADMAP.md', item.lineNo, `${item.id} needs ${need}, but the graph in "${m.name}" has no ${need} → ${item.id} arrow`)
        }
      }
    }
  },
}

// "A --> B[label] --> C" and "A -.-> B" → [[A, B], [B, C]]
function mermaidEdges(text) {
  const edges = []
  for (const line of text.split('\n')) {
    // arrows: --> · -.-> · ==> · --- · labelled "-.working.->" / "-- text -->" / "-->|text|"
    const parts = line.replace(/\[[^\]]*\]|\([^)]*\)|\{[^}]*\}|"[^"]*"/g, '').split(/\s*(?:-\.[^>]*?\.?->|--[^->]*-->|-->|==>|---)(?:\|[^|]*\|)?\s*/)
    if (parts.length < 2) continue
    const ids = parts.map(p => (p.trim().match(/^[A-Za-z]\w*/) || [''])[0])
    const isFeature = (id) => /^F\d+[a-z]?$/.test(id) // other nodes (another project's "FW19") aren't checked
    for (let i = 0; i + 1 < ids.length; i++) if (isFeature(ids[i]) && isFeature(ids[i + 1])) edges.push([ids[i], ids[i + 1]])
  }
  return edges
}
