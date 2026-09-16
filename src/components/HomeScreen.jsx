import { useEffect, useMemo, useState } from 'react'
import Icon from './Icon'
import SkillsLibrary from './SkillsLibrary'
import AffirmationsLibrary from './AffirmationsLibrary'
import GameAdventure from './GameAdventure'
import { supabase } from '../lib/supabase'
import { dailyPlan, pathways } from '../data/homeContent'

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dateNumber(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000)
}

const dismissKey = () => `teddy-plan-dismissed-${localDateKey()}`

function mergePlanWithDefaults(planItems) {
  const savedItems = new Map(
    (Array.isArray(planItems) ? planItems : []).map((item) => [item.label, item]),
  )

  return dailyPlan.map((defaultItem) => ({
    ...defaultItem,
    ...(savedItems.get(defaultItem.label) || {}),
  }))
}

export default function HomeScreen({ userId, onSignOut }) {
  const [planVisible, setPlanVisible] = useState(() => localStorage.getItem(dismissKey()) !== 'true')
  const [view, setView] = useState('home')
  const [initialItem, setInitialItem] = useState(null)
  const [content, setContent] = useState([])
  const [favorites, setFavorites] = useState(new Set())
  const [completedItems, setCompletedItems] = useState(new Set())
  const [contentState, setContentState] = useState({ loading: Boolean(userId), error: '' })
  const [todayPlan, setTodayPlan] = useState(null)
  const [planState, setPlanState] = useState({ loading: Boolean(userId), error: '' })
  const [visionBoardChatUrl, setVisionBoardChatUrl] = useState('')
  const [imageUrls, setImageUrls] = useState({})
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

      const [contentResult, favoritesResult, preferenceResult, completionsResult] = await Promise.all([
        supabase
          .from('content_items')
          .select('id, slug, category, framework, content_type, title, short_description, body, reflection_prompt, faith_reflection, source_title, estimated_minutes, energy_level, sort_order, affirmation_number, asset_path')
          .eq('approved', true)
          .eq('active', true)
          .order('sort_order'),
        supabase.from('user_favorites').select('content_id').eq('user_id', userId),
        supabase
          .from('user_preferences')
          .select('vision_board_chat_url')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_content_completions')
          .select('content_id')
          .eq('user_id', userId),
      ])

      if (!active) return
      if (contentResult.error || favoritesResult.error) {
        setContentState({ loading: false, error: 'The skills library could not be opened. Please try again.' })
        return
      }

      setContent(contentResult.data || [])
      setFavorites(new Set((favoritesResult.data || []).map((entry) => entry.content_id)))
      if (!completionsResult.error) setCompletedItems(new Set((completionsResult.data || []).map((entry) => entry.content_id)))
      if (!preferenceResult.error) setVisionBoardChatUrl(preferenceResult.data?.vision_board_chat_url || '')
      setContentState({ loading: false, error: '' })
    }

    loadLibrary()
    return () => { active = false }
  }, [userId])

  const affirmationItems = useMemo(
    () => content.filter((item) => item.content_type === 'affirmation').sort((a, b) => a.affirmation_number - b.affirmation_number),
    [content],
  )
  const skillItems = useMemo(() => content.filter((item) => item.content_type !== 'affirmation'), [content])
  const weekOneItems = useMemo(
    () => content
      .filter((item) => item.content_type === 'cbt_week_1')
      .sort((a, b) => Number(a.body?.day_number || 0) - Number(b.body?.day_number || 0)),
    [content],
  )
  const dailyAffirmation = useMemo(() => {
    if (!affirmationItems.length) return null
    const now = new Date()
    const dayNumber = Math.floor(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 86400000)
    return affirmationItems[dayNumber % affirmationItems.length]
  }, [affirmationItems])

  useEffect(() => {
    let active = true

    async function loadTodayPlan() {
      if (!supabase || !userId || weekOneItems.length === 0) return
      setPlanState({ loading: true, error: '' })
      const planDate = localDateKey()

      const { data: existing, error: existingError } = await supabase
        .from('daily_plans')
        .select('id, plan_date, plan_items, dismissed_at')
        .eq('user_id', userId)
        .eq('plan_date', planDate)
        .maybeSingle()

      if (!active) return
      if (existingError) {
        setPlanState({ loading: false, error: 'Today’s CBT lesson could not be opened.' })
        return
      }

      if (existing) {
        setTodayPlan(existing)
        setPlanState({ loading: false, error: '' })
        return
      }

      const { data: priorPlans, error: priorError } = await supabase
        .from('daily_plans')
        .select('plan_date, plan_items')
        .eq('user_id', userId)
        .lte('plan_date', planDate)
        .order('plan_date', { ascending: true })

      if (!active) return
      if (priorError) {
        setPlanState({ loading: false, error: 'Today’s CBT lesson could not be opened.' })
        return
      }

      const weekOnePlans = (priorPlans || []).filter((plan) =>
        Array.isArray(plan.plan_items)
        && plan.plan_items.some((item) => item.cbt_week === 1),
      )
      const weekStart = weekOnePlans[0]?.plan_date || planDate
      const cbtDay = Math.min(7, Math.max(1, dateNumber(planDate) - dateNumber(weekStart) + 1))
      const lesson = weekOneItems.find((item) => Number(item.body?.day_number) === cbtDay) || weekOneItems[0]
      const planItems = dailyPlan.map((item) => item.label === 'CBT'
        ? { ...item, title: lesson.title, content_id: lesson.id, cbt_week: 1, cbt_day: cbtDay }
        : item)

      const { data: created, error: createError } = await supabase
        .from('daily_plans')
        .upsert({ user_id: userId, plan_date: planDate, plan_items: planItems }, { onConflict: 'user_id,plan_date' })
        .select('id, plan_date, plan_items, dismissed_at')
        .single()

      if (!active) return
      if (createError) {
        setPlanState({ loading: false, error: 'Today’s CBT lesson could not be saved.' })
        return
      }

      setTodayPlan(created)
      setPlanState({ loading: false, error: '' })
    }

    loadTodayPlan()
    return () => { active = false }
  }, [userId, weekOneItems])

  const planItemsForToday = mergePlanWithDefaults(todayPlan?.plan_items)
  const dailyCbtPlanItem = planItemsForToday.find((item) => item.label === 'CBT')
  const dailyCbtLesson = dailyCbtPlanItem?.content_id
    ? weekOneItems.find((item) => item.id === dailyCbtPlanItem.content_id)
    : null

  async function loadAffirmationImages() {
    if (!supabase || affirmationItems.length === 0) return
    const paths = affirmationItems.map((item) => item.asset_path).filter(Boolean)
    const { data, error: imageError } = await supabase.storage.from('affirmation-pins').createSignedUrls(paths, 3600)
    if (imageError) return
    setImageUrls(Object.fromEntries((data || []).filter((entry) => entry.signedUrl).map((entry) => [entry.path, entry.signedUrl])))
  }

  useEffect(() => { loadAffirmationImages() }, [affirmationItems])

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

  async function toggleContentComplete(contentId) {
    if (!supabase || !userId) return false
    const isCompleted = completedItems.has(contentId)
    const result = isCompleted
      ? await supabase.from('user_content_completions').delete().eq('user_id', userId).eq('content_id', contentId)
      : await supabase.from('user_content_completions').insert({ user_id: userId, content_id: contentId })

    if (result.error) return false

    setCompletedItems((current) => {
      const next = new Set(current)
      if (isCompleted) next.delete(contentId)
      else next.add(contentId)
      return next
    })
    return true
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

    if (pathway.title === 'Affirmations') {
      setView('affirmations')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (pathway.title === 'Games') {
      setView('game')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (pathway.title === 'Surprise Me') {
      if (skillItems.length === 0) {
        setNotice(contentState.loading ? 'The library is still opening…' : 'There is not an available activity yet.')
        return
      }
      openSkills(skillItems[Math.floor(Math.random() * skillItems.length)])
      return
    }

    setNotice(`${pathway.title} is ready for its content in the next build.`)
  }

  if (view === 'skills') {
    return (
      <SkillsLibrary
        items={skillItems}
        favorites={favorites}
        completedItems={completedItems}
        loading={contentState.loading}
        error={contentState.error}
        initialItem={initialItem}
        onBack={() => { setView('home'); setInitialItem(null) }}
        onToggleFavorite={toggleContentFavorite}
        onToggleComplete={toggleContentComplete}
      />
    )
  }

  if (view === 'affirmations') {
    return (
      <AffirmationsLibrary
        items={affirmationItems}
        favorites={favorites}
        loading={contentState.loading}
        error={contentState.error}
        imageUrls={imageUrls}
        onBack={() => setView('home')}
        onToggleFavorite={toggleContentFavorite}
        onImagesChanged={loadAffirmationImages}
      />
    )
  }

  if (view === 'game') {
    return (
      <GameAdventure
        items={skillItems}
        onBack={() => setView('home')}
        onOpenSkill={openSkills}
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

      <section className={`affirmation-card ${dailyAffirmation && imageUrls[dailyAffirmation.asset_path] ? 'has-pin' : ''}`} aria-labelledby="affirmation-title">
        {dailyAffirmation && imageUrls[dailyAffirmation.asset_path] ? (
          <button className="daily-pin-button" onClick={() => setView('affirmations')} aria-label="Open the affirmation collection">
            <img className="daily-pin-image" src={imageUrls[dailyAffirmation.asset_path]} alt={dailyAffirmation.title} />
          </button>
        ) : (
          <div className="affirmation-art" aria-hidden="true">
            <span className="sun-shape" />
            <span className="paint-stroke stroke-one" />
            <span className="paint-stroke stroke-two" />
            <span className="affirmation-number">{dailyAffirmation?.affirmation_number || 1}</span>
          </div>
        )}
        <div className="affirmation-content">
          <p className="eyebrow" id="affirmation-title">Today’s affirmation</p>
          <p className="affirmation-text">{dailyAffirmation?.title || 'you are smart'}</p>
          <div className="affirmation-actions">
            <button className="soft-button" onClick={() => setNotice('Affirmation audio will appear here after the recordings are added.')}><Icon name="play" size={18} /> Listen</button>
            <button
              className={`icon-button ${dailyAffirmation && favorites.has(dailyAffirmation.id) ? 'is-favorite' : ''}`}
              aria-label={dailyAffirmation && favorites.has(dailyAffirmation.id) ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={Boolean(dailyAffirmation && favorites.has(dailyAffirmation.id))}
              disabled={!dailyAffirmation}
              onClick={() => dailyAffirmation && toggleContentFavorite(dailyAffirmation.id)}
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
            {planItemsForToday.map((item) => item.label === 'CBT' && dailyCbtLesson ? (
              <button className="plan-item plan-item-action" key={item.label} onClick={() => openSkills(dailyCbtLesson)}>
                <span className="plan-icon"><Icon name={item.icon} size={19} /></span>
                <span className="plan-item-copy"><strong>{item.label}</strong><span>{item.title}</span></span>
                <Icon name="arrow" size={17} />
              </button>
            ) : (
              <div className="plan-item" key={item.label}>
                <span className="plan-icon"><Icon name={item.icon} size={19} /></span>
                <div><p>{item.label}</p><span>{item.title}</span></div>
              </div>
            ))}
          </div>
          <button
            className="primary-button"
            disabled={!dailyCbtLesson || planState.loading}
            onClick={() => dailyCbtLesson && openSkills(dailyCbtLesson)}
          >
            {planState.loading ? 'Finding today’s lesson…' : 'Open today’s CBT lesson'} <Icon name="arrow" size={18} />
          </button>
          {planState.error && <p className="plan-error" role="alert">{planState.error}</p>}
          <button className="text-button" onClick={hidePlan}>Not right now</button>
        </section>
      ) : (
        <button className="reopen-plan" onClick={showPlan}><Icon name="spark" size={18} /> View today’s suggested plan</button>
      )}

      {visionBoardChatUrl && (
        <a className="vision-board-card" href={visionBoardChatUrl} aria-label="Build My Vision Board in ChatGPT">
          <span className="vision-board-icon" aria-hidden="true"><Icon name="palette" size={25} /></span>
          <span className="vision-board-copy">
            <span className="vision-board-label">Guided reflection</span>
            <strong>Build My Vision Board</strong>
            <span>Continue your vision conversation in ChatGPT.</span>
          </span>
          <Icon name="arrow" size={19} />
        </a>
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
