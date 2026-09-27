import Icon from './Icon'

const ideas = [
  'Go for a walk and try to get 5,000 steps',
  'Go to the temple this week',
  'Journal',
  'Read scriptures',
  'Take a nap',
  'Get out and do something fun',
  'Listen to your affirmations',
  'Listen to music on Spotify',
  'Listen to a podcast on Spotify',
  'Service',
  'Mountain Mamas',
]

export default function GoAndDo({ onBack }) {
  return (
    <main className="app-shell library-shell go-and-do-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Home</button>
      </header>

      <div className="art-library-heading go-and-do-heading">
        <span className="art-library-icon" aria-hidden="true"><Icon name="sun" size={27} /></span>
        <p className="eyebrow">Go and Do</p>
        <h1 className="library-title">Choose one good thing.</h1>
        <p className="library-intro">Choose what feels helpful today—something that lets you move, rest, connect, or enjoy the day. One small thing counts.</p>
      </div>

      <section className="art-ideas" aria-label="Go and Do ideas">
        {ideas.map((idea) => (
          <article className="art-idea" key={idea}>
            <img className="go-and-do-icon" src="/images/jenni-thinking-icon.png" alt="" />
            <span>{idea}</span>
          </article>
        ))}
      </section>
    </main>
  )
}
