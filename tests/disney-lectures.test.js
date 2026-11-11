import test from 'node:test'
import assert from 'node:assert/strict'
import { disneyLectureCount, disneyLectureSections, restoreDisneyReading } from '../src/data/disneyLectures.js'

test('Volume One includes all 149 consecutively numbered lectures in book order', () => {
  assert.equal(disneyLectureCount, 149)
  assert.deepEqual(disneyLectureSections.map(({ name, lectures }) => [name, lectures.length]), [
    ['Basics', 26], ['Gesture', 22], ['Seeing', 24], ['Analysis', 25], ['Creativity', 25], ['Thinking', 27],
  ])
  assert.deepEqual(disneyLectureSections.flatMap(({ lectures }) => lectures.map(({ number }) => number)),
    Array.from({ length: 149 }, (_, i) => i + 1))
})

test('reading progress restores only valid unique lecture numbers', () => {
  assert.deepEqual([...restoreDisneyReading('[1,1,149,150,"2",null]')], [1, 149])
  assert.equal(restoreDisneyReading('{').size, 0)
})
