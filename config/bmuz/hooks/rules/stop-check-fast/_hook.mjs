// stop-check-fast — don't end a turn on broken code (F68; a global Stop hook since F80 → rule file F184).
export default {
  hook: 'stop-check-fast',
  event: 'Stop',
  when: 'When Claude finishes a turn in which it did work',
  order: ['SC1'],
}
