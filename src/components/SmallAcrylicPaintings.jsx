import { useState } from 'react'
import Icon from './Icon'
import { smallAcrylicPaintingSections } from '../data/smallAcrylicPaintings'
import { restoreDisneyReading } from '../data/disneyLectures'

export default function SmallAcrylicPaintings({ userId, onBack }) {
  const sections = smallAcrylicPaintingSections
  const paintingCount = sections.reduce((total, section) => total + section.paintings.length, 0)
  const storageKey = `teddy-small-acrylic-paintings-v1:${userId || 'preview'}`
  const [completed, setCompleted] = useState(() => {
    try { return restoreDisneyReading(localStorage.getItem(storageKey), sections.map(section => ({ lectures: section.paintings }))) }
    catch { return new Set() }
  })
  const [initialSection] = useState(() => sections.find(
    section => section.paintings.some(({ number }) => !completed.has(number)),
  )?.name)
  const [saveError, setSaveError] = useState(false)

  function toggle(number) {
    const next = new Set(completed)
    if (next.has(number)) next.delete(number)
    else next.add(number)
    setCompleted(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify([...next]))
      setSaveError(false)
    } catch { setSaveError(true) }
  }

  return (
    <main className="app-shell library-shell art-library-shell">
      <header className="library-header">
        <button type="button" className="back-button" onClick={onBack}><Icon name="back" size={19} /> Art</button>
      </header>
      <div className="art-library-heading">
        <span className="art-library-icon" aria-hidden="true"><Icon name="palette" size={27} /></span>
        <p className="eyebrow">Art · Painting checklist</p>
        <h1 className="library-title">50 Small Paintings in Acrylic</h1>
        <p className="library-intro">Check off each painting after you finish it. Your progress saves on this device and doesn’t reset daily.</p>
      </div>
      <p className="bingo-progress" role="status">{completed.size} of {paintingCount} paintings completed</p>
      {saveError && <p className="support-note" role="alert">This browser couldn’t save your checkmarks. They may be lost when you leave.</p>}
      {sections.map(({ name, paintings }) => (
        <details className="art-ideas lecture-section" key={name} open={name === initialSection}>
          <summary>
            {name} <span>{paintings.filter(({ number }) => completed.has(number)).length}/{paintings.length} completed</span>
          </summary>
          {paintings.map(({ number, title, page }) => (
            <label key={number} className={`art-idea checklist-row lecture-row${completed.has(number) ? ' is-checked' : ''}`}>
              <span className="daily-checkbox"><input type="checkbox" checked={completed.has(number)} onChange={() => toggle(number)} /></span>
              <span className="checklist-content"><span>{number}. {title} · p. {page}</span></span>
            </label>
          ))}
        </details>
      ))}
    </main>
  )
}
