import { useState } from 'react'
import Icon from './Icon'

export default function AlignmentsLibrary({
  items,
  loading,
  error,
  onBack,
}) {
  const [selected, setSelected] = useState(null)

  function openAlignment(item) {
    setSelected(item)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goBack() {
    if (selected) {
      setSelected(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    onBack()
  }

  if (selected) {
    const body = selected.body || {}
    return (
      <main className="app-shell library-shell alignment-shell">
        <header className="library-topbar">
          <button className="back-button" type="button" onClick={goBack}>
            <Icon name="back" size={18} /> Alignments
          </button>
        </header>

        <article className="alignment-detail-card">
          <div className="alignment-detail-heading">
            <span className="alignment-mark"><Icon name={body.icon || 'compass'} size={27} /></span>
            <p className="eyebrow">{body.short_name || 'Alignment'}</p>
            <h1>{selected.title}</h1>
            <p>{selected.short_description}</p>
          </div>

          <aside className="alignment-safety-card">
            <strong>Choose what feels safe</strong>
            <p>{body.safety_note}</p>
          </aside>

          <div className="alignment-steps">
            {(body.steps || []).map((step, index) => (
              <section className="alignment-step" key={`${step.title}-${index}`}>
                <span className="alignment-step-number">{index + 1}</span>
                <div>
                  <h2>{step.title}</h2>
                  {step.intro && <p>{step.intro}</p>}
                  {Array.isArray(step.items) && (
                    <ul>{step.items.map((line, lineIndex) => <li key={`${line}-${lineIndex}`}>{line}</li>)}</ul>
                  )}
                  {step.statement && <blockquote>{step.statement}</blockquote>}
                </div>
              </section>
            ))}
          </div>

          <p className="alignment-support-note">If your distress increases or you do not feel safe, stop and reach out for help.</p>
        </article>
      </main>
    )
  }

  return (
    <main className="app-shell library-shell alignment-shell">
      <header className="library-topbar">
        <button className="back-button" type="button" onClick={goBack}><Icon name="back" size={18} /> Home</button>
      </header>

      <section className="library-heading">
        <p className="eyebrow">Guided practices</p>
        <h1>Alignments</h1>
        <p>Choose the practice that fits what you are carrying right now, then follow the guide at your own pace.</p>
      </section>

      {loading && <p className="library-message">Opening the alignments…</p>}
      {error && <p className="library-message error" role="alert">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="library-message">The alignment practices are not available yet.</p>
      )}

      <div className="alignment-menu">
        {items.map((item, index) => (
          <button className={`alignment-menu-card ${index % 2 === 0 ? 'gold' : 'sage'}`} type="button" key={item.id} onClick={() => openAlignment(item)}>
            <span className="alignment-menu-icon"><Icon name={item.body?.icon || 'compass'} size={27} /></span>
            <span className="alignment-menu-copy">
              <span>{item.body?.short_name}</span>
              <strong>{item.title}</strong>
              <small>{item.short_description}</small>
            </span>
            <Icon name="arrow" size={19} />
          </button>
        ))}
      </div>

      <p className="support-note">These practices support reflection and regulation; they are not a substitute for professional care.</p>
    </main>
  )
}
