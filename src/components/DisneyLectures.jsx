import { useState } from 'react'
import Icon from './Icon'
import { useBookProgress, BookProgressNote } from './BookProgress'
import { disneyCharacterSections } from '../data/disneyCharacters'
import { pixarCharacterSections } from '../data/pixarCharacters'
import { disneyLectureSections, disneyLectureSectionsTwo } from '../data/disneyLectures'

export default function DisneyLectures({ userId, onBack, volume }) {
  const isDisney = volume === 'disney-characters'
  const isPixar = volume === 'pixar'
  const isCharacterBook = isDisney || isPixar
  const isTwo = volume === 2
  const sections = isDisney ? disneyCharacterSections : isPixar ? pixarCharacterSections : isTwo ? disneyLectureSectionsTwo : disneyLectureSections
  const lectureCount = sections.reduce((total, section) => total + section.lectures.length, 0)
  const storageKey = isDisney ? `teddy-disney-characters-v1:${userId || 'preview'}` : isPixar ? `teddy-pixar-characters-v1:${userId || 'preview'}` : `teddy-disney-lectures-volume-${isTwo ? 'two' : 'one'}-v1:${userId || 'preview'}`
  const bookId = isDisney ? 'disney-characters' : isPixar ? 'pixar' : isTwo ? 'disney-lectures-two' : 'disney-lectures-one'
  const progress = useBookProgress(userId, bookId, storageKey, sections.flatMap(s => s.lectures.map(p => p.number)))
  const read = progress.completed
  const toggle = progress.toggle
  const [initialSection] = useState(() => sections.find(
    section => section.lectures.some(({ number }) => !read.has(number)),
  )?.name)
  return (
    <main className="app-shell library-shell art-library-shell">
      <header className="library-header">
        <button type="button" className="back-button" onClick={onBack}><Icon name="back" size={19} /> Art</button>
      </header>
      <div className="art-library-heading">
        <span className="art-library-icon" aria-hidden="true"><Icon name="palette" size={27} /></span>
        <p className="eyebrow">Art · {isCharacterBook ? 'Drawing' : 'Reading'} checklist</p>
        <h1 className="library-title">{isDisney ? 'Disney Character Book' : isPixar ? 'Pixar Character Book' : `Disney Art Lectures, Volume ${isTwo ? 'Two' : 'One'}`}</h1>
        <p className="library-intro">{isCharacterBook ? 'Check off each character after you draw it.' : 'Check off each lecture after you read it.'} Your progress saves to your account, appears on your other devices, and doesn’t reset daily.</p>
      </div>
      <p className="bingo-progress" role="status">{read.size} of {lectureCount} {isCharacterBook ? 'characters drawn' : 'lectures read'}</p>
      <BookProgressNote progress={progress} />
      {sections.map(({ name, lectures }) => (
        <details className="art-ideas lecture-section" key={name} open={name === initialSection}>
          <summary>
            {name} <span>{lectures.filter(({ number }) => read.has(number)).length}/{lectures.length} {isCharacterBook ? 'drawn' : 'read'}</span>
          </summary>
          {lectures.map(({ number, title, page }) => (
            <label key={number} className={`art-idea checklist-row lecture-row${read.has(number) ? ' is-checked' : ''}`}>
              <span className="daily-checkbox"><input type="checkbox" checked={read.has(number)} onChange={() => toggle(number)} /></span>
              <span className="checklist-content"><span>{isCharacterBook ? `p. ${page ?? number} · ${title}` : `${number}. ${title}`}</span></span>
            </label>
          ))}
        </details>
      ))}
    </main>
  )
}
