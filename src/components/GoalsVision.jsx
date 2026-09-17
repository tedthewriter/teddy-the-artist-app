import Icon from './Icon'

const goals = [
  { title: 'Teach art lessons', detail: 'Help children and adults discover the joy of creating.', icon: 'people', tone: 'teal' },
  { title: 'Paint the Savior', detail: 'Create faith-filled work and grow ready for Church commissions.', icon: 'heart', tone: 'gold' },
  { title: 'Have work in the Springville Museum', detail: 'Prepare, submit, and let the work be considered.', icon: 'vision', tone: 'blue', link: 'https://www.smofa.org/40th-annual-spiritual-and-religious-show-for-artists', linkLabel: 'Exhibition information' },
  { title: 'Have work in a gallery or show', detail: 'Share the work. Connect with viewers. Make an impact.', icon: 'star', tone: 'plum' },
  { title: 'Do Spring City plein air', detail: 'Paint from life and join the plein-air community.', icon: 'palette', tone: 'olive' },
  { title: 'Enter the Church International Art Competition', detail: 'Develop meaningful sacred work for the next competition in 2027.', icon: 'compass', tone: 'rust' },
  { title: 'Get work with Havenlight', detail: 'Build sacred artwork ready for professional licensing.', icon: 'vision', tone: 'teal', link: 'https://havenlight.com/pages/copy-of-havenlight-licensing', linkLabel: 'Licensing information' },
  { title: 'Celebrate God’s creating', detail: 'Help people notice the Creator through people, landscape, light, and the natural world.', icon: 'spark', tone: 'gold' },
  { title: 'Build a social presence', detail: 'Show work, share demos, teach process, and build community.', icon: 'people', tone: 'plum' },
  { title: 'France painting trip', detail: 'Create, be inspired, and celebrate our 30th anniversary together.', icon: 'compass', tone: 'blue' },
  { title: 'Get an MFA', detail: 'Deepen skill and knowledge when the time is right.', icon: 'journal', tone: 'olive' },
]

export default function GoalsVision({ onBack }) {
  return (
    <main className="app-shell library-shell vision-page">
      <header className="library-header">
        <button className="back-button" type="button" onClick={onBack}>
          <Icon name="back" size={18} /> Home
        </button>
      </header>

      <section className="vision-hero">
        <span className="vision-hero-brushes" aria-hidden="true"><Icon name="palette" size={31} /></span>
        <p className="vision-hero-kicker">Dream big.</p>
        <h1>Create with purpose.</h1>
        <p className="vision-hero-motto">Faith. Art. Impact.</p>
        <p className="vision-hero-caption">A vision for my art journey</p>
      </section>

      <section className="vision-infographic" aria-label="My art vision">
        {goals.map((goal, index) => (
          <article className={`vision-tile ${goal.tone}`} key={goal.title}>
            <div className="vision-tile-top">
              <span className="vision-goal-number">{index + 1}</span>
              <span className="vision-tile-icon"><Icon name={goal.icon} size={21} /></span>
            </div>
            <h2>{goal.title}</h2>
            <p>{goal.detail}</p>
            {goal.link && <a href={goal.link} target="_blank" rel="noreferrer">{goal.linkLabel} <Icon name="arrow" size={14} /></a>}
          </article>
        ))}
      </section>

      <section className="vision-scripture-strip">
        <Icon name="spark" size={20} />
        <p>“All things denote there is a God.” <span>Alma 30:44</span></p>
      </section>

      <p className="vision-closing">Stay faithful. Keep creating. The best is yet to come.</p>
      <p className="vision-subclosing">With faith, hard work, and creativity, I can do all things.</p>
    </main>
  )
}
