// Helpers the live-push rules share (F184 — moved out of live-push.mjs unchanged).
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { git } from '../../lib.mjs'

export function repoRoot(dir) {
  const top = git(dir, 'rev-parse', '--show-toplevel')
  return top ? resolve(top) : null
}

// Branches named under `on: push: branches:` in workflows that deploy (Pages, gh-pages, wrangler, a deploy job).
export function liveBranches(root) {
  const folder = join(root, '.github', 'workflows')
  const live = new Set()
  if (!existsSync(folder)) return live
  for (const file of readdirSync(folder).filter(f => /\.ya?ml$/.test(f))) {
    // comments don't deploy anything: a checks workflow whose comment said "online through wrangler dev" made every push
    // to every branch look like it puts the site live (framework sprint 42)
    const text = readFileSync(join(folder, file), 'utf8').split('\n').filter(l => !/^\s*#/.test(l)).map(l => l.replace(/\s+#.*$/, '')).join('\n')
    if (!/deploy-pages|gh-pages|wrangler|deploy/i.test(text)) continue
    // `on: push` / `on: [push, …]` → every branch deploys
    if (/^on:\s*(push|\[[^\]]*\bpush\b[^\]]*\])\s*$/m.test(text)) { live.add('*'); continue }
    const push = text.match(/^\s*push:\s*\n((?:\s{4,}.*\n?)*)/m)
    if (!push) continue
    const inline = push[1].match(/branches:\s*\[([^\]]*)\]/)
    if (inline) inline[1].split(',').forEach(b => live.add(b.trim().replace(/['"]/g, '')))
    const list = push[1].match(/branches:\s*\n((?:\s+-\s*.*\n?)*)/)
    if (list) for (const item of list[1].matchAll(/-\s*['"]?([^'"\s#]+)/g)) live.add(item[1])
    if (!inline && !list) live.add('*') // `push:` with no branch list → every branch
  }
  return live
}

export function isLive(live, branch) {
  return live.has(branch) || live.has('*')
}

// [{ branch, commit }] for `git push`, `git push origin main`, `git push origin dev:main`, `git push --all`.
export function pushedBranches(root, args) {
  const current = git(root, 'rev-parse', '--abbrev-ref', 'HEAD')
  const words = args.filter(a => !a.startsWith('-'))
  if (args.includes('--all')) {
    return (git(root, 'for-each-ref', '--format=%(refname:short)', 'refs/heads') || '').split('\n').filter(Boolean)
      .map(branch => ({ branch, commit: branch }))
  }
  const refspecs = words.slice(1)
  if (!refspecs.length) return [{ branch: current, commit: 'HEAD' }]
  return refspecs.map(spec => {
    const [source, target] = spec.replace(/^\+/, '').split(':')
    const isHead = source === 'HEAD' || source === '@' || source === ''
    const from = isHead ? 'HEAD' : source
    const to = (target || (isHead ? current : source)).replace(/^refs\/heads\//, '')
    return { branch: to, commit: from }
  })
}
