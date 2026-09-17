import Icon from './Icon'

export default function TodayPlan({
  items,
  skillItems,
  dailyCbtLesson,
  loading,
  error,
  onBack,
  onOpenLesson,
}) {
  return (
    <main className="app-shell library-shell today-plan-page">
      <header className="library-header">
        <button className="back-button" type="button" onClick={onBack}>
          <Icon name="back" size={18} /> Home
        </button>
      </header>

      <section>
        <p className="eyebrow">A gentle suggestion</p>
        <h1 className="library-title">Today’s Plan</h1>
        <p className="library-intro">Choose what feels useful today. The linked lessons will adjust as materials are marked done.</p>
      </section>

      <section className="plan-card" aria-label="Today’s suggested activities">
        <div className="plan-list">
          {items.map((item) => {
            const linkedLesson = item.content_id
              ? skillItems.find((lesson) => lesson.id === item.content_id)
              : null
            return linkedLesson ? (
              <button className="plan-item plan-item-action" key={item.label} onClick={() => onOpenLesson(linkedLesson)}>
                <span className="plan-icon"><Icon name={item.icon} size={19} /></span>
                <span className="plan-item-copy"><strong>{item.label}</strong><span>{item.title}</span></span>
                <Icon name="arrow" size={17} />
              </button>
            ) : (
              <div className="plan-item" key={item.label}>
                <span className="plan-icon"><Icon name={item.icon} size={19} /></span>
                <div><p>{item.label}</p><span>{item.title}</span></div>
              </div>
            )
          })}
        </div>

        <button
          className="primary-button"
          disabled={!dailyCbtLesson || loading}
          onClick={() => dailyCbtLesson && onOpenLesson(dailyCbtLesson)}
        >
          {loading ? 'Finding today’s lesson…' : 'Open today’s CBT lesson'} <Icon name="arrow" size={18} />
        </button>
        {error && <p className="plan-error" role="alert">{error}</p>}
      </section>

      <p className="support-note">This is a menu, not a checklist. Come back whenever another activity feels useful.</p>
    </main>
  )
}
