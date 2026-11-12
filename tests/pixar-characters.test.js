import test from 'node:test'
import assert from 'node:assert/strict'
import { pixarCharacterSections } from '../src/data/pixarCharacters.js'
import { restoreDisneyReading } from '../src/data/disneyLectures.js'

test('Pixar contents match the photographed page ranges and skipped pages', () => {
  const entries = pixarCharacterSections.flatMap(section => section.lectures)
  const pages = entries.map(entry => entry.number)
  assert.equal(entries.length, 247)
  assert.equal(new Set(pages).size, 247)
  assert.deepEqual(pages, Array.from({ length: 250 }, (_, i) => i + 4).filter(n => ![37, 223, 245].includes(n)))
  for (const [page, title] of [[4, 'Woody'], [38, 'Chatter Telephone'], [89, 'Coral'], [130, 'Guido'], [168, 'Remy'], [192, 'Dug'], [217, 'Nash and Ramsey'], [253, 'Junior Zap Patrol']]) {
    assert.equal(entries.find(entry => entry.number === page)?.title, title)
  }
})

test('Pixar progress restores its valid pages and rejects gaps, duplicates, and malformed data', () => {
  assert.deepEqual([...restoreDisneyReading('[4,4,37,192,223,245,253,254,"5"]', pixarCharacterSections)], [4, 192, 253])
  assert.equal(restoreDisneyReading('{', pixarCharacterSections).size, 0)
})
