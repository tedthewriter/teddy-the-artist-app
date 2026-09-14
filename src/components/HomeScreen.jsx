import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon'
import SkillsLibrary from './SkillsLibrary'
import { supabase } from '../lib/supabase'
import { affirmation, dailyPlan, pathways } from '../data/homeContent'

const dismissKey = () => `teddy-plan-dismissed-${new Date().toISOString().slice(0, 10)}`

export default function HomeScreen({ userId, onSignOut }) {
  const [planVisible, setPlanVisible] = useState(() => localStorage.getItem(dismissKey()) !== 'true')
  const [favorite, setFavorite] = useState(false)
  const [view, setView] = useState('home')
  const [initialItem, setInitialItem] = useState(null)
  const [content, setContent] = useState([])
  const [favorites, setFavorites] = useState(new Set())
  const [contentState, setContentState] = useState({ loading: Boolean(userId), error: '' })
  const [notice, setNotice] = useState('')
  const today = useMemo(
    () => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()),
    [],
  )

  useEffect(() => {
    let active = true

    async function loadLibrary() {
      if (!supabase || !userId) return
      setContentState({ loading: true, error: '' })

      const [contentResult, favoritesResult] = await Promise.all([
        supabase
          .from('content_items')
          .select('id, slug, category, framework, content_type, title, short_description, body, reflection_prompt, faith_reflection, source_title, estimated_minutes, energy_level, sort_order')
          .eq('approved', true)
          .eq('active', true)
          .order('sort_order'),
        supabase.from('user_favorites').select('content_id').eq('user_id', userId),
      ])

      if (!active) return
      if (contentResult.error || favoritesResult.error) {
        setContentState({ loading: false, error: 'The skills library could not be opened. Please try again.' })
        return
      }

      setContent(contentResult.data || [])
      setFavorites(new Set((favoritesResult.data || []).map((entry) => entry.content_id)))
      setContentState({ loading: false, error: '' })
    }

    loadLibrary()
    return () => { active = false }
  }, [userId])

  async function toggleContentFavorite(contentId) {
    if (!supabase || !userId) return
    const isFavorite = favorites.has(contentId)
    const result = isFavorite
      ? await supabase.from('user_favorites').delete().eq('user_id', userId).eq('content_id', contentId)
      : await supabase.from('user_favorites').insert({ user_id: userId, content_id: contentId })

    if (result.error) {
      setNotice('That item could not be saved. Please try again.')
      return
    }

    setFavorites((current) => {
      const next = new Set(current)
      if (isFavorite) next.delete(contentId)
      else next.add(contentId)
      return next
    })
  }

  function openSkills(item = null) {
    setInitialItem(item)
    setView('skills')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function choosePath(pathway) {
    setNotice('')
    if (pathway.title === 'Skills') {
      openSkills()
      return
    }

    if (pathway.title === 'Surprise Me') {
      if (content.length === 0) {
        setNotice(contentState.loading ? 'The library is still opening…' : 'There is not an available activity yet.')
        return
      }
      openSkills(content[Math.floor(Math.random() * content.length)])
      return
    }

    setNotice(`${pathway.title} is ready for its content in the next build.`)
  }

  if (view === 'skills') {
    return (
      <SkillsLibrary
        items={content}
        favorites={favorites}
        loading={contentState.loading}
        error={contentState.error}
        initialItem={initialItem}
        onBack={() => { setView('home'); setInitialItem(null) }}
        onToggleFavorite={toggleContentFavorite}
      />
    )
  }

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
        ><Icon name="user" size={21} /></button>
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
            <button className="soft-button" onClick={() => setNotice('Affirmation audio will appear here after the recordings are added.')}><Icon name="play" size={18} /> Listen</button>
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
          <button className="primary-button" onClick={() => setNotice('Begin with whichever part of the plan feels useful. Nothing needs to be completed in order.')}>
            Start today’s plan <Icon name="arrow" size={18} />
          </button>
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
            <button className={`pathway-card ${pathway.tone}`} key={pathway.title} onClick={() => choosePath(pathway)}>
              <span className="pathway-icon"><Icon name={pathway.icon} size={25} /></span>
              <span className="pathway-title">{pathway.title}</span>
              <span className="pathway-subtitle">{pathway.subtitle}</span>
            </button>
          ))}
        </div>
      </section>

      {notice && <p className="home-notice" role="status">{notice}</p>}
      <p className="support-note">Choose what feels useful. You can always come back later.</p>
    </main>
  )
}
