import { useMemo, useState } from 'react'
import Icon from './Icon'
import { affirmation, dailyPlan, pathways } from '../data/homeContent'

const dismissKey = () => `teddy-plan-dismissed-${new Date().toISOString().slice(0, 10)}`

export default function HomeScreen({ onSignOut }) {
  const [planVisible, setPlanVisible] = useState(() => localStorage.getItem(dismissKey()) !== 'true')
  const [favorite, setFavorite] = useState(false)
  const today = useMemo(
    () => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()),
    [],
  )

  function hidePlan() {
    localStorage.setItem(dismissKey(), 'true')
    setPlanVisible(false)
  }

  function showPlan() {
    localStorage.removeItem(dismissKey())
    setPlanVisible(true)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="date-line">{today}</p>
          <h1>Welcome back</h1>
        </div>
        <button
          className="avatar-button"
          aria-label={onSignOut ? 'Sign out' : 'Preview profile'}
          title={onSignOut ? 'Sign out' : 'Profile'}
          onClick={onSignOut}
        >J</button>
      </header>

      <section className="affirmation-card" aria-labelledby="affirmation-title">
        <div className="affirmation-art" aria-hidden="true">
          <span className="sun-shape" />
          <span className="paint-stroke stroke-one" />
          <span className="paint-stroke stroke-two" />
          <span className="affirmation-number">{affirmation.number}</span>
        </div>
        <div className="affirmation-content">
          <p className="eyebrow" id="affirmation-title">Today’s affirmation</p>
          <p className="affirmation-text">{affirmation.text}</p>
          <div className="affirmation-actions">
            <button className="soft-button"><Icon name="play" size={18} /> Listen</button>
            <button
              className={`icon-button ${favorite ? 'is-favorite' : ''}`}
              aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={favorite}
              onClick={() => setFavorite((value) => !value)}
            >
              <Icon name="bookmark" size={19} />
            </button>
          </div>
        </div>
      </section>

      {planVisible ? (
        <section className="plan-card" aria-labelledby="plan-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A gentle suggestion</p>
              <h2 id="plan-title">Today’s plan</h2>
            </div>
            <button className="icon-button quiet" aria-label="Close today’s plan" onClick={hidePlan}><Icon name="close" size={19} /></button>
          </div>
          <div className="plan-list">
            {dailyPlan.map((item) => (
              <div className="plan-item" key={item.label}>
                <span className="plan-icon"><Icon name={item.icon} size={19} /></span>
                <div><p>{item.label}</p><span>{item.title}</span></div>
              </div>
            ))}
          </div>
          <button className="primary-button">Start today’s plan <Icon name="arrow" size={18} /></button>
          <button className="text-button" onClick={hidePlan}>Not right now</button>
        </section>
      ) : (
        <button className="reopen-plan" onClick={showPlan}><Icon name="spark" size={18} /> View today’s suggested plan</button>
      )}

      <section className="pathway-section" aria-labelledby="pathway-title">
        <p className="eyebrow">Choose your own path</p>
        <h2 id="pathway-title">What do you want to do today?</h2>
        <div className="pathway-grid">
          {pathways.map((pathway) => (
            <button className={`pathway-card ${pathway.tone}`} key={pathway.title}>
              <span className="pathway-icon"><Icon name={pathway.icon} size={25} /></span>
              <span className="pathway-title">{pathway.title}</span>
              <span className="pathway-subtitle">{pathway.subtitle}</span>
            </button>
          ))}
        </div>
      </section>

      <p className="support-note">Choose what feels useful. You can always come back later.</p>
    </main>
  )
}
