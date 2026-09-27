import Icon from './Icon'

const artIdeas = [
  'Casey Childs weekly demo email',
  'Casey Childs studio session',
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
  'Watercolor lessons on Teachable',
  'Calligraphy lesson on Teachable',
  'Painting lessons on Sentient',
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
        {artIdeas.map((idea) => (
          <article className="art-idea" key={idea}>
            <span className="art-idea-circle" aria-hidden="true" />
            <span>{idea}</span>
          </article>
        ))}
      </section>
    </main>
  )
}
