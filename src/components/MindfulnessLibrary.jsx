import { useState } from 'react'
import Icon from './Icon'

const practices = [
  {
    title: '5-4-3-2-1 Sensory Grounding',
    icon: 'mindfulness',
    minutes: '2–3 min',
    description: 'Use your five senses to return attention to what is here, right now.',
    when: 'When thoughts are racing, you feel disconnected, or anxiety is pulling you into the future.',
    why: 'Deliberately noticing sights, touch, sounds, smells, and taste anchors attention in present physical reality.',
    steps: [
      'Name 5 things you can see.',
      'Name 4 things you can physically feel.',
      'Name 3 things you can hear.',
      'Name 2 things you can smell.',
      'Name 1 thing you can taste.',
    ],
  },
  {
    title: 'EFT Tapping',
    icon: 'spark',
    minutes: '3–5 min',
    description: 'Pair gentle tapping with steady attention to a feeling or calming phrase.',
    when: 'When an emotion feels intense and you want a simple, physical way to pause with it.',
    why: 'Tapping combines focused attention with a repetitive, gentle action. Some evidence suggests it may help reduce anxiety, though its exact mechanism is not settled.',
    steps: [
      'Name the feeling you are carrying, or choose a calming phrase such as “I can be with this moment.”',
      'Using two fingers, tap gently 5–7 times on each point: forehead; temple/outer eye; below the eye; under the nose; chin crease; collarbone; side under a lifted arm; top of the head.',
      'Keep your attention on the feeling or phrase as you move through the points.',
      'Pause and notice whether the intensity has shifted, even slightly.',
    ],
    safety: 'Keep the tapping gentle. Skip any area that is tender, injured, or uncomfortable.',
  },
  {
    title: 'Barefoot Grounding',
    icon: 'compass',
    minutes: '5–10 min',
    description: 'Walk slowly outside while noticing the ground beneath your feet.',
    when: 'When you have safe access to grass, soil, or sand and want a body-based reset outdoors.',
    why: 'Direct attention to the sensations of walking and the surrounding environment can interrupt rumination and reconnect you with the present.',
    steps: [
      'Choose a safe, clean surface such as grass, soil, or sand.',
      'Step outside barefoot and begin walking slowly.',
      'Notice pressure, temperature, texture, and the movement of each foot.',
      'When your mind wanders, gently return to the sensation under your soles.',
    ],
    safety: 'Check the ground first. Wear shoes instead if there may be sharp objects, extreme temperatures, or any foot-health concern.',
  },
  {
    title: 'Box Breathing',
    icon: 'mindfulness',
    minutes: '2–4 min',
    description: 'Use a simple four-count rhythm to slow down and steady your attention.',
    when: 'When you want a brief pause before responding, starting a task, or entering a stressful situation.',
    why: 'A comfortable, even breathing rhythm gives your attention a predictable anchor and may help the body settle.',
    steps: [
      'Inhale gently through your nose for a count of 4.',
      'Hold comfortably for a count of 4.',
      'Exhale gently through your mouth for a count of 4.',
      'Pause comfortably for a count of 4, then repeat for up to 4 cycles.',
    ],
    safety: 'Keep the breath easy rather than forced. If you feel dizzy, light-headed, or uncomfortable, return to normal breathing.',
  },
  {
    title: 'Cold Water Reset',
    icon: 'sun',
    minutes: '1–2 min',
    description: 'Use a brief cool sensation on the face as a simple reset during overwhelm.',
    when: 'When you are physically activated and a cool, sensory interruption sounds supportive.',
    why: 'Brief facial cooling may help redirect attention and support a calmer physiological response.',
    steps: [
      'Sit or stand somewhere stable.',
      'Splash cool water on your face, or place a cool wet cloth across your eyes and cheeks for 10–15 seconds.',
      'Breathe normally and notice the cool sensation.',
      'Remove the cloth, pause, and repeat once only if it still feels comfortable.',
    ],
    safety: 'Do not do breath-holding or use this in or near water. Skip it and ask a clinician first if you have a heart condition, fainting history, or cold sensitivity. Stop if it feels distressing.',
  },
  {
    title: 'Low Humming',
    icon: 'spark',
    minutes: '1–3 min',
    description: 'Lengthen the exhale with a low, comfortable hum.',
    when: 'When you want a quiet practice that feels soothing in the throat and chest.',
    why: 'A slow exhale and gentle vocal vibration can give attention and the body a simple calming rhythm.',
    steps: [
      'Inhale comfortably through your nose.',
      'On the exhale, hum one low, steady tone for as long as is comfortable.',
      'Notice the vibration in your throat or chest.',
      'Rest for a normal breath and repeat 3–5 times.',
    ],
    safety: 'Keep the hum easy and quiet. Stop if it strains your throat, causes dizziness, or feels unpleasant.',
  },
  {
    title: 'Leaves on a Stream',
    icon: 'thought',
    minutes: '3–5 min',
    description: 'Practice noticing thoughts without needing to argue with or obey them.',
    when: 'When self-critical thoughts, worries, or judgments keep repeating.',
    why: 'This is a cognitive-defusion exercise: it treats thoughts as passing mental events rather than facts that require action.',
    steps: [
      'Picture yourself sitting beside a gently flowing stream.',
      'When a thought or judgment appears, place it on a leaf.',
      'Watch the leaf float downstream and out of view.',
      'If the thought returns, place it on another leaf and let it pass again.',
    ],
  },
  {
    title: 'Body Scan & Tension Release',
    icon: 'mindfulness',
    minutes: '5–8 min',
    description: 'Notice tension from toes to head and soften it a little at a time.',
    when: 'When stress is showing up as a tight jaw, raised shoulders, clenched hands, or a knotted stomach.',
    why: 'A slow body scan strengthens awareness of early physical stress signals and creates a chance to release unnecessary muscle grip.',
    steps: [
      'Start at your toes and slowly move your attention upward toward the crown of your head.',
      'Pause at each area and notice sensation without judging it.',
      'When you find tightness, breathe out and invite the muscles to soften a little.',
      'Pay special attention to the jaw, shoulders, hands, and stomach.',
    ],
  },
  {
    title: 'Single-Task Focus Workout',
    icon: 'journal',
    minutes: '5–15 min',
    description: 'Turn one ordinary activity into a practical mindfulness repetition.',
    when: 'When formal meditation sounds unappealing but you need practice leaving autopilot.',
    why: 'Giving one routine activity your full attention builds the habit of returning to the present without adding another task to your day.',
    steps: [
      'Choose one simple activity: making tea, washing dishes, folding laundry, or a short walk.',
      'For the next few minutes, do only that activity.',
      'Notice textures, temperatures, sounds, movements, and small visual details.',
      'Each time you notice your mind elsewhere, gently return to the next physical action.',
    ],
  },
  {
    title: 'Compassionate Self-Touch',
    icon: 'heart',
    minutes: '1–3 min',
    description: 'Use safe, comforting touch and a supportive phrase to meet yourself with kindness.',
    when: 'When self-judgment is loud or you need a small reminder of safety and care.',
    why: 'Warm, gentle contact paired with supportive words can help shift attention away from harsh inner criticism and toward care.',
    steps: [
      'Place one hand over your heart and one over your belly, or offer yourself a soft hug.',
      'Take 3 slow, comfortable breaths.',
      'Say a phrase such as “I am safe right now,” “This is hard, and I can be kind to myself,” or words that feel genuine to you.',
      'Let your hands stay where they are for one more breath before moving on.',
    ],
  },
]

function PracticeDetail({ practice, onBack }) {
  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Mindfulness</button>
      </header>

      <article className="content-detail-card">
        <p className="content-kind">Mindfulness & regulation · {practice.minutes}</p>
        <h1>{practice.title}</h1>
        <p className="detail-lead">{practice.description}</p>

        <section className="detail-section">
          <h3>Use this when</h3>
          <p>{practice.when}</p>
        </section>
        <section className="detail-section">
          <h3>Why it can help</h3>
          <p>{practice.why}</p>
        </section>
        <section className="detail-section">
          <h3>Try it now</h3>
          <ol>{practice.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </section>
        {practice.safety && <p className="gentle-callout">{practice.safety}</p>}

        <footer className="source-note">
          <span>Choose a practice that feels manageable. You can stop or switch at any time.</span>
        </footer>
      </article>
    </main>
  )
}

export default function MindfulnessLibrary({ onBack }) {
  const [selected, setSelected] = useState(null)

  if (selected) return <PracticeDetail practice={selected} onBack={() => setSelected(null)} />

  return (
    <main className="app-shell library-shell">
      <header className="library-header">
        <button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Home</button>
      </header>
      <p className="eyebrow">Mindfulness</p>
      <h1 className="library-title">Settle your system.</h1>
      <p className="library-intro">Ten short practices for grounding, attention, and gentle nervous-system regulation. Choose the one that fits this moment.</p>

      <div className="content-list" aria-label="Mindfulness practices">
        {practices.map((practice) => (
          <button className="content-card" key={practice.title} onClick={() => setSelected(practice)}>
            <span className="content-dot" aria-hidden="true" />
            <span className="content-card-copy">
              <span className="content-card-title">{practice.title}</span>
              <span className="content-card-description">{practice.description}</span>
              <span className="content-card-meta">{practice.minutes}</span>
            </span>
            <Icon name="arrow" size={18} />
          </button>
        ))}
      </div>

      <p className="support-note">These practices are optional self-support tools, not a replacement for professional care. Stop any practice that makes you feel worse, and reach out for support when needed.</p>
    </main>
  )
}
