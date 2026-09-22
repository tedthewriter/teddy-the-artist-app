import Icon from './Icon'

export default function TodayPlan({
  cbtLesson,
  selfLoveLesson,
  loading,
  error,
  onBack,
  onOpenCbtLesson,
  onOpenSelfLoveLesson,
}) {
  const continueCards = [
    {
      label: '7-Week CBT',
      lesson: cbtLesson,
      icon: 'thought',
      detail: cbtLesson?.body?.week_number && cbtLesson?.body?.day_number
        ? `Week ${cbtLesson.body.week_number} · Day ${cbtLesson.body.day_number}`
        : 'Continue the program',
      complete: 'The current CBT program is complete.',
    },
    {
      label: 'Self-love workbook',
      lesson: selfLoveLesson,
      icon: 'heart',
      detail: 'Continue the next reading',
      complete: 'The current Self-Love book is complete.',
      onOpen: onOpenSelfLoveLesson,
    },
  ]

  return (
    <main className="app-shell library-shell today-plan-page">
      <header className="library-header">
        <button className="back-button" type="button" onClick={onBack}>
          <Icon name="back" size={18} /> Home
        </button>
      </header>

      <section>
        <p className="eyebrow">Pick up where you left off</p>
        <h1 className="library-title">Continue</h1>
        <p className="library-intro">These are the two books with a sequence. Everything else is available whenever it feels useful.</p>
      </section>

      <section className="plan-card" aria-label="Continue your programs">
        <div className="plan-list">
          {continueCards.map((card) => card.lesson ? (
              <button className="plan-item plan-item-action" key={card.label} onClick={() => (card.onOpen || onOpenCbtLesson)(card.lesson)}>
                <span className="plan-icon"><Icon name={card.icon} size={19} /></span>
                <span className="plan-item-copy"><strong>{card.label}</strong><span>{card.detail} · {card.lesson.title}</span></span>
                <Icon name="arrow" size={17} />
              </button>
            ) : (
              <div className="plan-item" key={card.label}>
                <span className="plan-icon"><Icon name={card.icon} size={19} /></span>
                <div><p>{card.label}</p><span>{loading ? 'Finding your place…' : card.complete}</span></div>
              </div>
            ))}
        </div>
        {error && <p className="plan-error" role="alert">{error}</p>}
      </section>

      <p className="support-note">Use Skills anytime for DBT, mindfulness, and other as-needed support.</p>
    </main>
  )
}
