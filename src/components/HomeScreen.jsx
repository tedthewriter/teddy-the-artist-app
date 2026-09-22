import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import SkillsLibrary from './SkillsLibrary'
import AffirmationsLibrary from './AffirmationsLibrary'
import AlignmentsLibrary from './AlignmentsLibrary'
import GoalsVision from './GoalsVision'
import MindfulnessLibrary from './MindfulnessLibrary'
import TodayPlan from './TodayPlan'
import { supabase } from '../lib/supabase'
import { pathways } from '../data/homeContent'

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

export default function HomeScreen({ userId, onSignOut }) {
  const [view, setView] = useState('home')
  const [initialItem, setInitialItem] = useState(null)
  const [content, setContent] = useState([])
  const [favorites, setFavorites] = useState(new Set())
  const [completedItems, setCompletedItems] = useState(new Set())
  const [responses, setResponses] = useState(new Map())
  const [saboteurAssessmentResult, setSaboteurAssessmentResult] = useState(null)
  const [contentState, setContentState] = useState({ loading: Boolean(userId), error: '' })
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
  const cbtProgramItems = useMemo(
    () => content
      .filter((item) => item.content_type?.startsWith('cbt_week_'))
      .sort((a, b) => Number(a.body?.week_number || 0) - Number(b.body?.week_number || 0)
        || Number(a.body?.day_number || 0) - Number(b.body?.day_number || 0)
        || Number(a.sort_order || 0) - Number(b.sort_order || 0)),
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

  const selfLoveBookItems = useMemo(() => {
    const selfLoveItems = content
      .filter((item) => contentFramework(item) === 'self-love')
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
    return selfLoveItems
  }, [content])

  const cbtContinueLesson = useMemo(
    () => cbtProgramItems.find((item) => !completedItems.has(item.id)) || null,
    [cbtProgramItems, completedItems],
  )
  const selfLoveContinueLesson = useMemo(
    () => selfLoveBookItems.find((item) => !completedItems.has(item.id)) || null,
    [selfLoveBookItems, completedItems],
  )

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

  function openSelfLove(item = null) {
    setInitialItem(item)
    setView('self-love')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openCbtWorkbook(item = null) {
    setInitialItem(item)
    setView('cbt-workbook')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function choosePath(pathway) {
    setNotice('')
    if (pathway.title === 'Skills') {
      openSkills()
      return
    }

    if (pathway.title === '7 Week CBT workbook') {
      openCbtWorkbook()
      return
    }

    if (pathway.title === 'Self-love workbook') {
      openSelfLove()
      return
    }

    if (pathway.title === 'Mindfulness') {
      setView('mindfulness')
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
        skillCollectionOnly
        onBack={() => { setView('home'); setInitialItem(null) }}
        onToggleFavorite={toggleContentFavorite}
        onToggleComplete={toggleContentComplete}
        onSaveResponse={saveResponse}
        onDeleteResponse={deleteResponse}
      />
    )
  }

  if (view === 'cbt-workbook') {
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
        initialCategoryKey="cbt"
        initialSectionKey="cbt-program"
        sectionLabel="7 Week CBT workbook"
        onBack={() => { setView('home'); setInitialItem(null) }}
        onToggleFavorite={toggleContentFavorite}
        onToggleComplete={toggleContentComplete}
        onSaveResponse={saveResponse}
        onDeleteResponse={deleteResponse}
      />
    )
  }

  if (view === 'self-love') {
    return (
      <SkillsLibrary
        items={skillItems}
        favorites={favorites}
        completedItems={completedItems}
        responses={responses}
        saboteurAssessmentResult={saboteurAssessmentResult}
        loading={contentState.loading}
        error={contentState.error}
        initialCategoryKey="self-love"
        sectionLabel="Self-love workbook"
        initialItem={initialItem}
        onBack={() => { setView('home'); setInitialItem(null) }}
        onToggleFavorite={toggleContentFavorite}
        onToggleComplete={toggleContentComplete}
        onSaveResponse={saveResponse}
        onDeleteResponse={deleteResponse}
      />
    )
  }

  if (view === 'mindfulness') {
    return <MindfulnessLibrary onBack={() => setView('home')} />
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
        cbtLesson={cbtContinueLesson}
        selfLoveLesson={selfLoveContinueLesson}
        loading={contentState.loading}
        error={contentState.error}
        onBack={() => setView('home')}
        onOpenCbtLesson={openCbtWorkbook}
        onOpenSelfLoveLesson={openSelfLove}
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

      <section className={`affirmation-card ${dailyAffirmation && imageUrls[dailyAffirmation.asset_path] ? 'has-pin' : ''}`} aria-label="Affirmation">
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
          <p className="affirmation-text">{dailyAffirmation?.title || 'you are smart'}</p>
        </div>
      </section>

      <section className="pathway-section home-buttons" aria-labelledby="to-do-heading">
        <h2 id="to-do-heading">To do</h2>
        <div className="pathway-grid">
          {pathways.filter((pathway) => pathway.section === 'todo').map((pathway) => (
            <button className={`pathway-card ${pathway.tone}`} key={pathway.title} onClick={() => choosePath(pathway)}>
              <span className="pathway-icon"><Icon name={pathway.icon} size={25} /></span>
              <span className="pathway-title">{pathway.title}</span>
              <span className="pathway-subtitle">{pathway.subtitle}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="pathway-section home-buttons resources-section" aria-labelledby="resources-heading">
        <h2 id="resources-heading">Resources</h2>
        <div className="pathway-grid">
          {pathways.filter((pathway) => pathway.section === 'resources').map((pathway) => (
            <button className={`pathway-card ${pathway.tone}`} key={pathway.title} onClick={() => choosePath(pathway)}>
              <span className="pathway-icon"><Icon name={pathway.icon} size={25} /></span>
              <span className="pathway-title">{pathway.title}</span>
              <span className="pathway-subtitle">{pathway.subtitle}</span>
            </button>
          ))}
        </div>
      </section>

      {notice && <p className="home-notice" role="status">{notice}</p>}
    </main>
  )
}
