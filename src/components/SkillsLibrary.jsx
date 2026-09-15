import { useMemo, useState } from 'react'
import Icon from './Icon'

const typeLabels = {
  overview: 'Start here',
  foundation: 'Foundation',
  practice: 'Guided practice',
  saboteur: 'Saboteur',
  sage_power: 'Sage power',
  cbt_intro: 'CBT foundation',
  cbt_week_1: 'Week 1',
  self_love_foundation: 'Self-love foundation',
}

function contentKindLabel(item) {
  if (item.content_type === 'cbt_week_1' && item.body?.day_number) {
    return `Week 1 · Day ${item.body.day_number}`
  }
  return typeLabels[item.content_type] || item.content_type
}

function DetailSection({ title, children }) {
  if (!children) return null
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function ContentDetail({ item, favorite, onBack, onToggleFavorite }) {
  const body = item.body || {}

  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Back</button>
        <button
          className={`icon-button ${favorite ? 'is-favorite' : ''}`}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={favorite}
          onClick={() => onToggleFavorite(item.id)}
        ><Icon name="bookmark" size={19} /></button>
      </header>

      <article className="content-detail-card">
        <p className="content-kind">{contentKindLabel(item)}</p>
        <h1>{item.title}</h1>
        <p className="detail-lead">{item.short_description}</p>

        {body.sections?.map((section) => (
          <DetailSection title={section.heading} key={section.heading}>
            <p>{section.text}</p>
          </DetailSection>
        ))}

        {body.question && (
          <blockquote className="sage-question">{body.question}</blockquote>
        )}

        <DetailSection title="You might notice">
          {(body.examples || body.cues) && (
            <ul>
              {[...(body.examples || []), ...(body.cues || [])].map((entry) => <li key={entry}>{entry}</li>)}
            </ul>
          )}
        </DetailSection>

        {body.distancing_statement && (
          <DetailSection title="Try saying">
            <p className="gentle-callout">{body.distancing_statement}</p>
          </DetailSection>
        )}

        <DetailSection title={body.activity_title || 'One small practice'}>
          {body.practice_steps && (
            <ol>{body.practice_steps.map((step) => <li key={step}>{step}</li>)}</ol>
          )}
        </DetailSection>

        {body.repeat_note && (
          <p className="gentle-callout">{body.repeat_note}</p>
        )}

        {item.reflection_prompt && (
          <DetailSection title="Reflect">
            <p className="reflection-prompt">{item.reflection_prompt}</p>
            <p className="record-reminder">If you want to keep your thoughts, record them in your notes app or journal.</p>
          </DetailSection>
        )}

        {item.faith_reflection && (
          <DetailSection title="Faith reflection">
            <p>{item.faith_reflection}</p>
          </DetailSection>
        )}

        <footer className="source-note">
          <span>{item.estimated_minutes ? `About ${item.estimated_minutes} minutes` : 'Take the time you need'}</span>
          {item.source_title && <span>Framework: {item.source_title}</span>}
        </footer>
      </article>
    </main>
  )
}

export default function SkillsLibrary({ items, favorites, loading, error, initialItem, onBack, onToggleFavorite }) {
  const [selected, setSelected] = useState(initialItem || null)
  const groups = useMemo(() => [
    { key: 'cbt-week-1', label: 'CBT · Week 1', items: items.filter((item) => item.content_type === 'cbt_week_1') },
    { key: 'cbt-intro', label: 'CBT foundations', items: items.filter((item) => item.content_type === 'cbt_intro') },
    { key: 'self-love', label: 'Self-love foundations', items: items.filter((item) => item.content_type === 'self_love_foundation') },
    { key: 'overview', label: 'Positive Intelligence · Begin here', items: items.filter((item) => item.content_type === 'overview') },
    { key: 'foundation', label: 'Positive Intelligence · Foundations', items: items.filter((item) => item.content_type === 'foundation') },
    { key: 'practice', label: 'Positive Intelligence · Guided practice', items: items.filter((item) => item.content_type === 'practice') },
    { key: 'saboteur', label: 'Positive Intelligence · Saboteurs', items: items.filter((item) => item.content_type === 'saboteur') },
    { key: 'sage_power', label: 'Positive Intelligence · Sage powers', items: items.filter((item) => item.content_type === 'sage_power') },
  ], [items])

  if (selected) {
    return (
      <ContentDetail
        item={selected}
        favorite={favorites.has(selected.id)}
        onBack={() => setSelected(null)}
        onToggleFavorite={onToggleFavorite}
      />
    )
  }

  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Home</button>
      </header>
      <p className="eyebrow">Skills library</p>
      <h1 className="library-title">Choose something helpful.</h1>
      <p className="library-intro">Browse the approved CBT, self-love, and Positive Intelligence collection. There is nothing to finish or keep up with.</p>

      {loading && <div className="library-status">Opening the library…</div>}
      {error && <div className="library-status error" role="alert">{error}</div>}

      {!loading && !error && groups.map((group) => group.items.length > 0 && (
        <section className="content-group" key={group.key}>
          <h2>{group.label}</h2>
          <div className="content-list">
            {group.items.map((item) => (
              <button className="content-card" key={item.id} onClick={() => setSelected(item)}>
                <span className={`content-dot ${item.content_type}`} aria-hidden="true" />
                <span className="content-card-copy">
                  <span className="content-card-title">{item.title}</span>
                  <span className="content-card-description">{item.short_description}</span>
                  <span className="content-card-meta">
                    {item.estimated_minutes ? `${item.estimated_minutes} min` : 'Open'}
                    {favorites.has(item.id) && <> · Saved</>}
                  </span>
                </span>
                <Icon name="arrow" size={18} />
              </button>
            ))}
          </div>
        </section>
      ))}
    </main>
  )
}
