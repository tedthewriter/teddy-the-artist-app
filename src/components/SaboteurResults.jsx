import { useState } from 'react'
import Icon from './Icon'

function scoreEntries(results = {}) {
  const source = results.saboteurs || results.scores || results.top_saboteurs || []
  if (Array.isArray(source)) {
    return source.map((entry, index) => typeof entry === 'string'
      ? { name: entry, rank: index + 1 }
      : { ...entry, name: entry.name || entry.label || `Result ${index + 1}` })
  }
  return Object.entries(source).map(([name, score]) => ({ name, score }))
}

function readableDate(value) {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    .format(new Date(year, month - 1, day))
}

function detailSections(entry = {}) {
  if (Array.isArray(entry.details)) return entry.details
  if (Array.isArray(entry.sections)) return entry.sections
  if (entry.sections && typeof entry.sections === 'object') {
    return Object.entries(entry.sections).map(([title, content]) => ({ title, content }))
  }
  return []
}

function detailItems(section = {}) {
  const content = section.items || section.content || section.text || []
  return Array.isArray(content) ? content : [content]
}

export default function SaboteurResults({ result, onBack }) {
  const [selectedEntry, setSelectedEntry] = useState(null)
  const results = result?.results || {}
  const entries = scoreEntries(results)
  const numericScores = entries.map((entry) => Number(entry.score)).filter(Number.isFinite)
  const maxScore = Math.max(10, ...numericScores)

  const openEntry = (entry) => {
    setSelectedEntry(entry)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goBack = () => {
    if (selectedEntry) {
      setSelectedEntry(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    onBack()
  }

  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={goBack}><Icon name="back" size={19} /> {selectedEntry ? 'All results' : 'Positive Intelligence'}</button>
      </header>

      <div className="category-heading-icon gold" aria-hidden="true"><Icon name="compass" size={27} /></div>
      <p className="eyebrow">Positive Intelligence</p>
      <h1 className="library-title">{selectedEntry ? selectedEntry.name : 'Your Saboteur Assessment Results'}</h1>

      {!result ? (
        <section className="assessment-waiting-card">
          <span className="assessment-waiting-icon" aria-hidden="true"><Icon name="journal" size={27} /></span>
          <h2>Your results will appear here.</h2>
          <p>When your assessment results arrive, they can be added to this private page.</p>
        </section>
      ) : selectedEntry ? (
        <section className="assessment-detail" aria-label={`${selectedEntry.name} details`}>
          <div className="assessment-detail-score">
            <span>Score</span>
            <strong>{selectedEntry.score}</strong>
            <span>out of 10</span>
          </div>

          {selectedEntry.description && <p className="assessment-detail-intro">{selectedEntry.description}</p>}

          <div className="assessment-detail-sections">
            {detailSections(selectedEntry).map((section, index) => (
              <section className="assessment-detail-section" key={`${section.title}-${index}`}>
                <h2>{section.title}</h2>
                {detailItems(section).length > 1 ? (
                  <ul>
                    {detailItems(section).map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}
                  </ul>
                ) : (
                  <p>{detailItems(section)[0]}</p>
                )}
              </section>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="assessment-summary-card">
            <p className="assessment-label">Assessment</p>
            <h2>{result.title}</h2>
            {result.received_at && <p className="assessment-date">Received {readableDate(result.received_at)}</p>}
            {results.summary && <p className="assessment-summary">{results.summary}</p>}
          </section>

          {entries.length > 0 && (
            <section className="assessment-results-list" aria-label="Saboteur scores">
              {entries.map((entry, index) => {
                const score = Number(entry.score)
                const hasScore = Number.isFinite(score)
                return (
                  <button className="assessment-result-row" key={`${entry.name}-${index}`} onClick={() => openEntry(entry)}>
                    <div className="assessment-result-heading">
                      <strong>{entry.name}</strong>
                      <span className="assessment-result-action">
                        {hasScore && <b>{score}</b>}
                        <Icon name="arrow" size={17} />
                      </span>
                    </div>
                    {hasScore && (
                      <div className="assessment-score-track" aria-label={`${entry.name}: ${score}`}>
                        <span style={{ width: `${Math.max(0, Math.min(100, (score / maxScore) * 100))}%` }} />
                      </div>
                    )}
                    <p>Tap to see details</p>
                  </button>
                )
              })}
            </section>
          )}

          {results.notes && <section className="assessment-notes"><h2>What to remember</h2><p>{results.notes}</p></section>}
        </>
      )}

      {result && <p className="assessment-gentle-note">These results describe patterns you may notice. They are information—not your identity or a measure of your worth.</p>}
    </main>
  )
}
