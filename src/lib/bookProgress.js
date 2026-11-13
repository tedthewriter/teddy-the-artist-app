// One row per item avoids overwriting another device's changes to other items.
export function createBookProgress({ storage, storageKey, validNumbers, remote, onChange = () => {} }) {
  const valid = new Set(validNumbers)
  const pendingKey = `${storageKey}:pending-v1`
  const importedKey = `${storageKey}:account-imported-v1`
  let cacheError = false
  function get(key) { try { return storage.getItem(key) } catch { return null } }
  function put(key, value) {
    try { storage.setItem(key, value) } catch { cacheError = true }
  }
  function decode(raw, fallback) { try { return JSON.parse(raw) ?? fallback } catch { return fallback } }
  const stored = decode(get(storageKey), [])
  const legacy = new Set(Array.isArray(stored) ? stored.filter(id => valid.has(id)) : [])
  let completed = new Set(legacy)
  const storedPending = decode(get(pendingKey), {})
  let pending = Object.fromEntries(Object.entries(storedPending).filter(([id, op]) =>
    valid.has(Number(id)) && typeof op?.completed === 'boolean' && typeof op?.token === 'string'))
  let imported = get(importedKey) === '1'
  let status = remote ? 'syncing' : 'local'
  let running = null
  const snapshot = () => ({ completed: new Set(completed), status, cacheError })
  const publish = () => onChange(snapshot())
  function overlay() {
    for (const [id, op] of Object.entries(pending)) {
      if (op.completed) completed.add(Number(id))
      else completed.delete(Number(id))
    }
  }
  function cache() {
    put(storageKey, JSON.stringify([...completed]))
    put(pendingKey, JSON.stringify(pending))
  }
  overlay()

  async function sync() {
    if (!remote) return
    if (running) return running
    status = 'syncing'; publish()
    running = (async () => {
      try {
        if (!imported) {
          // Insert only absent rows; false rows on the server always win over old marks.
          if (legacy.size) await remote.import([...legacy])
          imported = true
          put(importedKey, '1')
        }
        while (Object.keys(pending).length) {
          const batch = { ...pending }
          await remote.save(Object.entries(batch).map(([id, op]) => ({ item_id: Number(id), completed: op.completed })))
          for (const [id, op] of Object.entries(batch)) {
            // A second toggle during the request must remain queued.
            if (pending[id]?.token === op.token) delete pending[id]
          }
          cache()
        }
        const rows = await remote.load()
        completed = new Set(rows.filter(row => row.completed && valid.has(row.item_id)).map(row => row.item_id))
        overlay()
        cache()
        status = Object.keys(pending).length ? 'syncing' : 'synced'
      } catch {
        status = 'offline'
      } finally {
        running = null
        publish()
      }
    })()
    return running
  }

  function toggle(id) {
    if (!valid.has(id)) return
    const checked = !completed.has(id)
    if (checked) completed.add(id)
    else completed.delete(id)
    if (remote) pending[id] = { completed: checked, token: globalThis.crypto.randomUUID() }
    cache()
    publish()
    // Queue behind an in-flight load so that toggles made during it are flushed too.
    void sync().then(() => { if (status !== 'offline' && Object.keys(pending).length) void sync() })
  }
  return { snapshot, sync, toggle }
}

export function bookProgressRemote(client, userId, bookId) {
  const conflict = { onConflict: 'user_id,book_id,item_id' }
  async function write(rows, ignoreDuplicates) {
    const { error } = await client.from('user_book_progress').upsert(
      rows.map(row => ({ user_id: userId, book_id: bookId, ...row })),
      { ...conflict, ignoreDuplicates },
    ).abortSignal(AbortSignal.timeout(15000))
    if (error) throw error
  }
  return {
    import: ids => write(ids.map(item_id => ({ item_id, completed: true })), true),
    save: rows => write(rows, false),
    async load() {
      const { data, error } = await client.from('user_book_progress')
        .select('item_id,completed').eq('user_id', userId).eq('book_id', bookId).abortSignal(AbortSignal.timeout(15000))
      if (error) throw error
      return data || []
    },
  }
}
