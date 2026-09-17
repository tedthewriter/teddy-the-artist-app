import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { supabase } from '../lib/supabase'

const VISION_BUCKET = 'vision-boards'
const VISION_FILE = 'vision-board'
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const goals = [
  {
    title: 'Teach art lessons',
    description: 'Teach children and adults from home, helping others discover the joy of creating.',
  },
  {
    title: 'Paint the Savior',
    description: 'Create paintings that uplift faith and touch hearts, with the skill to accept commissions for the Church.',
  },
  {
    title: 'Show work at the Springville Museum',
    description: 'Prepare strong work, submit it, and take the courageous step of letting it be considered.',
    link: 'https://www.smofa.org/40th-annual-spiritual-and-religious-show-for-artists',
    linkLabel: 'View exhibition information',
  },
  {
    title: 'Exhibit in a gallery or show',
    description: 'Share the work publicly, connect with viewers and collectors, and allow it to make an impact.',
  },
  {
    title: 'Compete in Spring City plein air',
    description: 'Paint from life, participate in the plein-air community, and submit work to the competition and show.',
  },
  {
    title: 'Enter the Church International Art Competition',
    description: 'Develop and submit meaningful sacred work when the next competition opens in 2027.',
  },
  {
    title: 'Pursue Havenlight licensing',
    description: 'Build a body of sacred artwork strong enough to submit for professional licensing.',
    link: 'https://havenlight.com/pages/copy-of-havenlight-licensing',
    linkLabel: 'View licensing information',
  },
  {
    title: 'Celebrate God’s creating',
    description: 'Create art that helps people notice the Creator through people, landscape, light, and the natural world.',
  },
  {
    title: 'Build a social presence',
    description: 'Show the work, share demonstrations, teach artistic processes, and build a creative community.',
  },
  {
    title: 'Take a France painting trip',
    description: 'Celebrate our 30th anniversary with a creative adventure filled with painting, discovery, and time together.',
  },
  {
    title: 'Pursue an MFA',
    description: 'Deepen artistic skill and knowledge when the time is right, using this studio practice as preparation rather than a substitute.',
  },
]

export default function GoalsVision({ userId, onBack }) {
  const inputRef = useRef(null)
  const [boardUrl, setBoardUrl] = useState('')
  const [boardState, setBoardState] = useState({ loading: Boolean(userId), saving: false, message: '' })
  const boardPath = userId ? `${userId}/${VISION_FILE}` : ''

  async function loadBoard() {
    if (!supabase || !boardPath) {
      setBoardState({ loading: false, saving: false, message: '' })
      return
    }

    setBoardState((current) => ({ ...current, loading: true, message: '' }))
    const { data: files, error: listError } = await supabase.storage
      .from(VISION_BUCKET)
      .list(userId, { limit: 10, search: VISION_FILE })

    if (listError) {
      setBoardState({ loading: false, saving: false, message: 'The vision board could not be opened. Please try again.' })
      return
    }

    if (!(files || []).some((file) => file.name === VISION_FILE)) {
      setBoardUrl('')
      setBoardState({ loading: false, saving: false, message: '' })
      return
    }

    const { data, error } = await supabase.storage
      .from(VISION_BUCKET)
      .createSignedUrl(boardPath, 60 * 60 * 24)

    if (error || !data?.signedUrl) {
      setBoardState({ loading: false, saving: false, message: 'The vision board could not be opened. Please try again.' })
      return
    }

    setBoardUrl(data.signedUrl)
    setBoardState({ loading: false, saving: false, message: '' })
  }

  useEffect(() => { loadBoard() }, [boardPath])

  async function uploadBoard(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !supabase || !boardPath) return

    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      setBoardState({ loading: false, saving: false, message: 'Choose a JPEG, PNG, or WebP image.' })
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setBoardState({ loading: false, saving: false, message: 'Choose an image smaller than 10 MB.' })
      return
    }

    setBoardState({ loading: false, saving: true, message: 'Saving the private vision board…' })
    const { error } = await supabase.storage
      .from(VISION_BUCKET)
      .upload(boardPath, file, {
        cacheControl: '3600',
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      setBoardState({ loading: false, saving: false, message: 'The image could not be saved. Please try again.' })
      return
    }

    await loadBoard()
  }

  return (
    <main className="app-shell library-shell vision-page">
      <header className="library-header">
        <button className="back-button" type="button" onClick={onBack}>
          <Icon name="back" size={18} /> Home
        </button>
      </header>

      <section>
        <p className="eyebrow">Dream big. Create with purpose.</p>
        <h1 className="library-title">Goals &amp; Vision</h1>
        <p className="library-intro">Faith, art, and impact—a vision for the artist you are becoming.</p>
      </section>

      <section className="vision-board-card" aria-label="Private vision board">
        {boardState.loading ? (
          <div className="vision-board-empty">Opening your private vision board…</div>
        ) : boardUrl ? (
          <img src={boardUrl} alt="Dream Big, Create with Purpose art vision board" />
        ) : (
          <div className="vision-board-empty">
            <span className="vision-board-empty-icon"><Icon name="vision" size={28} /></span>
            <h2>Add the vision board</h2>
            <p>Choose the photo once from this phone. It will be kept in private app storage.</p>
          </div>
        )}
        <div className="vision-board-footer">
          <p>Stay faithful. Keep creating. The best is yet to come.</p>
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={uploadBoard}
          />
          <button
            className="vision-board-upload"
            type="button"
            disabled={boardState.saving}
            onClick={() => inputRef.current?.click()}
          >
            <Icon name="vision" size={16} />
            {boardState.saving ? 'Saving…' : boardUrl ? 'Replace photo' : 'Choose photo'}
          </button>
          {boardState.message && <span className={boardState.saving ? '' : 'error'} role="status">{boardState.message}</span>}
        </div>
      </section>

      <section className="vision-scripture-card">
        <span className="vision-scripture-icon"><Icon name="spark" size={23} /></span>
        <div>
          <p className="eyebrow">A guiding theme</p>
          <blockquote>“All things denote there is a God.”</blockquote>
          <cite>Alma 30:44</cite>
        </div>
      </section>

      <section className="vision-goals" aria-labelledby="vision-goals-title">
        <p className="eyebrow">The vision in words</p>
        <h2 id="vision-goals-title">What I’m creating toward</h2>
        <div className="vision-goal-list">
          {goals.map((goal, index) => (
            <article className="vision-goal-card" key={goal.title}>
              <span className="vision-goal-number">{index + 1}</span>
              <div>
                <h3>{goal.title}</h3>
                <p>{goal.description}</p>
                {goal.link && (
                  <a href={goal.link} target="_blank" rel="noreferrer">{goal.linkLabel}</a>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <p className="vision-closing">With faith, hard work, and creativity, I can do all things.</p>
    </main>
  )
}
