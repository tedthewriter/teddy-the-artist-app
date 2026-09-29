import Icon from './Icon'

const schedule = {
  daily: [
    'Read scriptures',
    'Make art',
    'Move',
  ],
  weekly: [
    'Go to the temple',
    'Do family history work',
  ],
}

function ScheduleGroup({ title, intro, items }) {
  return (
    <section className="schedule-group" aria-label={title}>
      <h2>{title}</h2>
      <p className="schedule-group-intro">{intro}</p>
      <div className="art-ideas">
        {items.map((item) => (
          <article className="art-idea" key={item}>
            <span className="schedule-item-icon" aria-hidden="true"><Icon name="check" size={16} /></span>
            <span>{item}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function MySchedule({ onBack }) {
  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Home</button>
      </header>

      <div className="art-library-heading schedule-heading">
        <span className="art-library-icon" aria-hidden="true"><Icon name="calendar" size={27} /></span>
        <p className="eyebrow">My Schedule</p>
        <h1 className="library-title">A gentle rhythm for the week.</h1>
        <p className="library-intro">These are anchors, not a test. Return to what matters when you can.</p>
      </div>

      <ScheduleGroup title="Daily" intro="A few things to come back to each day." items={schedule.daily} />
      <ScheduleGroup title="Weekly" intro="A few things to make space for during the week." items={schedule.weekly} />
    </main>
  )
}
