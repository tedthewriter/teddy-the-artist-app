import test from 'node:test'
import assert from 'node:assert/strict'
import { localDay, restoreChecklist, toggleChecklist } from '../src/lib/dailyChecklist.js'

test('day keys use the device local calendar, not UTC', () => {
  assert.equal(localDay(new Date(2026, 10, 8, 23, 59)), '2026-11-08')
  assert.equal(localDay(new Date(2026, 10, 9, 0, 0)), '2026-11-09')
})
test('marks persist on the same day and can be undone independently', () => {
  let state = restoreChecklist(null, '2026-11-08')
  state = toggleChecklist(state, 'Paint', '2026-11-08')
  state = toggleChecklist(state, 'Read scriptures', '2026-11-08')
  state = restoreChecklist(JSON.stringify(state), '2026-11-08')
  assert.deepEqual(state.checked, ['Paint', 'Read scriptures'])
  assert.deepEqual(toggleChecklist(state, 'Paint', '2026-11-08').checked, ['Read scriptures'])
})
test('new days clear saved daily, weekly, and art marks', () => {
  const state = { day: '2026-11-08', checked: ['Read scriptures', 'Go to the temple', 'Paint'] }
  assert.deepEqual(restoreChecklist(JSON.stringify(state), '2026-11-09').checked, [])
  assert.deepEqual(toggleChecklist(state, 'Journal', '2026-11-09').checked, ['Journal'])
})
test('invalid storage is safe and duplicate marks are removed', () => {
  for (const raw of [null, '{', 'null', '{"day":"2026-11-08","checked":true}']) {
    assert.deepEqual(restoreChecklist(raw, '2026-11-08'), { day: '2026-11-08', checked: [] })
  }
  assert.deepEqual(restoreChecklist('{"day":"2026-11-08","checked":["Paint","Paint",5]}', '2026-11-08').checked, ['Paint'])
})
