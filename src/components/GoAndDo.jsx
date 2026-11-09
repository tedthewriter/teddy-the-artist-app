import Icon from './Icon'
import { ChecklistNote, ChecklistRow, useDailyChecklist } from './DailyChecklist'

// Gospel Library's officially documented app-opening URL scheme.
const gospelLibraryUrl = 'gospellibrary://'
// FamilySearch's iOS app-site association includes the exact /tree path.
const familyTreeUrl = 'https://www.familysearch.org/tree'

const ideas = [
  'Journal',
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

export default function GoAndDo({ userId, onBack, onOpenArt, onOpenBingo }) {
  const checklist = useDailyChecklist(userId, 'go-and-do')
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
          {schedule.daily.map(item => (
            <ChecklistRow key={item} title={item} checklist={checklist}
              href={item === 'Read scriptures' ? gospelLibraryUrl : undefined}
              onClick={item === 'Make art' ? onOpenArt : item === 'Play bingo' ? onOpenBingo : undefined}>
              <span className="schedule-item-icon" aria-hidden="true"><Icon name={item === 'Make art' ? 'palette' : item === 'Read scriptures' ? 'journal' : item === 'Play bingo' ? 'mindfulness' : 'check'} size={19} /></span>
            </ChecklistRow>
          ))}
        </div>
        <h3>Weekly</h3>
        <div className="art-ideas">
          {schedule.weekly.map(item => (
            <ChecklistRow key={item} title={item} checklist={checklist} href={item === 'Do family history work' ? familyTreeUrl : undefined}>
              <span className="schedule-item-icon" aria-hidden="true"><Icon name="people" size={19} /></span>
            </ChecklistRow>
          ))}
        </div>
        <p className="support-note">“Do family history work” opens FamilySearch Family Tree. Install the Family Tree app to open it there; your phone may open the website instead depending on its link settings.</p>
        <p className="support-note">“Read scriptures” opens Gospel Library. The Gospel Library app needs to be installed on this phone.</p>
      </section>

      <section className="go-and-do-section" aria-labelledby="options-heading">
        <h2 id="options-heading">Options</h2>
        <p>Choose one good thing that feels helpful today.</p>
        <div className="art-ideas" aria-label="Go and Do options">
        {ideas.map((idea) => (
          <ChecklistRow key={idea} title={idea} checklist={checklist}>
            <img className="go-and-do-icon" src={`${import.meta.env.BASE_URL}images/jenni-thinking-portrait-v2.png`} alt="" />
          </ChecklistRow>
        ))}
        </div>
      </section>
      <ChecklistNote error={checklist.error} />
    </main>
  )
}
