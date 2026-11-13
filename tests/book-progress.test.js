import test from 'node:test'
import assert from 'node:assert/strict'
import { createBookProgress } from '../src/lib/bookProgress.js'

function memory(initial = {}) {
  const values = new Map(Object.entries(initial))
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
}
function server() {
  const books = new Map()
  return (account, book) => {
    const key = `${account}:${book}`
    if (!books.has(key)) books.set(key, new Map())
    const rows = books.get(key)
    return {
      async import(ids) { for (const id of ids) if (!rows.has(id)) rows.set(id, true) },
      async save(batch) { for (const row of batch) rows.set(row.item_id, row.completed) },
      async load() { return [...rows].map(([item_id, completed]) => ({ item_id, completed })) },
    }
  }
}
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
function device(remote, storage = memory(), onChange) {
  return createBookProgress({ remote, storage, storageKey: 'legacy:user', validNumbers: [1, 2, 3], onChange })
}

test('legacy phone marks import, become visible on a second device, and do not overwrite server unchecks', async () => {
  const api = server()
  const phoneStorage = memory({ 'legacy:user': '[1,2,2,999,"3"]' })
  const phone = device(api('her', 'book'), phoneStorage)
  await phone.sync()
  const laptop = device(api('her', 'book'))
  await laptop.sync()
  assert.deepEqual([...laptop.snapshot().completed], [1, 2])
  laptop.toggle(1); await laptop.sync()
  // Another older browser still has item 1 marked: its import must not resurrect it.
  const oldBrowser = device(api('her', 'book'), memory({ 'legacy:user': '[1,3]' }))
  await oldBrowser.sync()
  await phone.sync()
  assert.deepEqual([...phone.snapshot().completed], [2, 3])
  assert.equal(phoneStorage.getItem('legacy:user:account-imported-v1'), '1')
})

test('different item changes on two devices merge, and books/accounts stay separate', async () => {
  const api = server()
  const a = device(api('her', 'book')); const b = device(api('her', 'book'))
  await Promise.all([a.sync(), b.sync()])
  a.toggle(1); b.toggle(2)
  await Promise.all([a.sync(), b.sync()])
  await a.sync()
  assert.deepEqual([...a.snapshot().completed].sort(), [1, 2])
  for (const remote of [api('me', 'book'), api('her', 'other-book')]) {
    const isolated = device(remote); await isolated.sync()
    assert.equal(isolated.snapshot().completed.size, 0)
  }
})

test('offline check and uncheck survive page close and retry without reimporting cleared marks', async () => {
  const api = server(); const remote = api('her', 'book')
  await remote.import([1])
  let offline = true
  const unreliable = {
    ...remote,
    async save(rows) { if (offline) throw new Error('offline'); return remote.save(rows) },
    async load() { if (offline) throw new Error('offline'); return remote.load() },
  }
  const storage = memory({ 'legacy:user': '[1]', 'legacy:user:account-imported-v1': '1' })
  const first = device(unreliable, storage)
  first.toggle(1); first.toggle(2); await first.sync()
  assert.equal(first.snapshot().status, 'offline')
  assert.deepEqual([...first.snapshot().completed], [2])
  const reopened = device(unreliable, storage)
  assert.deepEqual([...reopened.snapshot().completed], [2])
  offline = false; await reopened.sync()
  assert.deepEqual(await remote.load(), [{ item_id: 1, completed: false }, { item_id: 2, completed: true }])
  assert.equal(reopened.snapshot().status, 'synced')
  assert.equal(storage.getItem('legacy:user:pending-v1'), '{}')
})

test('a fast second toggle during a write stays queued and wins after the first write', async () => {
  const api = server(); const remote = api('her', 'book'); const gate = deferred()
  let first = true
  const store = device({ ...remote, async save(rows) {
    if (first) { first = false; await gate.promise }
    return remote.save(rows)
  } })
  await store.sync()
  store.toggle(1); store.toggle(1)
  gate.resolve(); await store.sync()
  assert.equal(store.snapshot().completed.has(1), false)
  assert.deepEqual(await remote.load(), [{ item_id: 1, completed: false }])
})

test('a late network read cannot erase a toggle made while loading', async () => {
  const api = server(); const remote = api('her', 'book'); const gate = deferred()
  let first = true
  const store = device({ ...remote, async load() {
    const rows = await remote.load()
    if (first) { first = false; await gate.promise }
    return rows
  } })
  const loading = store.sync()
  store.toggle(3)
  gate.resolve(); await loading
  await store.sync()
  assert.equal(store.snapshot().completed.has(3), true)
  assert.deepEqual(await remote.load(), [{ item_id: 3, completed: true }])
})

test('failed import is retried and a blocked local cache still permits account saves', async () => {
  const api = server(); const remote = api('her', 'book'); let fail = true
  const storage = memory({ 'legacy:user': '[1]' })
  const store = device({ ...remote, async import(ids) { if (fail) throw Error('offline'); await remote.import(ids) } }, storage)
  await store.sync()
  assert.equal(store.snapshot().status, 'offline')
  assert.equal(storage.getItem('legacy:user:account-imported-v1'), null)
  fail = false; await store.sync()
  assert.deepEqual(await remote.load(), [{ item_id: 1, completed: true }])
  const blocked = device(remote, { getItem() { throw Error('blocked') }, setItem() { throw Error('blocked') } })
  await blocked.sync(); blocked.toggle(2); await blocked.sync()
  assert.equal(blocked.snapshot().status, 'synced')
  assert.equal(blocked.snapshot().cacheError, true)
  assert.equal((await remote.load()).find(r => r.item_id === 2).completed, true)
})
