import { moreSmallAcrylicPaintingSections } from '../data/moreSmallAcrylicPaintings'
import { watercolorPaintingSections } from '../data/watercolorPaintings'
import { useBookProgress, BookProgressNote } from './BookProgress'
import { useState } from 'react'
import Icon from './Icon'
import { smallAcrylicPaintingSections } from '../data/smallAcrylicPaintings'

export default function SmallAcrylicPaintings({ userId, onBack, more = false, watercolor = false }) {
  const sections = watercolor ? watercolorPaintingSections : more ? moreSmallAcrylicPaintingSections : smallAcrylicPaintingSections
  const paintingCount = sections.reduce((total, section) => total + section.paintings.length, 0)
  const storageKey = watercolor ? `teddy-watercolor-paintings-v1:${userId || 'preview'}` : `teddy-${more ? 'more-small' : 'small'}-acrylic-paintings-v1:${userId || 'preview'}`
  const bookId = watercolor ? 'watercolor' : more ? 'more-small-acrylic' : 'small-acrylic'
  const progress = useBookProgress(userId, bookId, storageKey, sections.flatMap(s => s.paintings.map(p => p.number)))
  const completed = progress.completed
  const toggle = progress.toggle
  const [initialSection] = useState(() => sections.find(
    section => section.paintings.some(({ number }) => !completed.has(number)),
  )?.name)
  return (
    <main className="app-shell library-shell art-library-shell">
      <header className="library-header">
        <button type="button" className="back-button" onClick={onBack}><Icon name="back" size={19} /> Art</button>
      </header>
      <div className="art-library-heading">
        <span className="art-library-icon" aria-hidden="true"><Icon name="palette" size={27} /></span>
        <p className="eyebrow">Art · Painting checklist</p>
        <h1 className="library-title">{watercolor ? '50 Paintings in Watercolor' : more ? '50 More Small Paintings in Acrylic' : '50 Small Paintings in Acrylic'}</h1>
        <p className="library-intro">Check off each painting after you finish it. Your progress saves to your account, appears on your other devices, and doesn’t reset daily.</p>
      </div>
      <p className="bingo-progress" role="status">{completed.size} of {paintingCount} paintings completed</p>
      <BookProgressNote progress={progress} />
      {sections.map(({ name, paintings }) => (
        <details className="art-ideas lecture-section" key={name} open={name === initialSection}>
          <summary>
            {name} <span>{paintings.filter(({ number }) => completed.has(number)).length}/{paintings.length} completed</span>
          </summary>
          {paintings.map(({ number, title, page, pageEnd }) => (
            <label key={number} className={`art-idea checklist-row lecture-row${completed.has(number) ? ' is-checked' : ''}`}>
              <span className="daily-checkbox"><input type="checkbox" checked={completed.has(number)} onChange={() => toggle(number)} /></span>
              <span className="checklist-content"><span>{number}. {title} · {pageEnd ? `pp. ${page}–${pageEnd}` : `p. ${page}`}</span></span>
            </label>
          ))}
        </details>
      ))}
    </main>
  )
}
