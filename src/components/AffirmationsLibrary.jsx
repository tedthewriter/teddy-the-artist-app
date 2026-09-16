import { useEffect, useMemo, useRef, useState } from 'react'
import { unzip } from 'fflate'
import Icon from './Icon'
import ResponseField from './ResponseField'
import { supabase } from '../lib/supabase'

const BUCKET = 'affirmation-pins'
const EXPECTED_PIN_COUNT = 107

function unzipBundle(file) {
  return file.arrayBuffer().then((buffer) => new Promise((resolve, reject) => {
    unzip(new Uint8Array(buffer), (error, entries) => {
      if (error) reject(error)
      else resolve(entries)
    })
  }))
}

export default function AffirmationsLibrary({
  items,
  favorites,
  loading,
  error,
  imageUrls,
  responses,
  onBack,
  onToggleFavorite,
  onImagesChanged,
  onSaveResponse,
  onDeleteResponse,
}) {
  const inputRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [storedCount, setStoredCount] = useState(null)
  const [importState, setImportState] = useState({ active: false, current: 0, total: 0, message: '' })

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => a.affirmation_number - b.affirmation_number),
    [items],
  )

  useEffect(() => {
    let active = true
    async function countPins() {
      if (!supabase) return
      const { data, error: listError } = await supabase.storage.from(BUCKET).list('pins', { limit: 200 })
      if (active && !listError) setStoredCount((data || []).filter((entry) => entry.name.endsWith('.png')).length)
    }
    countPins()
    return () => { active = false }
  }, [imageUrls])

  async function importBundle(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !supabase) return

    setImportState({ active: true, current: 0, total: EXPECTED_PIN_COUNT, message: 'Opening the pin bundle…' })
    try {
      const entries = await unzipBundle(file)
      const pins = new Map()

      Object.entries(entries).forEach(([name, bytes]) => {
        const match = name.match(/(?:^|\/)(\d{3})-[^/]+\.png$/i)
        if (match) pins.set(match[1], bytes)
      })

      if (pins.size !== EXPECTED_PIN_COUNT) {
        throw new Error(`This bundle contains ${pins.size} numbered pins. The complete bundle should contain ${EXPECTED_PIN_COUNT}.`)
      }

      const orderedPins = [...pins.entries()].sort(([a], [b]) => a.localeCompare(b))
      for (let index = 0; index < orderedPins.length; index += 1) {
        const [number, bytes] = orderedPins[index]
        setImportState({
          active: true,
          current: index,
          total: EXPECTED_PIN_COUNT,
          message: `Adding pin ${Number(number)} of ${EXPECTED_PIN_COUNT}…`,
        })
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(`pins/${number}.png`, new Blob([bytes], { type: 'image/png' }), {
            contentType: 'image/png',
            upsert: true,
          })
        if (uploadError) throw uploadError
      }

      setStoredCount(EXPECTED_PIN_COUNT)
      setImportState({ active: false, current: EXPECTED_PIN_COUNT, total: EXPECTED_PIN_COUNT, message: 'All 107 pins are ready.' })
      await onImagesChanged()
    } catch (importError) {
      setImportState({
        active: false,
        current: 0,
        total: 0,
        message: importError.message || 'The pin bundle could not be imported. Please try again.',
      })
    }
  }

  if (selected) {
    const imageUrl = imageUrls[selected.asset_path]
    return (
      <main className="app-shell library-shell">
        <header className="library-header">
          <button className="back-button" onClick={() => setSelected(null)}><Icon name="back" size={19} /> Collection</button>
          <button
            className={`icon-button ${favorites.has(selected.id) ? 'is-favorite' : ''}`}
            aria-label={favorites.has(selected.id) ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={favorites.has(selected.id)}
            onClick={() => onToggleFavorite(selected.id)}
          ><Icon name="bookmark" size={19} /></button>
        </header>
        <article className="affirmation-detail-card">
          {imageUrl ? <img src={imageUrl} alt={selected.title} /> : <div className="pin-placeholder">Pin {selected.affirmation_number}</div>}
          <p className="eyebrow">Affirmation {selected.affirmation_number}</p>
          <h1>{selected.title}</h1>
          <p className="affirmation-reflection">Take a moment with it. If you want, save what this affirmation brings to mind.</p>
          <div className="affirmation-response">
            <ResponseField
              contextType="content"
              contextId={selected.id}
              contentId={selected.id}
              responseKey="reflection"
              kind="text"
              label="Your reflection"
              prompt={`Reflection on affirmation ${selected.affirmation_number}: ${selected.title}`}
              record={responses.get(`content:${selected.id}:reflection`)}
              onSave={onSaveResponse}
              onDelete={onDeleteResponse}
            />
          </div>
        </article>
      </main>
    )
  }

  const progress = importState.total ? Math.round((importState.current / importState.total) * 100) : 0

  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Home</button>
      </header>
      <p className="eyebrow">Affirmations</p>
      <h1 className="library-title">A collection to return to.</h1>
      <p className="library-intro">Choose any pin that feels helpful today. Saved pins appear with a bookmark.</p>

      {storedCount !== EXPECTED_PIN_COUNT && (
        <section className="import-card">
          <p className="eyebrow">One-time setup</p>
          <h2>Add the affirmation artwork</h2>
          <p>The words are ready. Import the prepared ZIP once from a computer to add all 107 private images.</p>
          <input ref={inputRef} className="visually-hidden" type="file" accept=".zip,application/zip" onChange={importBundle} />
          <button className="primary-button" disabled={importState.active} onClick={() => inputRef.current?.click()}>
            {importState.active ? 'Importing…' : 'Choose affirmation ZIP'}
          </button>
          {importState.active && <progress className="import-progress" max="100" value={progress}>{progress}%</progress>}
          {importState.message && <p className="import-message" role="status">{importState.message}</p>}
        </section>
      )}

      {storedCount === EXPECTED_PIN_COUNT && importState.message && (
        <p className="library-status success" role="status">{importState.message}</p>
      )}
      {loading && <div className="library-status">Opening the collection…</div>}
      {error && <div className="library-status error" role="alert">{error}</div>}

      {!loading && !error && (
        <div className="affirmation-grid">
          {orderedItems.map((item) => (
            <button className="affirmation-tile" key={item.id} onClick={() => setSelected(item)}>
              {imageUrls[item.asset_path]
                ? <img src={imageUrls[item.asset_path]} alt="" loading="lazy" />
                : <span className="pin-placeholder">{item.affirmation_number}</span>}
              <span className="affirmation-tile-copy">
                <span>{item.title}</span>
                {favorites.has(item.id) && <Icon name="bookmark" size={16} />}
              </span>
            </button>
          ))}
        </div>
      )}
    </main>
  )
}
