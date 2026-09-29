import Icon from './Icon'

const goals = [
  {
    title: 'Learn how to do family history',
    detail: 'Build confidence finding, preserving, and connecting family stories.',
  },
]

export default function Goals({ onBack }) {
  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Home</button>
      </header>

      <div className="art-library-heading goals-heading">
        <span className="art-library-icon" aria-hidden="true"><Icon name="target" size={27} /></span>
        <p className="eyebrow">Goals</p>
        <h1 className="library-title">What I am working toward.</h1>
        <p className="library-intro">Small steps count. This space can grow as new goals become clear.</p>
      </div>

      <section className="goals-list" aria-label="My goals">
        {goals.map((goal) => (
          <article className="goal-card" key={goal.title}>
            <span className="goal-card-icon" aria-hidden="true"><Icon name="target" size={22} /></span>
            <div>
              <h2>{goal.title}</h2>
              <p>{goal.detail}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}
