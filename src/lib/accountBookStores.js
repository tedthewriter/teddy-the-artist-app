import { supabase } from './supabase'
import { bookProgressRemote, createBookProgress } from './bookProgress'

const stores = new Map()

// Share the importer and page's queue so opening a book during import cannot race it.
export function accountBookStore(userId, bookId, storageKey, validNumbers) {
  if (!stores.has(storageKey)) {
    const listeners = new Set()
    const store = createBookProgress({ storage: localStorage, storageKey, validNumbers,
      remote: userId && supabase ? bookProgressRemote(supabase, userId, bookId) : null,
      onChange: next => { for (const listener of listeners) listener(next) },
    })
    stores.set(storageKey, { ...store,
      subscribe(listener) {
        listeners.add(listener)
        listener(store.snapshot())
        return () => listeners.delete(listener)
      },
    })
  }
  return stores.get(storageKey)
}
