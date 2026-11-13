import { useEffect, useState } from 'react'
import { accountBookStore } from '../lib/accountBookStores'

export function useBookProgress(userId, bookId, storageKey, validNumbers) {
  const [store] = useState(() => accountBookStore(userId, bookId, storageKey, validNumbers))
  const [progress, setProgress] = useState(store.snapshot)
  useEffect(() => {
    const unsubscribe = store.subscribe(setProgress)
    const refresh = () => {
      if (document.visibilityState !== 'hidden') void store.sync()
    }
    refresh()
    const timer = window.setInterval(refresh, 10000)
    window.addEventListener('focus', refresh)
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      unsubscribe()
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('online', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [store])
  return { ...progress, toggle: store.toggle, retry: store.sync }
}

export function BookProgressNote({ progress }) {
  return <p className="support-note" role="status">
    {progress.status === 'local' ? 'Preview progress saves on this device.'
      : progress.status === 'offline' ? <>Account sync is unavailable. Your changes will retry when you’re online. <button type="button" onClick={progress.retry}>Retry now</button></>
        : progress.status === 'syncing' ? 'Syncing progress with your account…'
          : 'Progress saved to your account and shared across devices.'}
    {progress.cacheError && ' This browser could not keep an offline copy. Keep this page open until account sync finishes.'}
  </p>
}
