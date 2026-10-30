import Icon from './Icon'

// Gospel Library's officially documented app-opening URL scheme.
const gospelLibraryUrl = 'gospellibrary://'
// FamilySearch's iOS app-site association includes the exact /tree path.
const familyTreeUrl = 'https://www.familysearch.org/tree'

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
  daily: ['Read scriptures', 'Make art', 'Move', 'Play bingo'],
  weekly: ['Go to the temple', 'Do family history work'],
}

export default function GoAndDo({ onBack, onOpenArt, onOpenBingo }) {
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
          {schedule.daily.map((item) => item === 'Read scriptures' ? (
            <a className="art-idea schedule-art-link" key={item} href={gospelLibraryUrl} title="Open Gospel Library">
              <span className="schedule-item-icon" aria-hidden="true"><Icon name="journal" size={19} /></span>
              <span>{item}</span>
              <span className="schedule-art-arrow" aria-hidden="true"><Icon name="arrow" size={18} /></span>
            </a>
          ) : item === 'Make art' || item === 'Play bingo' ? (
            <button type="button" className="art-idea schedule-art-link" key={item} onClick={item === 'Make art' ? onOpenArt : onOpenBingo}>
              <span className={item === 'Make art' ? 'art-idea-palette' : 'schedule-item-icon'} aria-hidden="true"><Icon name={item === 'Make art' ? 'palette' : 'mindfulness'} size={19} /></span>
              <span>{item}</span>
              <span className="schedule-art-arrow" aria-hidden="true"><Icon name="arrow" size={18} /></span>
            </button>
          ) : (
            <article className="art-idea" key={item}>
              <span className="schedule-item-icon" aria-hidden="true"><Icon name="check" size={16} /></span>
              <span>{item}</span>
            </article>
          ))}
        </div>
        <h3>Weekly</h3>
        <div className="art-ideas">
          {schedule.weekly.map((item) => item === 'Do family history work' ? (
            <a className="art-idea schedule-art-link" key={item} href={familyTreeUrl} title="Open FamilySearch Family Tree">
              <span className="schedule-item-icon" aria-hidden="true"><Icon name="people" size={19} /></span>
              <span>{item}</span>
              <span className="schedule-art-arrow" aria-hidden="true"><Icon name="arrow" size={18} /></span>
            </a>
          ) : (
            <article className="art-idea" key={item}>
              <span className="schedule-item-icon" aria-hidden="true"><Icon name="check" size={16} /></span>
              <span>{item}</span>
            </article>
          ))}
        </div>
        <p className="support-note">“Do family history work” opens FamilySearch Family Tree. Install the Family Tree app to open it there; your phone may open the website instead depending on its link settings.</p>
      </section>

      <section className="go-and-do-section" aria-labelledby="options-heading">
        <h2 id="options-heading">Options</h2>
        <p>Choose one good thing that feels helpful today.</p>
        <div className="art-ideas" aria-label="Go and Do options">
        {ideas.map((idea) => {
          const isScripture = idea === 'Read scriptures'
          const Row = isScripture ? 'a' : 'article'
          return (
          <Row className={`art-idea${isScripture ? ' schedule-art-link' : ''}`} key={idea} href={isScripture ? gospelLibraryUrl : undefined} title={isScripture ? 'Open Gospel Library' : undefined}>
            <img className="go-and-do-icon" src={`${import.meta.env.BASE_URL}images/jenni-thinking-portrait-v2.png`} alt="" />
            <span>{idea}</span>
            {isScripture && <span className="schedule-art-arrow" aria-hidden="true"><Icon name="arrow" size={18} /></span>}
          </Row>
          )
        })}
        </div>
        <p className="support-note">“Read scriptures” opens Gospel Library. The Gospel Library app needs to be installed on this phone.</p>
      </section>
    </main>
  )
}
