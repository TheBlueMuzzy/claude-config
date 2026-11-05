// check-ui-edit — UI rules checked the moment a UI file changes (F68 → rule files F184).
export default {
  hook: 'check-ui-edit',
  event: 'PostToolUse',
  matcher: 'Edit|Write|MultiEdit',
  when: 'After Claude edits a file under src/ in a game with the UI kit',
  order: ['CU1'],
}
