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

export default function SaboteurResults({ result, onBack }) {
  const results = result?.results || {}
  const entries = scoreEntries(results)
  const numericScores = entries.map((entry) => Number(entry.score)).filter(Number.isFinite)
  const maxScore = Math.max(10, ...numericScores)

  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Positive Intelligence</button>
      </header>

      <div className="category-heading-icon gold" aria-hidden="true"><Icon name="compass" size={27} /></div>
      <p className="eyebrow">Positive Intelligence</p>
      <h1 className="library-title">Your Saboteur Assessment Results</h1>

      {!result ? (
        <section className="assessment-waiting-card">
          <span className="assessment-waiting-icon" aria-hidden="true"><Icon name="journal" size={27} /></span>
          <h2>Your results will appear here.</h2>
          <p>When your assessment results arrive, they can be added to this private page.</p>
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
                  <article className="assessment-result-row" key={`${entry.name}-${index}`}>
                    <div className="assessment-result-heading">
                      <strong>{entry.name}</strong>
                      {hasScore && <span>{score}</span>}
                    </div>
                    {hasScore && (
                      <div className="assessment-score-track" aria-label={`${entry.name}: ${score}`}>
                        <span style={{ width: `${Math.max(0, Math.min(100, (score / maxScore) * 100))}%` }} />
                      </div>
                    )}
                    {entry.description && <p>{entry.description}</p>}
                  </article>
                )
              })}
            </section>
          )}

          {results.notes && <section className="assessment-notes"><h2>What to remember</h2><p>{results.notes}</p></section>}
        </>
      )}

      <p className="assessment-gentle-note">These results describe patterns you may notice. They are information—not your identity or a measure of your worth.</p>
    </main>
  )
}
