import { useState } from 'react'
import Icon from './Icon'
import MindfulnessBingo from './MindfulnessBingo'

import { mindfulnessPractices as practices } from '../data/mindfulnessPractices'

function PracticeDetail({ practice, onBack }) {
  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Mindfulness</button>
      </header>

      <article className="content-detail-card">
        <p className="content-kind">Mindfulness & regulation · {practice.minutes}</p>
        <h1>{practice.title}</h1>
        <p className="detail-lead">{practice.description}</p>

        <section className="detail-section">
          <h3>Use this when</h3>
          <p>{practice.when}</p>
        </section>
        <section className="detail-section">
          <h3>Why it can help</h3>
          <p>{practice.why}</p>
        </section>
        <section className="detail-section">
          <h3>Try it now</h3>
          <ol>{practice.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </section>
        {practice.safety && <p className="gentle-callout">{practice.safety}</p>}

        <footer className="source-note">
          <span>Choose a practice that feels manageable. You can stop or switch at any time.</span>
        </footer>
      </article>
    </main>
  )
}

export default function MindfulnessLibrary({ onBack, userId }) {
  const [selected, setSelected] = useState(null)
  const [bingo, setBingo] = useState(false)

  if (bingo) return <MindfulnessBingo key={userId || 'preview'} userId={userId} onBack={() => setBingo(false)} />

  if (selected) return <PracticeDetail practice={selected} onBack={() => setSelected(null)} />

  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Home</button>
      </header>
      <p className="eyebrow">Mindfulness</p>
      <h1 className="library-title">Settle your system.</h1>
      <p className="library-intro">Try mindfulness bingo, or choose from ten short practices for grounding, attention, and gentle nervous-system regulation.</p>

      <button className="content-card bingo-entry" onClick={() => setBingo(true)}>
        <span className="bingo-entry-icon" aria-hidden="true"><Icon name="mindfulness" size={25} /></span>
        <span className="content-card-copy"><span className="content-card-title">Mindfulness bingo</span><span className="content-card-description">Explore the practices below through a playful bingo card. Every square includes the existing instructions.</span><span className="content-card-meta">10 familiar practices · 24 squares · Your own pace</span></span>
        <Icon name="arrow" size={18} />
      </button>

      <div className="content-list" aria-label="Mindfulness practices">
        {practices.map((practice) => (
          <button className="content-card" key={practice.title} onClick={() => setSelected(practice)}>
            <span className="content-dot" aria-hidden="true" />
            <span className="content-card-copy">
              <span className="content-card-title">{practice.title}</span>
              <span className="content-card-description">{practice.description}</span>
              <span className="content-card-meta">{practice.minutes}</span>
            </span>
            <Icon name="arrow" size={18} />
          </button>
        ))}
      </div>

      <p className="support-note">These practices are optional self-support tools, not a replacement for professional care. Stop any practice that makes you feel worse, and reach out for support when needed.</p>
    </main>
  )
}
