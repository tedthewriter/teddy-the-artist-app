import Icon from './Icon'

export default function GoalsVision({ onBack }) {
  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" type="button" onClick={onBack}>
          <Icon name="back" size={18} /> Home
        </button>
      </header>

      <section>
        <p className="eyebrow">Keep the destination in view</p>
        <h1 className="library-title">Goals &amp; Vision</h1>
        <p className="library-intro">A place to return to the vision board and the goals that matter most.</p>
      </section>

      <article className="content-detail-card goals-vision-placeholder">
        <span className="category-heading-icon peach"><Icon name="vision" size={27} /></span>
        <p className="content-kind">Coming soon</p>
        <h1>Your vision board and goals</h1>
        <p className="detail-lead">The completed vision board and written goals will appear here after they are added.</p>
        <div className="gentle-callout">Come back anytime you want to remember what you are creating and moving toward.</div>
      </article>
    </main>
  )
}
