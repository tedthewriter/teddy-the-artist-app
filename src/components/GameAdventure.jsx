import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'

const WORLD_WIDTH = 320
const WORLD_HEIGHT = 224
const PLAYER_WIDTH = 12
const PLAYER_HEIGHT = 17

const encounters = [
  {
    id: 'gate', stage: 'Notice', title: 'The Whispering Gate', location: 'Northwest arch',
    prompt: 'The gate whispers, “You will get this wrong.” What could Mara notice?',
    object: { x: 28, y: 25, w: 64, h: 38 }, zone: { x: 20, y: 18, w: 82, h: 69 },
    choices: [
      { label: 'Name the whisper as the Judge', skill: 'The Judge', response: '“That sounds like the Judge,” Mara says. The whisper becomes a sound—not a command—and the stone faces fall quiet.' },
      { label: 'Notice the thought, feeling, and urge', skill: 'Understanding the CBT Loop', response: 'Mara notices the thought, the tightness in her shoulders, and the urge to turn back. Seeing the whole loop gives her room to choose.' },
      { label: 'Ask what else might be true', skill: 'Explore', response: 'The whisper may be a warning, a trick, or only an echo. Curiosity makes more than one explanation possible.' },
    ],
  },
  {
    id: 'pool', stage: 'Regulate', title: 'The Echo Pool', location: 'Center court',
    prompt: 'Overlapping bells make it hard to think. Where could Mara gently place her attention?',
    object: { x: 126, y: 52, w: 68, h: 42 }, zone: { x: 113, y: 40, w: 94, h: 73 },
    choices: [
      { label: 'Feel the ridges of her fingertips', skill: 'What Is a PQ Rep?', response: 'Mara notices ridges, warmth, and pressure. The bells remain, but they no longer fill everything.' },
      { label: 'Notice both feet on the stone', skill: 'What Is a PQ Rep?', response: 'She feels the floor supporting both feet and notices where her weight rests. Her attention returns to the room she is actually in.' },
      { label: 'Study one blue tile closely', skill: 'What Is a PQ Rep?', response: 'She studies its color, chipped edge, and tiny brush marks. The echoes soften around that single clear detail.' },
    ],
  },
  {
    id: 'mirror', stage: 'Understand', title: 'The Mirror Map', location: 'Northeast chamber',
    prompt: 'The map insists there is only one perfect route. How could Mara understand the trap?',
    object: { x: 234, y: 27, w: 48, h: 52 }, zone: { x: 220, y: 18, w: 77, h: 79 },
    choices: [
      { label: 'Separate the facts from the story', skill: 'CBT in Plain Language', response: 'Fact: there are three routes. Story: only a perfect choice will work. The mirror stops pretending they are the same.' },
      { label: 'Follow the thought-feeling-action loop', skill: 'Understanding the CBT Loop', response: 'Mara sees how “I must choose perfectly” creates fear and the urge to freeze. She can now see where the loop might loosen.' },
      { label: 'Gather more information with curiosity', skill: 'Explore', response: 'Mara looks for footprints, airflow, and markings. Curiosity reveals information that judgment had hidden.' },
    ],
  },
  {
    id: 'lantern', stage: 'Connect', title: 'The Lantern Keeper', location: 'Southwest bridge',
    prompt: 'The keeper expects to be treated like another obstacle. How could Mara begin?',
    object: { x: 45, y: 133, w: 53, h: 42 }, zone: { x: 30, y: 114, w: 83, h: 79 },
    choices: [
      { label: 'Begin with truthful kindness', skill: 'Empathize', response: 'Mara acknowledges how lonely the bridge can feel and does not rush past it. The keeper’s shoulders settle.' },
      { label: 'Ask an open, curious question', skill: 'Explore', response: '“What do you wish visitors understood?” Mara asks. The keeper tells her about the bridge—and about herself.' },
      { label: 'Name the value she wants to carry', skill: 'Navigate', response: 'Mara chooses honesty and respect. She asks for help without treating the keeper like part of the machinery.' },
    ],
  },
  {
    id: 'vault', stage: 'Move forward', title: 'The Compass Vault', location: 'Southeast shrine',
    prompt: 'The final mechanism has no handle. Which kind of wise response fits this moment?',
    object: { x: 218, y: 132, w: 67, h: 51 }, zone: { x: 203, y: 114, w: 96, h: 84 },
    choices: [
      { label: 'Imagine a new way to open it', skill: 'Innovate', response: 'Mara combines a lantern lens and a mirrored tile. A path of light appears—an answer that did not exist until she tried it.' },
      { label: 'Choose the direction that reflects her values', skill: 'Navigate', response: 'The compass points toward “courage with kindness.” Mara follows that direction, and the matching symbol glows.' },
      { label: 'Take the next small, useful step', skill: 'Activate', response: 'Mara presses the first clear symbol instead of solving everything at once. One piece moves, then another.' },
    ],
  },
]

const blocks = [
  { x: 0, y: 0, w: WORLD_WIDTH, h: 16 }, { x: 0, y: WORLD_HEIGHT - 16, w: WORLD_WIDTH, h: 16 },
  { x: 0, y: 0, w: 16, h: WORLD_HEIGHT }, { x: WORLD_WIDTH - 16, y: 0, w: 16, h: WORLD_HEIGHT },
  ...encounters.map((encounter) => encounter.object), { x: 107, y: 122, w: 28, h: 25 }, { x: 171, y: 133, w: 25, h: 29 },
]

const skillOrder = ['CBT in Plain Language', 'Understanding the CBT Loop', 'The Judge', 'What Is a PQ Rep?', 'Empathize', 'Explore', 'Innovate', 'Navigate', 'Activate']

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function drawStone(ctx, x, y, w, h, light = '#6f7c63', dark = '#45594f') {
  ctx.fillStyle = dark
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = light
  for (let row = 0; row < h; row += 8) {
    for (let col = row % 16 === 0 ? 0 : 8; col < w; col += 16) ctx.fillRect(x + col + 1, y + row + 1, Math.min(13, w - col - 2), 5)
  }
}

function drawExplorer(ctx, player, tick) {
  const x = Math.round(player.x)
  const y = Math.round(player.y)
  const walking = player.moving && Math.floor(tick / 130) % 2 === 0
  const faceLeft = player.direction === 'left'
  ctx.fillStyle = 'rgba(8,20,23,.35)'; ctx.fillRect(x + 1, y + 15, 11, 3)
  ctx.fillStyle = '#2c2028'; ctx.fillRect(x + 2, y + 2, 8, 7); ctx.fillRect(faceLeft ? x + 1 : x + 3, y + 5, 8, 6)
  ctx.fillStyle = '#d89a6f'; ctx.fillRect(x + 3, y + 4, 6, 5)
  ctx.fillStyle = '#8f5b34'; ctx.fillRect(x + 1, y + 1, 10, 2); ctx.fillRect(x + 3, y, 6, 2)
  ctx.fillStyle = '#2d817a'; ctx.fillRect(x + 2, y + 9, 8, 6)
  ctx.fillStyle = '#174e4d'; ctx.fillRect(x + 2, y + 13, 3, 3); ctx.fillRect(x + 7, y + 13, 3, 3)
  ctx.fillStyle = '#e8c052'; ctx.fillRect(faceLeft ? x : x + 10, y + 10, 2, 3)
  ctx.fillStyle = '#231f25'; ctx.fillRect(x + (walking ? 1 : 2), y + 16, 4, 1); ctx.fillRect(x + (walking ? 7 : 6), y + 16, 4, 1)
}

function drawWorld(ctx, player, nearbyId, tick, started) {
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
  ctx.fillStyle = '#385a4e'; ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
  for (let y = 16; y < WORLD_HEIGHT - 16; y += 16) {
    for (let x = 16; x < WORLD_WIDTH - 16; x += 16) {
      ctx.fillStyle = (x / 16 + y / 16) % 2 ? '#3f6254' : '#456958'; ctx.fillRect(x, y, 16, 16)
      ctx.fillStyle = '#527361'; ctx.fillRect(x + 3, y + 3, 2, 2)
    }
  }
  ctx.fillStyle = '#9a7447'; ctx.fillRect(100, 104, 120, 10); ctx.fillRect(151, 16, 12, 192)
  ctx.fillStyle = '#bd9255'; ctx.fillRect(102, 106, 116, 4); ctx.fillRect(154, 18, 6, 188)
  drawStone(ctx, 0, 0, WORLD_WIDTH, 16); drawStone(ctx, 0, WORLD_HEIGHT - 16, WORLD_WIDTH, 16); drawStone(ctx, 0, 0, 16, WORLD_HEIGHT); drawStone(ctx, WORLD_WIDTH - 16, 0, 16, WORLD_HEIGHT)

  drawStone(ctx, 28, 25, 64, 38, '#879173', '#526357')
  ctx.fillStyle = '#182f31'; ctx.fillRect(48, 38, 25, 25); ctx.fillStyle = '#d7a84f'; ctx.fillRect(56, 45, 9, 2)
  ctx.fillStyle = '#173f4d'; ctx.fillRect(126, 52, 68, 42); ctx.fillStyle = '#2d7e91'; ctx.fillRect(130, 56, 60, 34)
  ctx.fillStyle = '#6ec0c2'; ctx.fillRect(138 + Math.floor(tick / 400) % 8, 64, 28, 2); ctx.fillRect(150 - Math.floor(tick / 500) % 7, 78, 29, 2)
  drawStone(ctx, 234, 27, 48, 52); ctx.fillStyle = '#d9d59b'; ctx.fillRect(240, 33, 36, 40); ctx.fillStyle = '#5a7890'; ctx.fillRect(244, 37, 28, 32); ctx.fillStyle = '#bfe0d8'; ctx.fillRect(247, 39, 3, 27)
  ctx.fillStyle = '#6e4a32'; ctx.fillRect(45, 142, 53, 33); ctx.fillStyle = '#a57442'; for (let x = 48; x < 96; x += 9) ctx.fillRect(x, 145, 6, 27)
  ctx.fillStyle = '#f1c759'; ctx.fillRect(65, 133, 12, 13); ctx.fillStyle = 'rgba(241,199,89,.18)'; ctx.fillRect(57, 127, 28, 26)
  drawStone(ctx, 218, 132, 67, 51, '#747a65', '#414f49'); ctx.fillStyle = '#253d3c'; ctx.fillRect(232, 143, 38, 40); ctx.fillStyle = '#d4a744'; ctx.fillRect(247, 149, 8, 24); ctx.fillRect(239, 157, 24, 8)
  drawStone(ctx, 107, 122, 28, 25); drawStone(ctx, 171, 133, 25, 29)

  encounters.forEach((encounter, index) => {
    const pulse = Math.floor(tick / 280 + index) % 2
    const cx = encounter.object.x + Math.floor(encounter.object.w / 2)
    const cy = encounter.object.y - 7
    ctx.fillStyle = nearbyId === encounter.id ? '#fff1a0' : pulse ? '#e3b64f' : '#9b7b3b'
    ctx.fillRect(cx - 2, cy - 3, 5, 5); ctx.fillRect(cx - 4, cy - 1, 9, 1); ctx.fillRect(cx, cy - 5, 1, 9)
  })
  drawExplorer(ctx, player, tick)
  if (!started) {
    ctx.fillStyle = 'rgba(9,24,27,.72)'; ctx.fillRect(35, 76, 250, 70)
    ctx.fillStyle = '#f5d36f'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText('THE COMPASS OF', 160, 101); ctx.fillText('QUIET RUINS', 160, 118)
    ctx.fillStyle = '#d7e4cd'; ctx.font = '7px monospace'; ctx.fillText('A MARA VALE ADVENTURE', 160, 134); ctx.textAlign = 'left'
  }
}

function WorldCanvas({ started, paused, onNearbyChange }) {
  const canvasRef = useRef(null)
  const playerRef = useRef({ x: 151, y: 181, direction: 'up', moving: false })
  const controlsRef = useRef({ up: false, down: false, left: false, right: false })
  const frameRef = useRef(0)
  const lastTimeRef = useRef(0)
  const nearbyRef = useRef(null)

  useEffect(() => {
    function keyChange(event, pressed) {
      const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' }
      const direction = keyMap[event.key]
      if (!direction) return
      event.preventDefault(); controlsRef.current[direction] = pressed
    }
    const down = (event) => keyChange(event, true); const up = (event) => keyChange(event, false)
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    function loop(time) {
      const delta = Math.min(32, time - (lastTimeRef.current || time)) / 1000
      lastTimeRef.current = time
      const player = playerRef.current; const controls = controlsRef.current
      let dx = 0; let dy = 0
      if (started && !paused) { if (controls.left) dx -= 1; if (controls.right) dx += 1; if (controls.up) dy -= 1; if (controls.down) dy += 1 }
      if (dx && dy) { dx *= .707; dy *= .707 }
      const speed = 68
      const nextX = { x: player.x + dx * speed * delta, y: player.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT }
      const nextY = { x: player.x, y: player.y + dy * speed * delta, w: PLAYER_WIDTH, h: PLAYER_HEIGHT }
      if (dx && !blocks.some((block) => overlaps(nextX, block))) player.x = nextX.x
      if (dy && !blocks.some((block) => overlaps(nextY, block))) player.y = nextY.y
      player.moving = Boolean(dx || dy)
      if (Math.abs(dx) > Math.abs(dy)) player.direction = dx < 0 ? 'left' : 'right'; else if (dy) player.direction = dy < 0 ? 'up' : 'down'
      const playerBox = { x: player.x, y: player.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT }
      const nearby = encounters.find((encounter) => overlaps(playerBox, encounter.zone))?.id || null
      if (nearby !== nearbyRef.current) { nearbyRef.current = nearby; onNearbyChange(nearby) }
      drawWorld(ctx, player, nearby, time, started)
      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameRef.current)
  }, [started, paused, onNearbyChange])

  function setDirection(direction, pressed) { controlsRef.current[direction] = pressed }
  const bind = (direction) => ({ onPointerDown: () => setDirection(direction, true), onPointerUp: () => setDirection(direction, false), onPointerCancel: () => setDirection(direction, false), onPointerLeave: () => setDirection(direction, false) })

  return (
    <>
      <canvas ref={canvasRef} className="game-world" width={WORLD_WIDTH} height={WORLD_HEIGHT} aria-label="Top-down ruins where Mara can explore five glowing landmarks" />
      {started && (
        <div className="game-controller" aria-label="Movement controls">
          <div className="game-dpad">
            <button className="dpad-up" aria-label="Move up" {...bind('up')}>▲</button>
            <button className="dpad-left" aria-label="Move left" {...bind('left')}>◀</button>
            <span className="dpad-center" aria-hidden="true" />
            <button className="dpad-right" aria-label="Move right" {...bind('right')}>▶</button>
            <button className="dpad-down" aria-label="Move down" {...bind('down')}>▼</button>
          </div>
        </div>
      )}
    </>
  )
}

export default function GameAdventure({ items, onBack, onOpenSkill }) {
  const [started, setStarted] = useState(false)
  const [nearbyId, setNearbyId] = useState(null)
  const [activeEncounter, setActiveEncounter] = useState(null)
  const [outcome, setOutcome] = useState(null)
  const [satchelOpen, setSatchelOpen] = useState(false)
  const availableSkills = useMemo(() => skillOrder.map((title) => items.find((item) => item.title === title)).filter(Boolean), [items])
  const nearbyEncounter = encounters.find((encounter) => encounter.id === nearbyId)
  const matchedSkill = outcome ? items.find((item) => item.title === outcome.skill) : null

  function inspect() { if (nearbyEncounter) { setActiveEncounter(nearbyEncounter); setOutcome(null) } }

  useEffect(() => {
    function interactWithKeyboard(event) {
      if (!started || activeEncounter || !nearbyEncounter || ![' ', 'Enter', 'e', 'E'].includes(event.key)) return
      event.preventDefault(); inspect()
    }
    window.addEventListener('keydown', interactWithKeyboard)
    return () => window.removeEventListener('keydown', interactWithKeyboard)
  })

  return (
    <main className="game-shell">
      <header className="game-header">
        <button className="game-back-button" onClick={onBack}><Icon name="back" size={18} /> Home</button>
        {started && <span className="game-stage-count">Mosslight Ruins</span>}
      </header>
      <WorldCanvas started={started} paused={Boolean(activeEncounter)} onNearbyChange={setNearbyId} />

      {!started ? (
        <section className="game-intro game-panel">
          <p className="game-kicker">A 16-bit skills adventure</p>
          <h1>Mara Vale and the Compass of Quiet Ruins</h1>
          <p>Walk through an unusual ruin, inspect its glowing landmarks, and practice useful skills. There are no scores, locked areas, or perfect routes.</p>
          <button className="game-primary-button" onClick={() => setStarted(true)}>Start exploring <Icon name="arrow" size={18} /></button>
        </section>
      ) : activeEncounter ? (
        <section className="game-encounter game-panel">
          <div className="game-location-row"><span>{activeEncounter.stage}</span><span>{activeEncounter.location}</span></div>
          <h1>{activeEncounter.title}</h1>
          {!outcome ? (
            <>
              <p className="game-narration">{activeEncounter.prompt}</p>
              <div className="game-choices">
                {activeEncounter.choices.map((choice) => <button key={choice.label} onClick={() => setOutcome(choice)}><span>{choice.label}</span><small>{choice.skill}</small></button>)}
              </div>
              <button className="game-text-button" onClick={() => setActiveEncounter(null)}>Keep exploring</button>
            </>
          ) : (
            <div className="game-outcome" role="status">
              <p className="game-outcome-label">{outcome.skill}</p>
              <p>{outcome.response}</p>
              <div className="game-outcome-actions">
                <button className="game-primary-button" onClick={() => setActiveEncounter(null)}>Return to the ruins</button>
                {matchedSkill && <button className="game-secondary-button" onClick={() => onOpenSkill(matchedSkill)}>Read this skill</button>}
                <button className="game-text-button" onClick={() => setOutcome(null)}>Try another response</button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="game-map-panel game-panel">
          <p className="game-map-instruction">{nearbyEncounter ? `${nearbyEncounter.title} is close enough to inspect.` : 'Use the arrows to explore. Walk near a glowing landmark.'}</p>
          <button className="game-inspect-button" disabled={!nearbyEncounter} onClick={inspect}><span className="game-a-button">A</span>{nearbyEncounter ? `Inspect ${nearbyEncounter.title}` : 'Inspect'}</button>
        </section>
      )}

      {started && !activeEncounter && (
        <>
          <button className="game-satchel-button" onClick={() => setSatchelOpen((open) => !open)} aria-expanded={satchelOpen}><Icon name="toolbox" size={18} /> {satchelOpen ? 'Close skill satchel' : 'Open skill satchel'}</button>
          {satchelOpen && <div className="game-skill-satchel"><p>All skills used in the ruins are available from the beginning.</p><div className="game-skill-list">{availableSkills.map((skill) => <button key={skill.id} onClick={() => onOpenSkill(skill)}>{skill.title}<Icon name="arrow" size={15} /></button>)}</div></div>}
        </>
      )}
      <p className="game-keyboard-note">Phone: hold the arrow buttons · Keyboard: arrows or WASD · Inspect: A button, Space, Enter, or E</p>
    </main>
  )
}
