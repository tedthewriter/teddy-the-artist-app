import test from 'node:test'
import assert from 'node:assert/strict'
import { watercolorPaintingSections } from '../src/data/watercolorPaintings.js'
import { restoreDisneyReading } from '../src/data/disneyLectures.js'

test('watercolor checklist contains all 50 projects in photographed chapter and page order', () => {
  const entries = watercolorPaintingSections.flatMap(s => s.paintings)
  assert.deepEqual(watercolorPaintingSections.map(s => [s.name, s.paintings.length]), [
    ['Simple still lifes', 13], ['Landscapes', 13], ['Cityscapes', 9], ['Animals', 9], ['Figures, portraits, people', 6],
  ])
  assert.deepEqual(entries.map(p => p.number), Array.from({ length: 50 }, (_, i) => i + 1))
  assert.deepEqual(entries.map(p => p.page), [
    ...Array.from({ length: 13 }, (_, i) => 32 + 2 * i),
    ...Array.from({ length: 13 }, (_, i) => 60 + 2 * i),
    ...Array.from({ length: 9 }, (_, i) => 88 + 2 * i),
    ...Array.from({ length: 9 }, (_, i) => 108 + 2 * i),
    ...Array.from({ length: 6 }, (_, i) => 128 + 2 * i),
  ])
  assert.ok(entries.every(p => p.pageEnd === p.page + 1))
  assert.equal(entries[0].title, 'Lively washes')
  assert.equal(entries[12].title, 'Creating dynamic contrast')
  assert.equal(entries[49].title, 'Mixing media')
  const sections = watercolorPaintingSections.map(s => ({ lectures: s.paintings }))
  assert.deepEqual([...restoreDisneyReading('[1,50,50,51,null]', sections)], [1, 50])
})
