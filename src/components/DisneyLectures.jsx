import { useState } from 'react'
import Icon from './Icon'
import { disneyLectureSections, disneyLectureSectionsTwo, restoreDisneyReading } from '../data/disneyLectures'

export default function DisneyLectures({ userId, onBack, volume }) {
  const isTwo = volume === 2
  const sections = isTwo ? disneyLectureSectionsTwo : disneyLectureSections
  const lectureCount = sections.reduce((total, section) => total + section.lectures.length, 0)
  const storageKey = `teddy-disney-lectures-volume-${isTwo ? 'two' : 'one'}-v1:${userId || 'preview'}`
  const [read, setRead] = useState(() => {
    try { return restoreDisneyReading(localStorage.getItem(storageKey), sections) }
    catch { return new Set() }
  })
  const [initialSection] = useState(() => sections.find(
    section => section.lectures.some(({ number }) => !read.has(number)),
  )?.name)
  const [saveError, setSaveError] = useState(false)

  function toggle(number) {
    const next = new Set(read)
    if (next.has(number)) next.delete(number)
    else next.add(number)
    setRead(next)
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
        <p className="eyebrow">Art · Reading checklist</p>
        <h1 className="library-title">Disney Art Lectures, Volume {isTwo ? 'Two' : 'One'}</h1>
        <p className="library-intro">Check off each lecture after you read it. Your progress saves on this device and doesn’t reset daily.</p>
      </div>
      <p className="bingo-progress" role="status">{read.size} of {lectureCount} lectures read</p>
      {saveError && <p className="support-note" role="alert">This browser couldn’t save your checkmarks. They may be lost when you leave.</p>}
      {sections.map(({ name, lectures }) => (
        <details className="art-ideas lecture-section" key={name} open={name === initialSection}>
          <summary>
            {name} <span>{lectures.filter(({ number }) => read.has(number)).length}/{lectures.length} read</span>
          </summary>
          {lectures.map(({ number, title }) => (
            <label key={number} className={`art-idea checklist-row lecture-row${read.has(number) ? ' is-checked' : ''}`}>
              <span className="daily-checkbox"><input type="checkbox" checked={read.has(number)} onChange={() => toggle(number)} /></span>
              <span className="checklist-content"><span>{number}. {title}</span></span>
            </label>
          ))}
        </details>
      ))}
    </main>
  )
}
