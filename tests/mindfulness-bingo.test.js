import test from 'node:test'
import assert from 'node:assert/strict'
import { bingoPractices, bingoLines, freshBingo, restoreBingo, freeSquare } from '../src/data/mindfulnessBingo.js'

test('a fresh card has 24 distinct practices and a free center', () => {
  const card = freshBingo()
  assert.equal(bingoPractices.length, 24)
  assert.equal(card.order.length, 25)
  assert.equal(new Set(card.order).size, 25)
  assert.equal(card.order[12], freeSquare)
  assert.deepEqual(card.marked, [])
  assert.equal(bingoLines(card.order,card.marked).length, 0)
  assert.ok(bingoPractices.every(p => p.title && p.cue))
})
test('shuffle rearranges without adding or losing practices', () => {
  const a = freshBingo(() => 0)
  const b = freshBingo(() => .99)
  assert.notDeepEqual(a.order,b.order)
  assert.deepEqual([...a.order].sort(), [...b.order].sort())
  assert.equal(a.order[12], freeSquare)
  assert.equal(b.order[12], freeSquare)
})
test('recognizes every row, column and diagonal including the free space', () => {
  const card = freshBingo(() => .99)
  const lines = []
  for(let n=0;n<5;n++) {
    lines.push(Array.from({length:5},(_,i)=>n*5+i))
    lines.push(Array.from({length:5},(_,i)=>i*5+n))
  }
  lines.push([0,6,12,18,24],[4,8,12,16,20])
  for(const line of lines) {
    const marked=line.map(i=>card.order[i]).filter(id=>id!==freeSquare)
    assert.ok(bingoLines(card.order,marked).some(found=>found.join()===line.join()))
    assert.equal(bingoLines(card.order,marked.slice(1)).length,0)
  }
})
test('a full card has exactly 12 lines; removing marks removes a bingo', () => {
  const card=freshBingo()
  const all=card.order.filter(id=>id!==freeSquare)
  assert.equal(bingoLines(card.order,all).length,12)
  assert.equal(bingoLines(card.order,[]).length,0)
})
test('restores arrangement and marks across reopening', () => {
  const card=freshBingo()
  card.marked=[card.order[0],card.order[3]]
  assert.deepEqual(restoreBingo(JSON.stringify(card)),card)
})
test('invalid, stale or corrupted storage does not break the card', () => {
  for(const value of [null,'undefined','{bad','{}','[]','{"version":2}']) assert.equal(restoreBingo(value),null)
  const card=freshBingo()
  card.order[12]='wrong'
  assert.equal(restoreBingo(JSON.stringify(card)),null)
  const duplicate=freshBingo()
  duplicate.order[1]=duplicate.order[0]
  assert.equal(restoreBingo(JSON.stringify(duplicate)),null)
})
test('storage restoration filters unknown, duplicate and free-space marks', () => {
  const card=freshBingo()
  card.marked=[card.order[0],card.order[0],'unknown',freeSquare]
  assert.deepEqual(restoreBingo(JSON.stringify(card)).marked,[card.order[0]])
})
