import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { disneyCharacterSections } from '../src/data/disneyCharacters.js'
import { restoreDisneyReading } from '../src/data/disneyLectures.js'

const entries = disneyCharacterSections.flatMap(section => section.lectures)

test('Disney checklist includes every transcribed index entry under all 60 contents headings', () => {
  const index = readFileSync(new URL('../reference/disney-book-index.tsv', import.meta.url), 'utf8').trim().split('\n')
    .map(line => { const [title, page] = line.split('\t'); return `${title}:${page}` })
  assert.equal(entries.length, 694)
  assert.equal(disneyCharacterSections.length, 60)
  assert.equal(new Set(entries.map(entry => entry.number)).size, entries.length)
  assert.deepEqual(entries.map(({ title, page }) => `${title}:${page}`).sort(), index.sort())
  assert.ok(disneyCharacterSections.every(section => section.lectures.length > 0))
  for (const [section, title, page] of [
    ['101 Dalmatians', 'Cruella De Vil', 6], ['Dumbo', 'Casey Jr.', 130],
    ['Meet the Robinsons', 'Uncle Art', 245], ['Lady and the Tramp', 'Colette', 224],
    ['Ratatouille', 'Colette', 329], ['Zootopia', 'Yax', 428],
  ]) assert.ok(disneyCharacterSections.find(s => s.name === section).lectures.some(e => e.title === title && e.page === page))
})

test('characters sharing pages have separate progress and invalid saved entries are ignored', () => {
  const twins = entries.filter(entry => ['Tweedledee', 'Tweedledum'].includes(entry.title))
  assert.equal(twins.length, 2)
  assert.equal(twins[0].page, twins[1].page)
  const saved = restoreDisneyReading(JSON.stringify([twins[0].number, twins[0].number, 9999, null]), disneyCharacterSections)
  assert.deepEqual([...saved], [twins[0].number])
  assert.equal(saved.has(twins[1].number), false)
  assert.equal(restoreDisneyReading('{', disneyCharacterSections).size, 0)
})
