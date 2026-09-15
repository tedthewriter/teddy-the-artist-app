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

function frameworkKey(item) {
  if (item.framework === 'cbt_7_weeks' || item.content_type.startsWith('cbt_')) return 'cbt'
  if (item.framework === 'positive_intelligence') return 'positive-intelligence'
  if (item.framework === 'self_love' || item.content_type.startsWith('self_love')) return 'self-love'
  if (item.framework === 'dbt' || item.content_type.startsWith('dbt')) return 'dbt'
  return null
}

function LessonList({ items, favorites, onSelect }) {
  return (
    <div className="content-list">
      {items.map((item) => (
        <button className="content-card" key={item.id} onClick={() => onSelect(item)}>
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
  )
}

export default function SkillsLibrary({ items, favorites, loading, error, initialItem, onBack, onToggleFavorite }) {
  const [selected, setSelected] = useState(initialItem || null)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(initialItem ? frameworkKey(initialItem) : null)
  const categories = useMemo(() => {
    const cbtItems = items.filter((item) => frameworkKey(item) === 'cbt')
    const positiveIntelligenceItems = items.filter((item) => frameworkKey(item) === 'positive-intelligence')
    const selfLoveItems = items.filter((item) => frameworkKey(item) === 'self-love')
    const dbtItems = items.filter((item) => frameworkKey(item) === 'dbt')

    return [
      {
        key: 'cbt', label: 'CBT', description: 'Work with thoughts, feelings, and actions', icon: 'thought', tone: 'sage', items: cbtItems,
        sections: [
          { key: 'cbt-week-1', label: 'Week 1', items: cbtItems.filter((item) => item.content_type === 'cbt_week_1') },
          { key: 'cbt-foundations', label: 'Foundations', items: cbtItems.filter((item) => item.content_type === 'cbt_intro') },
        ],
      },
      {
        key: 'positive-intelligence', label: 'Positive Intelligence', description: 'Notice Saboteurs and practice Sage responses', icon: 'compass', tone: 'gold', items: positiveIntelligenceItems,
        sections: [
          { key: 'pi-begin', label: 'Begin Here', items: positiveIntelligenceItems.filter((item) => item.content_type === 'overview') },
          { key: 'pi-foundations', label: 'Foundations', items: positiveIntelligenceItems.filter((item) => item.content_type === 'foundation') },
          { key: 'pi-practice', label: 'Guided Practice', items: positiveIntelligenceItems.filter((item) => item.content_type === 'practice') },
          { key: 'pi-saboteurs', label: 'Saboteurs', items: positiveIntelligenceItems.filter((item) => item.content_type === 'saboteur') },
          { key: 'pi-sage-powers', label: 'Sage Powers', items: positiveIntelligenceItems.filter((item) => item.content_type === 'sage_power') },
        ],
      },
      {
        key: 'self-love', label: 'Self-Love', description: 'Practice kindness, care, and self-respect', icon: 'heart', tone: 'rose', items: selfLoveItems,
        sections: [{ key: 'self-love-foundations', label: 'Foundations', items: selfLoveItems }],
      },
      {
        key: 'dbt', label: 'DBT', description: 'Build coping, regulation, and relationship skills', icon: 'toolbox', tone: 'blue', items: dbtItems,
        sections: [{ key: 'dbt-skills', label: 'Skills', items: dbtItems }],
      },
    ]
  }, [items])
  const selectedCategory = categories.find((category) => category.key === selectedCategoryKey)

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

  if (selectedCategory) {
    return (
      <main className="app-shell library-shell">
        <header className="library-header">
          <button className="back-button" onClick={() => setSelectedCategoryKey(null)}><Icon name="back" size={19} /> Skills</button>
        </header>

        <div className={`category-heading-icon ${selectedCategory.tone}`} aria-hidden="true">
          <Icon name={selectedCategory.icon} size={27} />
        </div>
        <p className="eyebrow">Skills library</p>
        <h1 className="library-title">{selectedCategory.label}</h1>
        <p className="library-intro">{selectedCategory.description}. Open whichever lesson feels useful today.</p>

        {selectedCategory.items.length === 0 ? (
          <section className="empty-category-card">
            <span className="skill-category-icon" aria-hidden="true"><Icon name={selectedCategory.icon} size={26} /></span>
            <h2>Content will be added here.</h2>
            <p>This page is ready for approved {selectedCategory.label} lessons and activities when we add them.</p>
          </section>
        ) : selectedCategory.sections.map((section) => section.items.length > 0 && (
          <section className="content-group" key={section.key}>
            <h2>{section.label}</h2>
            <LessonList items={section.items} favorites={favorites} onSelect={setSelected} />
          </section>
        ))}
      </main>
    )
  }

  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Home</button>
      </header>
      <p className="eyebrow">Skills library</p>
      <h1 className="library-title">Choose something helpful.</h1>
      <p className="library-intro">Choose a type of support. Everything related to it is organized together, with nothing to finish or keep up with.</p>

      {loading && <div className="library-status">Opening the library…</div>}
      {error && <div className="library-status error" role="alert">{error}</div>}

      {!loading && !error && (
        <div className="skill-category-grid">
          {categories.map((category) => (
            <button
              className={`skill-category-card ${category.tone}`}
              key={category.key}
              onClick={() => setSelectedCategoryKey(category.key)}
            >
              <span className="skill-category-icon" aria-hidden="true"><Icon name={category.icon} size={26} /></span>
              <span className="skill-category-title">{category.label}</span>
              <span className="skill-category-description">{category.description}</span>
              <span className="skill-category-count">{category.items.length > 0 ? `${category.items.length} ${category.items.length === 1 ? 'lesson' : 'lessons'}` : 'Ready for content'}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}
