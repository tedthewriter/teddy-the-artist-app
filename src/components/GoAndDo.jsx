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

const schedule = {
  daily: ['Read scriptures', 'Make art', 'Move'],
  weekly: ['Go to the temple', 'Do family history work'],
}

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

      <section className="go-and-do-section" aria-labelledby="schedule-heading">
        <h2 id="schedule-heading">Schedule</h2>
        <p>Gentle anchors to return to during the day and week.</p>
        <h3>Daily</h3>
        <div className="art-ideas">
          {schedule.daily.map((item) => (
            <article className="art-idea" key={item}>
              <span className="schedule-item-icon" aria-hidden="true"><Icon name="check" size={16} /></span>
              <span>{item}</span>
            </article>
          ))}
        </div>
        <h3>Weekly</h3>
        <div className="art-ideas">
          {schedule.weekly.map((item) => (
            <article className="art-idea" key={item}>
              <span className="schedule-item-icon" aria-hidden="true"><Icon name="check" size={16} /></span>
              <span>{item}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="go-and-do-section" aria-labelledby="options-heading">
        <h2 id="options-heading">Options</h2>
        <p>Choose one good thing that feels helpful today.</p>
        <div className="art-ideas" aria-label="Go and Do options">
        {ideas.map((idea) => (
          <article className="art-idea" key={idea}>
            <img className="go-and-do-icon" src={`${import.meta.env.BASE_URL}images/jenni-thinking-portrait-v2.png`} alt="" />
            <span>{idea}</span>
          </article>
        ))}
        </div>
      </section>
    </main>
  )
}
