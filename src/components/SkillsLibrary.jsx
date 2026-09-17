import { useMemo, useState } from 'react'
import Icon from './Icon'
import ResponseField from './ResponseField'
import SaboteurResults from './SaboteurResults'

const typeLabels = {
  overview: 'Start here',
  foundation: 'Foundation',
  practice: 'Guided practice',
  saboteur: 'Saboteur',
  sage_power: 'Sage power',
  cbt_intro: 'CBT foundation',
  cbt_week_1: 'Week 1',
  cbt_skill: 'CBT skill',
  dbt_skill: 'DBT skill',
  self_love_foundation: 'Self-love foundation',
  self_love_reading: 'Self-love reading',
  self_love_practice: 'Guided reflection',
  self_love_assessment: 'Self-assessment',
}

function contentKindLabel(item) {
  if (item.content_type === 'cbt_skill' && item.body?.skill_family) {
    return `${item.body.skill_family} · CBT skill`
  }
  if (item.content_type === 'dbt_skill' && item.body?.skill_family) {
    return `${item.body.skill_family} · DBT skill`
  }
  if (item.content_type?.startsWith('cbt_week_') && item.body?.week_number && item.body?.day_number) {
    return `Week ${item.body.week_number} · Day ${item.body.day_number}`
  }
  return typeLabels[item.content_type] || item.content_type
}

function DetailSection({ title, children }) {
  if (!children) return null
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      {children}
    </section>
  )
}

function surveyKind(type) {
  if (['single_choice', 'radio', 'select'].includes(type)) return 'single_choice'
  if (['multi_choice', 'checkbox', 'checkboxes'].includes(type)) return 'multi_choice'
  if (['scale', 'rating'].includes(type)) return 'scale'
  return 'text'
}

function safeResponseKey(value, fallback) {
  const normalized = String(value || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
  return normalized || fallback
}

function surveyResponseKey(surveyItem, index) {
  return `survey-${safeResponseKey(surveyItem.key || surveyItem.id, `question-${index + 1}`)}`
}

function completionPresentation(item) {
  if (item.content_type === 'cbt_skill') {
    return {
      action: 'Mark practiced',
      complete: 'Practiced',
      undo: 'Tap again if you want to remove the practiced mark.',
    }
  }

  if (item.framework === 'cbt_7_weeks') {
    return {
      action: 'Complete lesson',
      complete: 'Lesson complete',
      undo: 'Tap again if you want to mark this lesson not complete.',
    }
  }

  if (item.framework === 'positive_intelligence') {
    return {
      action: 'Complete',
      complete: 'Complete',
      undo: 'Tap again if you want to mark this not complete.',
    }
  }

  return null
}

function ContentDetail({
  item,
  favorite,
  completed,
  responses,
  onBack,
  onToggleFavorite,
  onToggleComplete,
  onSaveResponse,
  onDeleteResponse,
}) {
  const body = item.body || {}
  const surveyItems = Array.isArray(body.response_items)
    ? body.response_items
    : Array.isArray(body.survey?.questions) ? body.survey.questions : []
  const completionCopy = completionPresentation(item)
  const responseRecord = (responseKey) => responses.get(`content:${item.id}:${responseKey}`)
  const scoredSurveyItems = body.survey?.show_total
    ? surveyItems.map((surveyItem, index) => ({
        surveyItem,
        responseKey: surveyResponseKey(surveyItem, index),
      })).filter(({ surveyItem }) => surveyKind(surveyItem.type) === 'scale')
    : []
  const scoreValues = scoredSurveyItems
    .map(({ responseKey }) => Number(responseRecord(responseKey)?.response_value?.value))
    .filter(Number.isFinite)
  const surveyScore = scoreValues.reduce((total, value) => total + value, 0)
  const scoreRange = scoreValues.length === scoredSurveyItems.length
    ? body.survey?.score_ranges?.find((range) => surveyScore >= range.min && surveyScore <= range.max)
    : null
  const [savingCompletion, setSavingCompletion] = useState(false)
  const [completionError, setCompletionError] = useState('')
  const responseProps = (responseKey, prompt, kind = 'text') => ({
    contextType: 'content',
    contextId: item.id,
    contentId: item.id,
    responseKey,
    kind,
    prompt,
    record: responseRecord(responseKey),
    onSave: onSaveResponse,
    onDelete: onDeleteResponse,
  })

  async function handleCompletion() {
    setSavingCompletion(true)
    setCompletionError('')
    const saved = await onToggleComplete(item.id)
    setSavingCompletion(false)
    if (!saved) setCompletionError('That change could not be saved. Please try again.')
  }

  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Back</button>
        <button
          className={`icon-button ${favorite ? 'is-favorite' : ''}`}
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={favorite}
          onClick={() => onToggleFavorite(item.id)}
        ><Icon name="bookmark" size={19} /></button>
      </header>

      <article className="content-detail-card">
        <p className="content-kind">{contentKindLabel(item)}</p>
        <h1>{item.title}</h1>
        <p className="detail-lead">{item.short_description}</p>

        {completionCopy && (
          <div className={`completion-panel ${completed ? 'is-complete' : ''}`}>
            <button className="completion-button" disabled={savingCompletion} onClick={handleCompletion}>
              <span className="completion-button-icon"><Icon name="check" size={19} /></span>
              {savingCompletion ? 'Saving…' : completed ? completionCopy.complete : completionCopy.action}
            </button>
            {completed && <p>{completionCopy.undo}</p>}
            {completionError && <p className="completion-error" role="alert">{completionError}</p>}
          </div>
        )}

        {body.sections?.map((section) => (
          <DetailSection title={section.heading} key={section.heading}>
            <p>{section.text}</p>
          </DetailSection>
        ))}

        {body.safety_note && (
          <p className="gentle-callout">{body.safety_note}</p>
        )}

        {body.question && (
          <>
            <blockquote className="sage-question">{body.question}</blockquote>
            <ResponseField
              {...responseProps('guiding-question', body.question)}
              label="Your response"
            />
          </>
        )}

        <DetailSection title="You might notice">
          {(body.examples || body.cues) && (
            <ul>
              {[...(body.examples || []), ...(body.cues || [])].map((entry) => <li key={entry}>{entry}</li>)}
            </ul>
          )}
        </DetailSection>

        {body.distancing_statement && (
          <DetailSection title="Try saying">
            <p className="gentle-callout">{body.distancing_statement}</p>
          </DetailSection>
        )}

        <DetailSection title={body.activity_title || 'One small practice'}>
          {body.practice_steps && (
            <ol>{body.practice_steps.map((step) => <li key={step}>{step}</li>)}</ol>
          )}
          {body.practice_steps && (
            <ResponseField
              {...responseProps('activity-notes', `Notes for ${body.activity_title || 'this practice'}`)}
              label="Your activity notes"
              placeholder="Add notes, answers, or anything you want to remember…"
            />
          )}
        </DetailSection>

        {surveyItems.length > 0 && (
          <DetailSection title={body.survey?.title || 'Questions'}>
            {body.survey?.instructions && <p className="survey-instructions">{body.survey.instructions}</p>}
            <div className="response-group">
              {surveyItems.map((surveyItem, index) => {
                const responseKey = surveyResponseKey(surveyItem, index)
                const kind = surveyKind(surveyItem.type)
                return (
                  <div className="survey-question" key={responseKey}>
                    <p className="survey-prompt">{surveyItem.prompt || surveyItem.question}</p>
                    {surveyItem.help_text && <p className="survey-help">{surveyItem.help_text}</p>}
                    <ResponseField
                      {...responseProps(responseKey, surveyItem.prompt || surveyItem.question, kind)}
                      label={surveyItem.label || 'Your response'}
                      placeholder={surveyItem.placeholder}
                      options={surveyItem.options || []}
                      min={Number.isFinite(surveyItem.min) ? surveyItem.min : 0}
                      max={Number.isFinite(surveyItem.max) ? surveyItem.max : 10}
                      minLabel={surveyItem.min_label}
                      maxLabel={surveyItem.max_label}
                    />
                  </div>
                )
              })}
            </div>
            {scoredSurveyItems.length > 0 && (
              <div className={`survey-score-card ${scoreRange ? 'complete' : ''}`} aria-live="polite">
                {scoreValues.length === scoredSurveyItems.length ? (
                  <>
                    <span>Your current score</span>
                    <strong>{surveyScore} / {scoredSurveyItems.reduce((total, { surveyItem }) => total + (surveyItem.max ?? 10), 0)}</strong>
                    {scoreRange && <p>{scoreRange.text}</p>}
                  </>
                ) : (
                  <p>Answer all {scoredSurveyItems.length} statements to see your score. {scoreValues.length} saved so far.</p>
                )}
              </div>
            )}
          </DetailSection>
        )}

        {body.repeat_note && (
          <p className="gentle-callout">{body.repeat_note}</p>
        )}

        {item.reflection_prompt && (
          <DetailSection title="Reflect">
            <p className="reflection-prompt">{item.reflection_prompt}</p>
            <ResponseField
              {...responseProps('reflection', item.reflection_prompt)}
              label="Your reflection"
            />
          </DetailSection>
        )}

        {item.faith_reflection && (
          <DetailSection title="Faith reflection">
            <p>{item.faith_reflection}</p>
            <ResponseField
              {...responseProps('faith-reflection', item.faith_reflection)}
              label="Your faith reflection notes"
              placeholder="Add any thoughts you want to remember…"
            />
          </DetailSection>
        )}

        <footer className="source-note">
          <span>{item.estimated_minutes ? `About ${item.estimated_minutes} minutes` : 'Take the time you need'}</span>
          {item.source_title && <span>Framework: {item.source_title}</span>}
        </footer>
      </article>
    </main>
  )
}

function frameworkKey(item) {
  if (item.framework === 'cbt_7_weeks' || item.content_type.startsWith('cbt_')) return 'cbt'
  if (item.framework === 'positive_intelligence') return 'positive-intelligence'
  if (item.framework === 'self_love' || item.content_type.startsWith('self_love')) return 'self-love'
  if (item.framework === 'dbt' || item.content_type.startsWith('dbt')) return 'dbt'
  return null
}

function LessonList({ items, favorites, completedItems, onSelect }) {
  return (
    <div className="content-list">
      {items.map((item) => (
        <button className="content-card" key={item.id} onClick={() => onSelect(item)}>
          <span className={`content-dot ${item.content_type}`} aria-hidden="true" />
          <span className="content-card-copy">
            <span className="content-card-title">{item.title}</span>
            <span className="content-card-description">{item.short_description}</span>
            <span className="content-card-meta">
              {item.estimated_minutes ? `${item.estimated_minutes} min` : 'Open'}
              {favorites.has(item.id) && <> · Saved</>}
            </span>
          </span>
          {completedItems.has(item.id) && completionPresentation(item) ? (
            <span
              className="completion-check"
              aria-label={completionPresentation(item).complete}
              title={completionPresentation(item).complete}
            ><Icon name="check" size={18} /></span>
          ) : (
            <Icon name="arrow" size={18} />
          )}
        </button>
      ))}
    </div>
  )
}

export default function SkillsLibrary({
  items,
  favorites,
  completedItems,
  responses,
  saboteurAssessmentResult,
  loading,
  error,
  initialItem,
  onBack,
  onToggleFavorite,
  onToggleComplete,
  onSaveResponse,
  onDeleteResponse,
}) {
  const [selected, setSelected] = useState(initialItem || null)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(initialItem ? frameworkKey(initialItem) : null)
  const [selectedSectionKey, setSelectedSectionKey] = useState(null)
  const [selectedSubsectionKey, setSelectedSubsectionKey] = useState(null)
  const [showSaboteurResults, setShowSaboteurResults] = useState(false)
  const categories = useMemo(() => {
    const cbtItems = items.filter((item) => frameworkKey(item) === 'cbt')
    const positiveIntelligenceItems = items.filter((item) => frameworkKey(item) === 'positive-intelligence')
    const selfLoveItems = items.filter((item) => frameworkKey(item) === 'self-love')
    const dbtItems = items.filter((item) => frameworkKey(item) === 'dbt')

    return [
      {
        key: 'cbt', label: 'CBT', description: 'Work with thoughts, feelings, and actions', icon: 'thought', tone: 'sage', items: cbtItems,
        sections: [
          {
            key: 'cbt-program', label: '7-Week Program', description: 'Follow the workbook from Week 1 through Week 7', icon: 'journal', tone: 'sage',
            items: cbtItems.filter((item) => item.content_type?.startsWith('cbt_week_')),
            subsections: Array.from({ length: 7 }, (_, index) => {
              const week = index + 1
              const weekDescriptions = [
                'Begin with your story, strengths, and goals',
                'Reconnect with values and meaningful activity',
                'Recognize automatic thoughts and deeper beliefs',
                'Examine patterns and build balanced thoughts',
                'Make time and tasks more manageable',
                'Approach fears safely and gradually',
                'Gather the tools into a keep-going plan',
              ]
              return {
                key: `cbt-week-${week}`,
                label: `Week ${week}`,
                description: weekDescriptions[index],
                icon: week === 7 ? 'star' : 'journal',
                tone: ['mint', 'gold', 'peach', 'lilac', 'blue', 'rose', 'sage'][index],
                items: cbtItems.filter((item) => item.content_type === `cbt_week_${week}`),
              }
            }),
          },
          {
            key: 'cbt-library', label: 'CBT Skill Library', description: 'Practice any CBT skill whenever it feels useful', icon: 'toolbox', tone: 'gold',
            items: cbtItems.filter((item) => item.content_type === 'cbt_skill'),
            subsections: [
              { key: 'cbt-foundations', label: 'CBT Foundations', description: 'Understand patterns, emotions, goals, and supports', icon: 'thought', tone: 'sage', family: 'CBT Foundations' },
              { key: 'cbt-valued-action', label: 'Valued Action', description: 'Reconnect with meaning, pleasure, and forward movement', icon: 'heart', tone: 'rose', family: 'Valued Action' },
              { key: 'cbt-thought-awareness', label: 'Thought Awareness', description: 'Notice automatic thoughts, themes, and deeper beliefs', icon: 'journal', tone: 'peach', family: 'Thought Awareness' },
              { key: 'cbt-thought-reframing', label: 'Thought Reframing', description: 'Question patterns and build a fuller perspective', icon: 'spark', tone: 'lilac', family: 'Thought Reframing' },
              { key: 'cbt-task-support', label: 'Task Support', description: 'Make priorities, starting, and focused work more manageable', icon: 'toolbox', tone: 'gold', family: 'Task Support' },
              { key: 'cbt-facing-fears', label: 'Facing Fears', description: 'Reduce avoidance through safe, gradual practice', icon: 'compass', tone: 'blue', family: 'Facing Fears' },
              { key: 'cbt-maintenance', label: 'Maintenance', description: 'Notice warning signs and keep helpful tools close', icon: 'star', tone: 'mint', family: 'Maintenance' },
            ].map((section) => ({
              ...section,
              items: cbtItems.filter((item) => item.content_type === 'cbt_skill' && item.body?.skill_family === section.family),
            })),
          },
        ],
      },
      {
        key: 'positive-intelligence', label: 'Positive Intelligence', description: 'Notice Saboteurs and practice Sage responses', icon: 'compass', tone: 'gold', items: positiveIntelligenceItems,
        sections: [
          { key: 'pi-overview', label: 'Overview', description: 'Start with the big picture', icon: 'compass', tone: 'gold', items: positiveIntelligenceItems.filter((item) => item.content_type === 'overview') },
          { key: 'pi-foundations', label: 'Foundations', description: 'Learn the core ideas', icon: 'thought', tone: 'sage', items: positiveIntelligenceItems.filter((item) => item.content_type === 'foundation') },
          { key: 'pi-practice', label: 'Guided Practice', description: 'Try PQ reps and short activities', icon: 'spark', tone: 'mint', items: positiveIntelligenceItems.filter((item) => item.content_type === 'practice') },
          { key: 'pi-saboteurs', label: 'Saboteurs', description: 'Recognize protective patterns', icon: 'people', tone: 'peach', items: positiveIntelligenceItems.filter((item) => item.content_type === 'saboteur') },
          { key: 'pi-sage-powers', label: 'Sage Powers', description: 'Practice wiser responses', icon: 'star', tone: 'lilac', items: positiveIntelligenceItems.filter((item) => item.content_type === 'sage_power') },
        ],
      },
      {
        key: 'self-love', label: 'Self-Love', description: 'Practice kindness, care, and self-respect', icon: 'heart', tone: 'rose', items: selfLoveItems,
        sections: [{ key: 'self-love-foundations', label: 'Foundations', items: selfLoveItems }],
      },
      {
        key: 'dbt', label: 'DBT', description: 'Build coping, regulation, and relationship skills', icon: 'toolbox', tone: 'blue', items: dbtItems,
        sections: [
          { key: 'dbt-distress-tolerance', label: 'Distress Tolerance', description: 'Get through intense moments without making them worse', icon: 'toolbox', tone: 'blue', family: 'Distress Tolerance' },
          { key: 'dbt-mindfulness', label: 'Mindfulness', description: 'Return attention to the present with openness', icon: 'spark', tone: 'mint', family: 'Mindfulness' },
          { key: 'dbt-emotion-regulation', label: 'Emotion Regulation', description: 'Understand emotions and respond more effectively', icon: 'heart', tone: 'rose', family: 'Emotion Regulation' },
          { key: 'dbt-interpersonal-effectiveness', label: 'Interpersonal Effectiveness', description: 'Ask, listen, set limits, and protect relationships', icon: 'people', tone: 'gold', family: 'Interpersonal Effectiveness' },
        ].map((section) => ({
          ...section,
          items: dbtItems.filter((item) => item.body?.skill_family === section.family),
        })),
      },
    ]
  }, [items])
  const selectedCategory = categories.find((category) => category.key === selectedCategoryKey)
  const selectedSection = selectedCategory?.sections.find((section) => section.key === selectedSectionKey)
  const selectedSubsection = selectedSection?.subsections?.find((section) => section.key === selectedSubsectionKey)

  if (showSaboteurResults) {
    return (
      <SaboteurResults
        result={saboteurAssessmentResult}
        onBack={() => setShowSaboteurResults(false)}
      />
    )
  }

  if (selected) {
    return (
      <ContentDetail
        item={selected}
        favorite={favorites.has(selected.id)}
        completed={completedItems.has(selected.id)}
        responses={responses}
        onBack={() => setSelected(null)}
        onToggleFavorite={onToggleFavorite}
        onToggleComplete={onToggleComplete}
        onSaveResponse={onSaveResponse}
        onDeleteResponse={onDeleteResponse}
      />
    )
  }

  if (selectedCategory) {
    const isPositiveIntelligence = selectedCategory.key === 'positive-intelligence'
    const isDbt = selectedCategory.key === 'dbt'
    const usesSectionNavigation = ['positive-intelligence', 'cbt', 'dbt'].includes(selectedCategory.key)
    const leaveCategory = () => {
      if (selectedSubsectionKey) {
        setSelectedSubsectionKey(null)
      } else if (usesSectionNavigation && selectedSectionKey) {
        setSelectedSectionKey(null)
      } else {
        setSelectedCategoryKey(null)
      }
    }

    return (
      <main className="app-shell library-shell">
        <header className="library-header">
          <button className="back-button" onClick={leaveCategory}><Icon name="back" size={19} /> {selectedSubsectionKey ? selectedSection.label : usesSectionNavigation && selectedSectionKey ? selectedCategory.label : 'Skills'}</button>
        </header>

        <div className={`category-heading-icon ${selectedCategory.tone}`} aria-hidden="true">
          <Icon name={selectedCategory.icon} size={27} />
        </div>
        <p className="eyebrow">Skills library</p>
        <h1 className="library-title">{selectedSubsection?.label || selectedSection?.label || selectedCategory.label}</h1>
        <p className="library-intro">
          {selectedSubsection?.description || selectedSection?.description || `${selectedCategory.description}. Open whichever lesson feels useful today.`}
        </p>

        {selectedCategory.items.length === 0 ? (
          <section className="empty-category-card">
            <span className="skill-category-icon" aria-hidden="true"><Icon name={selectedCategory.icon} size={26} /></span>
            <h2>Content will be added here.</h2>
            <p>This page is ready for approved {selectedCategory.label} lessons and activities when we add them.</p>
          </section>
        ) : usesSectionNavigation && !selectedSection ? (
          <div className="pi-section-grid" aria-label={`${selectedCategory.label} sections`}>
            {isDbt && (
              <button
                className="pi-section-button assessment"
                onClick={() => setSelected(selectedCategory.items[Math.floor(Math.random() * selectedCategory.items.length)])}
              >
                <span className="pi-section-icon" aria-hidden="true"><Icon name="dice" size={24} /></span>
                <span className="pi-section-copy">
                  <strong>Choose Randomly</strong>
                  <span>Open one skill from anywhere in the DBT library</span>
                  <small>{selectedCategory.items.length} possible skills</small>
                </span>
                <Icon name="arrow" size={17} />
              </button>
            )}
            {selectedCategory.sections.map((section) => (
              <button className={`pi-section-button ${section.tone}`} key={section.key} onClick={() => setSelectedSectionKey(section.key)}>
                <span className="pi-section-icon" aria-hidden="true"><Icon name={section.icon} size={24} /></span>
                <span className="pi-section-copy">
                  <strong>{section.label}</strong>
                  <span>{section.description}</span>
                  <small>{section.items.length} {section.items.length === 1 ? 'item' : 'items'}</small>
                </span>
                <Icon name="arrow" size={17} />
              </button>
            ))}
            {isPositiveIntelligence && (
              <button className="pi-section-button assessment" onClick={() => setShowSaboteurResults(true)}>
                <span className="pi-section-icon" aria-hidden="true"><Icon name="journal" size={24} /></span>
                <span className="pi-section-copy">
                  <strong>Assessment Results</strong>
                  <span>{saboteurAssessmentResult ? 'View your private Saboteur scores' : 'Ready when your results arrive'}</span>
                  <small>Personal assessment</small>
                </span>
                <Icon name="arrow" size={17} />
              </button>
            )}
          </div>
        ) : selectedSection?.subsections && !selectedSubsection ? (
          <div className="pi-section-grid" aria-label={`${selectedSection.label} groups`}>
            {selectedSection.subsections.map((section) => (
              <button className={`pi-section-button ${section.tone}`} key={section.key} onClick={() => setSelectedSubsectionKey(section.key)}>
                <span className="pi-section-icon" aria-hidden="true"><Icon name={section.icon} size={24} /></span>
                <span className="pi-section-copy">
                  <strong>{section.label}</strong>
                  <span>{section.description}</span>
                  <small>
                    {section.items.length} {selectedSection.key === 'cbt-library'
                      ? section.items.length === 1 ? 'skill' : 'skills'
                      : section.items.length === 1 ? 'lesson' : 'lessons'}
                  </small>
                </span>
                <Icon name="arrow" size={17} />
              </button>
            ))}
          </div>
        ) : usesSectionNavigation && selectedSection ? (
          <section className="content-group pi-selected-group">
            <LessonList items={selectedSubsection?.items || selectedSection.items} favorites={favorites} completedItems={completedItems} onSelect={setSelected} />
          </section>
        ) : selectedCategory.sections.map((section) => section.items.length > 0 && (
          <section className="content-group" key={section.key}>
            <h2>{section.label}</h2>
            <LessonList items={section.items} favorites={favorites} completedItems={completedItems} onSelect={setSelected} />
          </section>
        ))}
      </main>
    )
  }

  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Home</button>
      </header>
      <p className="eyebrow">Skills library</p>
      <h1 className="library-title">Choose something helpful.</h1>
      <p className="library-intro">Choose a structured program to continue or an as-needed library to use whenever it feels helpful.</p>

      {loading && <div className="library-status">Opening the library…</div>}
      {error && <div className="library-status error" role="alert">{error}</div>}

      {!loading && !error && (
        <div className="skill-category-grid">
          {categories.map((category) => (
            <button
              className={`skill-category-card ${category.tone}`}
              key={category.key}
              onClick={() => setSelectedCategoryKey(category.key)}
            >
              <span className="skill-category-icon" aria-hidden="true"><Icon name={category.icon} size={26} /></span>
              <span className="skill-category-title">{category.label}</span>
              <span className="skill-category-description">{category.description}</span>
              <span className="skill-category-count">{category.items.length > 0 ? `${category.items.length} ${category.items.length === 1 ? 'lesson' : 'lessons'}` : 'Ready for content'}</span>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}
