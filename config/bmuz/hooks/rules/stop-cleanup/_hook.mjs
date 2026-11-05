// stop-cleanup — tidy up at the end of every turn (F78 → rule file F184). Never sends Claude back; runs even when
// another Stop hook already did.
export default {
  hook: 'stop-cleanup',
  event: 'Stop',
  when: 'When Claude finishes a turn',
  order: ['CL1'],
}
