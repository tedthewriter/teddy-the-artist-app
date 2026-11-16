import Icon from './Icon'
import { pathways } from '../data/homeContent'

export default function Resources({ onBack, onChoose, notice }) {
  return <main className="app-shell library-shell">
    <header className="library-header">
      <button type="button" className="back-button" onClick={onBack}><Icon name="back" size={19} /> Home</button>
    </header>
    <h1 className="library-title">Resources</h1>
    <section className="pathway-section home-buttons" aria-label="Resources">
      <div className="pathway-grid">
        {pathways.filter(pathway => pathway.section === 'resources').map(pathway => (
          <button type="button" className={`pathway-card ${pathway.tone}`} key={pathway.title} onClick={() => onChoose(pathway)}>
            <span className="pathway-icon"><Icon name={pathway.icon} size={25} /></span>
            <span className="pathway-title">{pathway.title}</span>
            <span className="pathway-subtitle">{pathway.subtitle}</span>
          </button>
        ))}
      </div>
    </section>
    {notice && <p className="home-notice" role="status">{notice}</p>}
  </main>
}
