// Helpers the stop-plan-check rules share (F184 — moved out of stop-plan-check.mjs unchanged).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { git } from '../../lib.mjs'

export const MILESTONE_TAG = /^v\d+\.\d+\.0$/ // v0.9.0 = a milestone / release stage (v0.9.3 = an update)

// Tags matching `pattern` made since the turn began, oldest first.
export function tagsSince(root, startedAt, pattern) {
  if (!startedAt) return []
  const since = Date.parse(startedAt) / 1000 - 5
  const tags = (git(root, 'for-each-ref', '--sort=creatordate', '--format=%(creatordate:unix) %(refname:short)', 'refs/tags') || '').split('\n')
  return tags.map(line => line.split(' ')).filter(([when, tag]) => pattern.test(tag || '') && Number(when) >= since).map(([, tag]) => tag)
}

export function plannerLink(root) {
  try {
    return (readFileSync(join(root, '.planning', 'STATE.md'), 'utf8').match(/Planner \(PPP\):\*{0,2}\s*(https:\/\/claude\.ai\/\S+)/) || [])[1] || null
  } catch {
    return null
  }
}
