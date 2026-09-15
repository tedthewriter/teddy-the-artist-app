import { useMemo, useState } from 'react'
import Icon from './Icon'

const scenes = [
  {
    id: 'whispering-gate',
    stage: 'Notice',
    chapter: 'The Whispering Gate',
    location: 'Mosslight Ruins',
    narration: 'Mara Vale reaches a stone gate covered in shifting faces. A whisper follows her: “You will get this wrong.” The gate seems to grow heavier each time the words repeat.',
    prompt: 'What should Mara notice first?',
    choices: [
      {
        label: 'Name the whisper as the Judge',
        skill: 'The Judge',
        response: '“That sounds like the Judge,” Mara says. The whisper becomes a sound—not a command—and the first compass mark glows.',
      },
      {
        label: 'Notice the thought, feeling, and urge',
        skill: 'Understanding the CBT Loop',
        response: 'Mara notices the thought, the tightness in her shoulders, and the urge to turn back. Seeing the whole loop gives her room to choose.',
      },
      {
        label: 'Ask what else might be true',
        skill: 'Explore',
        response: 'Mara studies the gate with curiosity. The whisper may be a warning, a trick, or only an echo. More than one explanation is possible.',
      },
    ],
  },
  {
    id: 'echo-gallery',
    stage: 'Regulate',
    chapter: 'The Echo Gallery',
    location: 'Hall of Blue Stone',
    narration: 'Inside, bells ring without being touched. Their echoes overlap until it is hard to think. Tiny painted tiles line the wall, and cool stone rests under Mara’s boots.',
    prompt: 'Where can Mara gently place her attention?',
    choices: [
      {
        label: 'Feel the ridges of her fingertips',
        skill: 'What Is a PQ Rep?',
        response: 'Mara rubs one fingertip against her thumb and notices ridges, warmth, and pressure. The bells are still there, but they no longer fill everything.',
      },
      {
        label: 'Notice both feet on the stone',
        skill: 'What Is a PQ Rep?',
        response: 'She feels the floor supporting both feet and notices where her weight rests. Her attention returns to the room she is actually in.',
      },
      {
        label: 'Study one blue tile closely',
        skill: 'What Is a PQ Rep?',
        response: 'She studies one blue tile—its color, chipped edge, and tiny brush marks. The echoes soften around that single clear detail.',
      },
    ],
  },
  {
    id: 'mirror-map',
    stage: 'Understand',
    chapter: 'The Mirror Map',
    location: 'Cartographer’s Chamber',
    narration: 'A mirrored map shows three different routes and insists each one is the only route. Mara’s first thought is that choosing imperfectly will ruin the expedition.',
    prompt: 'How can Mara understand what is happening?',
    choices: [
      {
        label: 'Separate the facts from the story',
        skill: 'CBT in Plain Language',
        response: 'The fact: there are three routes. The story: only a perfect choice will work. Mara writes them separately, and the mirror stops pretending they are the same.',
      },
      {
        label: 'Follow the thought-feeling-action loop',
        skill: 'Understanding the CBT Loop',
        response: 'Mara sees how “I must choose perfectly” creates fear and the urge to freeze. The map changes when she notices where the loop can loosen.',
      },
      {
        label: 'Gather more information with curiosity',
        skill: 'Explore',
        response: 'Instead of rushing, Mara looks for footprints, airflow, and markings. Curiosity reveals information that judgment had hidden.',
      },
    ],
  },
  {
    id: 'lantern-keeper',
    stage: 'Connect',
    chapter: 'The Lantern Keeper',
    location: 'Bridge of Small Stars',
    narration: 'A nervous lantern keeper guards the bridge. “People only come when they need something,” she says. Mara needs help crossing, but the keeper also needs to feel seen.',
    prompt: 'How can Mara begin the conversation?',
    choices: [
      {
        label: 'Begin with truthful kindness',
        skill: 'Empathize',
        response: 'Mara acknowledges how lonely the bridge can feel and does not rush past it. The keeper’s shoulders settle before they talk about crossing.',
      },
      {
        label: 'Ask an open, curious question',
        skill: 'Explore',
        response: '“What do you wish visitors understood?” Mara asks. The keeper tells her about the bridge—and about the part that has been broken for years.',
      },
      {
        label: 'Name the value she wants to carry',
        skill: 'Navigate',
        response: 'Mara chooses to be both honest and respectful. She asks for help without treating the keeper like another obstacle.',
      },
    ],
  },
  {
    id: 'compass-vault',
    stage: 'Move forward',
    chapter: 'The Compass Vault',
    location: 'Heart of the Ruins',
    narration: 'The final door has no handle. Symbols suggest several ways forward: invent a tool, follow the value carved into the compass, or begin with one small action.',
    prompt: 'Which kind of wise response fits this moment?',
    choices: [
      {
        label: 'Imagine a new way to open it',
        skill: 'Innovate',
        response: 'Mara combines a lantern lens and a mirrored tile. A path of light appears across the door—an answer that did not exist until she tried it.',
      },
      {
        label: 'Choose the direction that reflects her values',
        skill: 'Navigate',
        response: 'The compass points toward the words “courage with kindness.” Mara follows that direction, and the matching symbol begins to glow.',
      },
      {
        label: 'Take the next small, useful step',
        skill: 'Activate',
        response: 'Mara stops trying to solve the whole vault. She presses the first clear symbol. One piece moves, then another, and a way forward opens.',
      },
    ],
  },
]

const skillOrder = [
  'CBT in Plain Language',
  'Understanding the CBT Loop',
  'The Judge',
  'What Is a PQ Rep?',
  'Empathize',
  'Explore',
  'Innovate',
  'Navigate',
  'Activate',
]

function ExplorerSprite() {
  return (
    <div className="pixel-explorer" aria-label="Mara Vale, an adventurer with a teal jacket, satchel, and lantern">
      <span className="pixel-hat" />
      <span className="pixel-head" />
      <span className="pixel-hair" />
      <span className="pixel-body" />
      <span className="pixel-satchel" />
      <span className="pixel-legs" />
      <span className="pixel-lantern" />
    </div>
  )
}

export default function GameAdventure({ items, onBack, onOpenSkill }) {
  const [started, setStarted] = useState(false)
  const [sceneIndex, setSceneIndex] = useState(0)
  const [outcome, setOutcome] = useState(null)
  const [satchelOpen, setSatchelOpen] = useState(false)
  const availableSkills = useMemo(
    () => skillOrder.map((title) => items.find((item) => item.title === title)).filter(Boolean),
    [items],
  )
  const scene = scenes[sceneIndex]
  const finished = sceneIndex >= scenes.length
  const matchedSkill = outcome ? items.find((item) => item.title === outcome.skill) : null

  function begin() {
    setStarted(true)
    setSceneIndex(0)
    setOutcome(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function choose(choice) {
    setOutcome(choice)
    window.setTimeout(() => document.querySelector('.game-outcome')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 20)
  }

  function continueJourney() {
    setOutcome(null)
    setSceneIndex((current) => current + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function restart() {
    setSceneIndex(0)
    setOutcome(null)
    setStarted(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="game-shell">
      <header className="game-header">
        <button className="game-back-button" onClick={onBack}><Icon name="back" size={18} /> Home</button>
        {started && !finished && <span className="game-stage-count">Chapter {sceneIndex + 1} of {scenes.length}</span>}
      </header>

      {!started ? (
        <section className="game-intro">
          <div className="pixel-scene intro-scene" aria-hidden="true">
            <span className="pixel-moon" />
            <span className="pixel-ruin ruin-left" />
            <span className="pixel-ruin ruin-right" />
            <ExplorerSprite />
          </div>
          <p className="game-kicker">A Teddy the Artist adventure</p>
          <h1>Mara Vale and the Compass of Quiet Ruins</h1>
          <p className="game-intro-copy">Explore an unusual ruin, solve its mysteries, and practice useful skills along the way. There are no scores and no perfect route—just choices and discoveries.</p>
          <button className="game-primary-button" onClick={begin}>Begin the journey <Icon name="arrow" size={18} /></button>
          <button className="game-satchel-button" onClick={() => setSatchelOpen((open) => !open)} aria-expanded={satchelOpen}>
            <Icon name="toolbox" size={18} /> {satchelOpen ? 'Close skill satchel' : 'Open skill satchel'}
          </button>
          {satchelOpen && (
            <div className="game-skill-satchel">
              <p>These approved skills are available from the beginning.</p>
              <div className="game-skill-list">
                {availableSkills.map((skill) => (
                  <button key={skill.id} onClick={() => onOpenSkill(skill)}>{skill.title}<Icon name="arrow" size={15} /></button>
                ))}
              </div>
            </div>
          )}
        </section>
      ) : finished ? (
        <section className="game-ending">
          <div className="pixel-scene ending-scene" aria-hidden="true">
            <span className="pixel-compass" />
            <span className="pixel-light-beam" />
            <ExplorerSprite />
          </div>
          <p className="game-kicker">The compass is whole</p>
          <h1>Every route taught Mara something.</h1>
          <p>Mara leaves the ruins with five kinds of help: notice what is happening, return to the present, understand the pattern, connect with care, and choose a manageable next step.</p>
          <blockquote>“A wise path is not always the perfect path. It is the next path you choose with awareness.”</blockquote>
          <button className="game-primary-button" onClick={restart}>Play again</button>
          <button className="game-secondary-button" onClick={onBack}>Return home</button>
        </section>
      ) : (
        <section className="game-chapter">
          <div className={`pixel-scene scene-${scene.id}`} aria-hidden="true">
            <span className="pixel-moon" />
            <span className="pixel-ruin ruin-left" />
            <span className="pixel-ruin ruin-right" />
            <span className="pixel-path" />
            <ExplorerSprite />
          </div>
          <div className="game-location-row">
            <span>{scene.stage}</span>
            <span>{scene.location}</span>
          </div>
          <h1>{scene.chapter}</h1>
          <p className="game-narration">{scene.narration}</p>

          {!outcome ? (
            <div className="game-choice-panel">
              <h2>{scene.prompt}</h2>
              <div className="game-choices">
                {scene.choices.map((choice) => (
                  <button key={choice.label} onClick={() => choose(choice)}>
                    <span>{choice.label}</span>
                    <small>{choice.skill}</small>
                  </button>
                ))}
              </div>
              <p className="game-choice-note">Choose the response that feels useful. You can explore a different route next time.</p>
            </div>
          ) : (
            <div className="game-outcome" role="status">
              <p className="game-outcome-label">{outcome.skill}</p>
              <p>{outcome.response}</p>
              <div className="game-outcome-actions">
                <button className="game-primary-button" onClick={continueJourney}>
                  {sceneIndex === scenes.length - 1 ? 'Open the vault' : 'Continue'} <Icon name="arrow" size={17} />
                </button>
                {matchedSkill && <button className="game-secondary-button" onClick={() => onOpenSkill(matchedSkill)}>Read this skill</button>}
                <button className="game-text-button" onClick={() => setOutcome(null)}>Choose another response</button>
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
