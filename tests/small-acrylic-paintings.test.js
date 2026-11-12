import test from 'node:test'
import assert from 'node:assert/strict'
import { smallAcrylicPaintingSections } from '../src/data/smallAcrylicPaintings.js'
import { restoreDisneyReading } from '../src/data/disneyLectures.js'

test('acrylic book includes all 50 projects in photographed chapter and page order', () => {
  const entries = smallAcrylicPaintingSections.flatMap(s => s.paintings)
  assert.deepEqual(smallAcrylicPaintingSections.map(s => s.paintings.length), [18, 15, 17])
  assert.deepEqual(entries.map(p => p.number), Array.from({ length: 50 }, (_, i) => i + 1))
  assert.deepEqual(entries.map(p => p.page), [
    ...Array.from({ length: 18 }, (_, i) => 36 + i * 2),
    ...Array.from({ length: 15 }, (_, i) => 74 + i * 2),
    ...Array.from({ length: 17 }, (_, i) => 106 + i * 2),
  ])
  assert.equal(entries[0].title, 'Basic paint application: Moonrise')
  assert.equal(entries[18].title, 'Using contour strokes: Ball of yarn')
  assert.equal(entries[33].title, 'Painting simple highlights: Light bulb')
  assert.equal(entries[49].title, 'Painting elaborate detail: Pile of candy')
  const sections = smallAcrylicPaintingSections.map(s => ({ lectures: s.paintings }))
  assert.deepEqual([...restoreDisneyReading('[1,1,50,51,null,"2"]', sections)], [1, 50])
})

test('More Small Paintings includes its own 50 projects and photographed chapter breaks', async () => {
  const { moreSmallAcrylicPaintingSections } = await import('../src/data/moreSmallAcrylicPaintings.js')
  const entries = moreSmallAcrylicPaintingSections.flatMap(s => s.paintings)
  assert.deepEqual(moreSmallAcrylicPaintingSections.map(s => s.paintings.length), [17, 18, 15])
  assert.deepEqual(entries.map(p => p.number), Array.from({ length: 50 }, (_, i) => i + 1))
  assert.deepEqual(entries.map(p => p.page), [
    ...Array.from({ length: 17 }, (_, i) => 36 + i * 2),
    ...Array.from({ length: 18 }, (_, i) => 72 + i * 2),
    ...Array.from({ length: 15 }, (_, i) => 110 + i * 2),
  ])
  assert.equal(entries[0].title, 'Basic paint application: Door')
  assert.equal(entries[17].title, 'Introduction to cubes: Block of butter')
  assert.equal(entries[35].title, 'Random edges: Cumulus clouds')
  assert.equal(entries[49].title, 'Tonalism: Landscape with setting sun')
})
