import Icon from './Icon'

const artIdeas = [
  { title: 'Casey Childs weekly demo email', link: 'https://caseychilds.com/studio-video-library' },
  { title: 'Casey Childs studio session', link: 'https://caseychilds.com/model-session' },
  'Paint Coach lessons',
  'Draw from Disney character book',
  'Draw from Pixar character book',
  'Read from Disney Art Lectures, Volume One',
  'Read from Disney Art Lectures, Volume Two',
  'Paint from 50 Small Paintings and Acrylic book',
  'Paint from 50 More Small Paintings and Acrylic book',
  'Paint from 50 Paintings and Watercolor book',
  'Read from a random art book',
  'Paint',
  'Stained glass',
  'Calligraphy',
  'Draw something — Disney character',
  { title: 'Watercolor lessons on Teachable', link: 'teachable://' },
  { title: 'Calligraphy lesson on Teachable', link: 'teachable://' },
  { title: 'Painting lessons on Sentient', link: 'https://sentientacademy.com/start' },
]

export default function ArtLibrary({ onBack }) {
  return (
    <main className="app-shell library-shell art-library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Home</button>
      </header>

      <div className="art-library-heading">
        <span className="art-library-icon" aria-hidden="true"><Icon name="palette" size={27} /></span>
        <p className="eyebrow">Art</p>
        <h1 className="library-title">Make something today.</h1>
        <p className="library-intro">Choose what feels interesting or possible today. A little time making, learning, or looking closely counts.</p>
      </div>

      <section className="art-ideas" aria-label="Art ideas for today">
        {artIdeas.map((idea) => {
          const item = typeof idea === 'string' ? { title: idea } : idea
          return (
          <article className="art-idea" key={item.title}>
            {item.link ? (
              <span className="art-idea-circle" aria-hidden="true" />
            ) : (
              <span className="art-idea-palette" aria-hidden="true"><Icon name="palette" size={19} /></span>
            )}
            {item.link ? (
              <a
                href={item.link}
                target={item.link.startsWith('http') ? '_blank' : undefined}
                rel={item.link.startsWith('http') ? 'noreferrer' : undefined}
              >{item.title}</a>
            ) : (
              <span>{item.title}</span>
            )}
          </article>
          )
        })}
      </section>
    </main>
  )
}
