import { useEffect, useState } from 'react'
import { localDay, restoreChecklist, toggleChecklist } from '../lib/dailyChecklist'

export function useDailyChecklist(userId, page) {
  const storageKey = `teddy-daily-checklist-v1:${userId || 'preview'}:${page}`
  function read() {
    try { return restoreChecklist(localStorage.getItem(storageKey)) }
    catch { return restoreChecklist(null) }
  }
  const [state, setState] = useState(read)
  const [error, setError] = useState(false)
  useEffect(() => {
    const refresh = () => {
      try {
        const raw = localStorage.getItem(storageKey)
        if (raw) { setState(restoreChecklist(raw)); return }
      } catch {}
      setState(current => current.day === localDay() ? current : restoreChecklist(null))
    }
    refresh()
    const timer = window.setInterval(refresh, 1000)
    window.addEventListener('focus', refresh)
    window.addEventListener('pageshow', refresh)
    window.addEventListener('storage', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pageshow', refresh)
      window.removeEventListener('storage', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [storageKey])
  function toggle(id) {
    // Read the latest saved marks, including changes from another open tab.
    let current = state
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) current = restoreChecklist(raw)
    } catch {}
    const next = toggleChecklist(current, id)
    setState(next)
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setError(false) }
    catch { setError(true) }
  }
  return {
    isChecked: id => state.day === localDay() && state.checked.includes(id),
    toggle,
    error,
  }
}

export function ChecklistNote({ error }) {
  return <p className="support-note" role={error ? 'alert' : undefined}>{error
    ? 'This browser could not save your checkmarks. They may be lost when you leave.'
    : 'Check off what you finish. Marks save on this device for this account and clear each new day. Weekly activities reset daily too; there’s no need to do them every day.'}</p>
}

export function ChecklistRow({ title, checklist, id = title, children, href, onClick, target, rel }) {
  const checked = checklist.isChecked(id)
  const content = <>{children}<span>{title}</span></>
  return <article className={`art-idea checklist-row${checked ? ' is-checked' : ''}`}>
    <label className="daily-checkbox">
      <input type="checkbox" checked={checked} onChange={() => checklist.toggle(id)} aria-label={`Mark ${title} done today`} />
    </label>
    {href ? <a className="checklist-content" href={href} target={target} rel={rel}>{content}</a>
      : onClick ? <button type="button" className="checklist-content" onClick={onClick}>{content}</button>
      : <span className="checklist-content">{content}</span>}
  </article>
}
