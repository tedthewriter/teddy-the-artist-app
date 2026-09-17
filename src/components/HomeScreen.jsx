import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import SkillsLibrary from './SkillsLibrary'
import AffirmationsLibrary from './AffirmationsLibrary'
import AlignmentsLibrary from './AlignmentsLibrary'
import GoalsVision from './GoalsVision'
import TodayPlan from './TodayPlan'
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

const lastHomeAffirmationKey = 'teddy-last-home-affirmation'

function chooseHomeAffirmation(items, currentId = null) {
  if (!items.length) return null
  const previousId = currentId || localStorage.getItem(lastHomeAffirmationKey)
  const choices = items.length > 1 ? items.filter((item) => item.id !== previousId) : items
  const choice = choices[Math.floor(Math.random() * choices.length)] || items[0]
  localStorage.setItem(lastHomeAffirmationKey, choice.id)
  return choice.id
}

function contentFramework(item) {
  if (item.framework === 'positive_intelligence') return 'positive-intelligence'
  if (item.framework === 'self_love' || item.content_type.startsWith('self_love')) return 'self-love'
  if (item.framework === 'dbt' || item.content_type.startsWith('dbt')) return 'dbt'
  return null
}

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
  const [view, setView] = useState('home')
  const [initialItem, setInitialItem] = useState(null)
  const [content, setContent] = useState([])
  const [favorites, setFavorites] = useState(new Set())
  const [completedItems, setCompletedItems] = useState(new Set())
  const [responses, setResponses] = useState(new Map())
  const [saboteurAssessmentResult, setSaboteurAssessmentResult] = useState(null)
  const [contentState, setContentState] = useState({ loading: Boolean(userId), error: '' })
  const [todayPlan, setTodayPlan] = useState(null)
  const [planState, setPlanState] = useState({ loading: Boolean(userId), error: '' })
  const [imageUrls, setImageUrls] = useState({})
  const [notice, setNotice] = useState('')
  const [dailyAffirmationId, setDailyAffirmationId] = useState(null)
  const lastAffirmationShuffleRef = useRef(0)
  const today = useMemo(
    () => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()),
    [],
  )

  useEffect(() => {
    let active = true

    async function loadLibrary() {
      if (!supabase || !userId) return
      setContentState({ loading: true, error: '' })

      const [contentResult, favoritesResult, completionsResult, responsesResult, assessmentResult] = await Promise.all([
        supabase
          .from('content_items')
          .select('id, slug, category, framework, content_type, title, short_description, body, reflection_prompt, faith_reflection, source_title, estimated_minutes, energy_level, sort_order, affirmation_number, asset_path')
          .eq('approved', true)
          .eq('active', true)
          .order('sort_order'),
        supabase.from('user_favorites').select('content_id').eq('user_id', userId),
        supabase
          .from('user_content_completions')
          .select('content_id')
          .eq('user_id', userId),
        supabase
          .from('user_responses')
          .select('context_type, context_id, response_key, content_id, response_kind, prompt_snapshot, response_value, updated_at')
          .eq('user_id', userId),
        supabase
          .from('user_assessment_results')
          .select('assessment_key, title, results, received_at, updated_at')
          .eq('user_id', userId)
          .eq('assessment_key', 'positive_intelligence_saboteurs')
          .maybeSingle(),
      ])

      if (!active) return
      if (contentResult.error || favoritesResult.error) {
        setContentState({ loading: false, error: 'The skills library could not be opened. Please try again.' })
        return
      }

      setContent(contentResult.data || [])
      setFavorites(new Set((favoritesResult.data || []).map((entry) => entry.content_id)))
      if (!completionsResult.error) setCompletedItems(new Set((completionsResult.data || []).map((entry) => entry.content_id)))
      if (!responsesResult.error) {
        setResponses(new Map((responsesResult.data || []).map((entry) => [
          `${entry.context_type}:${entry.context_id}:${entry.response_key}`,
          entry,
        ])))
      }
      if (!assessmentResult.error) setSaboteurAssessmentResult(assessmentResult.data || null)
      setContentState({ loading: false, error: '' })
    }

    loadLibrary()
    return () => { active = false }
  }, [userId])

  const affirmationItems = useMemo(
    () => content.filter((item) => item.content_type === 'affirmation').sort((a, b) => a.affirmation_number - b.affirmation_number),
    [content],
  )
  const alignmentItems = useMemo(
    () => content.filter((item) => item.framework === 'alignment'),
    [content],
  )
  const skillItems = useMemo(
    () => content.filter((item) => item.content_type !== 'affirmation' && item.framework !== 'alignment'),
    [content],
  )
  const weekOneItems = useMemo(
    () => content
      .filter((item) => item.content_type === 'cbt_week_1')
      .sort((a, b) => Number(a.body?.day_number || 0) - Number(b.body?.day_number || 0)),
    [content],
  )
  const dailyAffirmation = useMemo(
    () => affirmationItems.find((item) => item.id === dailyAffirmationId) || null,
    [affirmationItems, dailyAffirmationId],
  )

  useEffect(() => {
    if (!affirmationItems.length) return
    setDailyAffirmationId((currentId) => chooseHomeAffirmation(affirmationItems, currentId))
  }, [affirmationItems])

  useEffect(() => {
    function shuffleWhenOpened() {
      if (document.visibilityState === 'hidden' || affirmationItems.length === 0) return
      const now = Date.now()
      if (now - lastAffirmationShuffleRef.current < 750) return
      lastAffirmationShuffleRef.current = now
      setDailyAffirmationId((currentId) => chooseHomeAffirmation(affirmationItems, currentId))
    }

    window.addEventListener('pageshow', shuffleWhenOpened)
    document.addEventListener('visibilitychange', shuffleWhenOpened)
    return () => {
      window.removeEventListener('pageshow', shuffleWhenOpened)
      document.removeEventListener('visibilitychange', shuffleWhenOpened)
    }
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

  const nextLessons = useMemo(() => {
    const nextFor = (framework) => {
      const frameworkItems = content
        .filter((item) => contentFramework(item) === framework)
        .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      return {
        hasContent: frameworkItems.length > 0,
        lesson: frameworkItems.find((item) => !completedItems.has(item.id)) || null,
      }
    }

    return {
      'Positive Intelligence': nextFor('positive-intelligence'),
    }
  }, [content, completedItems])

  const dailySelfLove = useMemo(() => {
    const selfLoveItems = content
      .filter((item) => contentFramework(item) === 'self-love')
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    if (selfLoveItems.length === 0) return null
    return selfLoveItems[dateNumber(localDateKey()) % selfLoveItems.length]
  }, [content])

  const dailyDbtSkill = useMemo(() => {
    const dbtItems = content
      .filter((item) => contentFramework(item) === 'dbt')
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    if (dbtItems.length === 0) return null
    return dbtItems[dateNumber(localDateKey()) % dbtItems.length]
  }, [content])

  const planItemsForToday = mergePlanWithDefaults(todayPlan?.plan_items).map((item) => {
    if (item.label === 'DBT') {
      return dailyDbtSkill
        ? { ...item, title: `Try a random skill: ${dailyDbtSkill.title}`, content_id: dailyDbtSkill.id }
        : { ...item, title: 'DBT skills will appear here when they are added.', content_id: null }
    }
    if (item.label === 'Self-love') {
      return dailySelfLove
        ? { ...item, title: dailySelfLove.title, content_id: dailySelfLove.id }
        : { ...item, title: 'Self-love materials will appear here when they are added.', content_id: null }
    }
    const recommendation = nextLessons[item.label]
    if (!recommendation) return item
    if (recommendation.lesson) {
      return { ...item, title: recommendation.lesson.title, content_id: recommendation.lesson.id }
    }
    if (recommendation.hasContent) {
      return { ...item, title: `All current ${item.label} materials are complete.`, content_id: null }
    }
    return { ...item, title: `${item.label} materials will appear here when they are added.`, content_id: null }
  })
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

  async function saveResponse({
    contextType,
    contextId,
    contentId,
    responseKey,
    responseKind,
    prompt,
    responseValue,
  }) {
    if (!supabase || !userId) return false
    const row = {
      user_id: userId,
      context_type: contextType,
      context_id: contextId,
      response_key: responseKey,
      content_id: contextType === 'content' ? contentId : null,
      response_kind: responseKind,
      prompt_snapshot: prompt || '',
      response_value: responseValue,
      updated_at: new Date().toISOString(),
    }
    const { data, error: responseError } = await supabase
      .from('user_responses')
      .upsert(row, { onConflict: 'user_id,context_type,context_id,response_key' })
      .select('context_type, context_id, response_key, content_id, response_kind, prompt_snapshot, response_value, updated_at')
      .single()

    if (responseError) return false
    setResponses((current) => {
      const next = new Map(current)
      next.set(`${data.context_type}:${data.context_id}:${data.response_key}`, data)
      return next
    })
    return true
  }

  async function deleteResponse({ contextType, contextId, responseKey }) {
    if (!supabase || !userId) return false
    const { error: responseError } = await supabase
      .from('user_responses')
      .delete()
      .eq('user_id', userId)
      .eq('context_type', contextType)
      .eq('context_id', contextId)
      .eq('response_key', responseKey)

    if (responseError) return false
    setResponses((current) => {
      const next = new Map(current)
      next.delete(`${contextType}:${contextId}:${responseKey}`)
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
    if (pathway.title === 'Today’s Plan') {
      setView('today-plan')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (pathway.title === 'Skills') {
      openSkills()
      return
    }

    if (pathway.title === 'Affirmations') {
      setView('affirmations')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (pathway.title === 'Alignments') {
      setView('alignments')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (pathway.title === 'Goals & Vision') {
      setView('goals-vision')
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
        responses={responses}
        saboteurAssessmentResult={saboteurAssessmentResult}
        loading={contentState.loading}
        error={contentState.error}
        initialItem={initialItem}
        onBack={() => { setView('home'); setInitialItem(null) }}
        onToggleFavorite={toggleContentFavorite}
        onToggleComplete={toggleContentComplete}
        onSaveResponse={saveResponse}
        onDeleteResponse={deleteResponse}
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
        responses={responses}
        onBack={() => setView('home')}
        onToggleFavorite={toggleContentFavorite}
        onImagesChanged={loadAffirmationImages}
        onSaveResponse={saveResponse}
        onDeleteResponse={deleteResponse}
      />
    )
  }

  if (view === 'alignments') {
    return (
      <AlignmentsLibrary
        items={alignmentItems}
        loading={contentState.loading}
        error={contentState.error}
        onBack={() => setView('home')}
      />
    )
  }

  if (view === 'goals-vision') {
    return <GoalsVision onBack={() => setView('home')} />
  }

  if (view === 'today-plan') {
    return (
      <TodayPlan
        items={planItemsForToday}
        skillItems={skillItems}
        dailyCbtLesson={dailyCbtLesson}
        loading={planState.loading}
        error={planState.error}
        onBack={() => setView('home')}
        onOpenLesson={openSkills}
      />
    )
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
