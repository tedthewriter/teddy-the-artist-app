import { mindfulnessPractices } from './mindfulnessPractices.js'

const sourceTitles = {
  'see-five': '5-4-3-2-1 Sensory Grounding', 'hear-three': '5-4-3-2-1 Sensory Grounding',
  feet: 'Barefoot Grounding', breaths: 'Box Breathing', sip: 'Single-Task Focus Workout',
  jaw: 'Body Scan & Tension Release', shoulders: 'Body Scan & Tension Release',
  stretch: 'Barefoot Grounding', sky: 'Cold Water Reset', bite: 'Single-Task Focus Workout',
  leaves: 'Leaves on a Stream', feeling: 'EFT Tapping', kindness: 'Compassionate Self-Touch',
  touch: 'Compassionate Self-Touch', walk: 'Single-Task Focus Workout',
  'one-task': 'Single-Task Focus Workout', color: '5-4-3-2-1 Sensory Grounding',
  scan: 'Body Scan & Tension Release', hum: 'Low Humming', music: 'Single-Task Focus Workout',
  texture: '5-4-3-2-1 Sensory Grounding', light: '5-4-3-2-1 Sensory Grounding',
  hands: 'Body Scan & Tension Release', return: '5-4-3-2-1 Sensory Grounding',
}
// These five squares changed activities. Keep the arrangement and all other
// marks when migrating a saved card, but never carry a mark to a new activity.
const changedActivities = new Set(['breaths', 'stretch', 'sky', 'feeling', 'return'])

export const bingoPractices = [
  { id: 'see-five', title: 'Notice 5 things', cue: 'Look around and name five things you can see. Notice one detail about each: its shape, color, or texture.' },
  { id: 'hear-three', title: 'Hear 3 sounds', cue: 'Pause and listen for three sounds. Notice near and far sounds without needing to change them.' },
  { id: 'feet', title: 'Feel your feet', cue: 'Sitting or standing comfortably, notice where your feet meet the floor. Feel the support beneath you for a few moments.' },
  { id: 'breaths', title: 'Box breathing', fullPractice: true, cue: 'Try the Box Breathing practice already in Mindfulness, using a comfortable four-count rhythm. Follow the instructions and safety note below.' },
  { id: 'sip', title: 'Mindful sip', cue: 'Take a small sip of a comfortable-temperature drink. Notice the cup, the taste, and the sensation of swallowing.' },
  { id: 'jaw', title: 'Soften your jaw', cue: 'Notice whether your jaw is gripping. If comfortable, let your teeth separate slightly and soften your face. Nothing needs to be forced.' },
  { id: 'shoulders', title: 'Rest shoulders', cue: 'Notice where your shoulders are. Let them settle into a comfortable position and feel the support of your chair or body.' },
  { id: 'stretch', title: 'Barefoot grounding', fullPractice: true, cue: 'Try the Barefoot Grounding practice from Mindfulness. Choose a safe surface, or wear shoes if needed. Follow the instructions below.' },
  { id: 'sky', title: 'Cold water reset', fullPractice: true, cue: 'If this practice is appropriate for you, try the Cold Water Reset already in Mindfulness. Read the safety note first. Skip this square if cooling is not suitable for you.' },
  { id: 'bite', title: 'Savor a bite', cue: 'If eating feels comfortable, notice the color, texture, and flavor of one small bite. Otherwise, notice the texture of an object in your hand.' },
  { id: 'leaves', title: 'Leaves on a stream', fullPractice: true, cue: 'Use the Leaves on a Stream visualization from Mindfulness. Place a thought on a leaf and allow it to float along without needing to make it disappear.' },
  { id: 'feeling', title: 'EFT tapping', fullPractice: true, cue: 'Try the gentle EFT Tapping sequence already in Mindfulness. Choose a feeling or calming phrase, and follow the points below.' },
  { id: 'kindness', title: 'Kind words', cue: 'Offer yourself one believable, kind sentence: “I can take one small step,” or “This is hard, and I can be kind to myself.” Choose your own words.' },
  { id: 'touch', title: 'Compassionate touch', fullPractice: true, cue: 'Try Compassionate Self-Touch from Mindfulness: a comforting hand placement and words that feel genuinely supportive. Adapt or skip the touch if you prefer.' },
  { id: 'walk', title: 'Mindful movement', cue: 'Take a few slow steps, or gently move your hands while seated. Notice one movement at a time and the support beneath you.' },
  { id: 'one-task', title: 'Single-task focus', fullPractice: true, cue: 'Use the Single-Task Focus Workout from Mindfulness. Choose one ordinary activity and practice giving it your attention, returning gently when your mind wanders.' },
  { id: 'color', title: 'Find a color', cue: 'Choose a color and find it in three places nearby. Notice how the shades differ in light and shadow.' },
  { id: 'scan', title: 'Body scan', fullPractice: true, cue: 'Try Body Scan & Tension Release from Mindfulness. Notice sensations without judging them, and invite tight areas to soften. If focusing inside feels uncomfortable, look around the room instead.' },
  { id: 'hum', title: 'Low humming', fullPractice: true, cue: 'Use the Low Humming practice from Mindfulness. Keep your breath and voice comfortable, and follow the instructions and safety note below.' },
  { id: 'music', title: 'Listen to music', cue: 'Listen to a short part of a song. Follow one instrument, voice, or rhythm. Let listening be the only task for a moment.' },
  { id: 'texture', title: 'Explore a texture', cue: 'Hold something comfortable, such as a blanket, a smooth stone, or your sleeve. Notice its texture, weight, and temperature.' },
  { id: 'light', title: 'Find the light', cue: 'Notice a patch of light or a soft shadow nearby. Look at its edges and shapes. Let yourself simply observe it.' },
  { id: 'hands', title: 'Unclench hands', cue: 'Notice your hands. If they are gripping, invite them to rest open or loosely in your lap. Notice the contact beneath them.' },
  { id: 'return', title: '5-4-3-2-1 grounding', fullPractice: true, cue: 'Try the complete 5-4-3-2-1 Sensory Grounding practice already in Mindfulness. Follow the five senses sequence below.' },
].map(square => ({ ...square, source: mindfulnessPractices.find(practice => practice.title === sourceTitles[square.id]) }))

export const freeSquare = 'free'
const validIds = new Set(bingoPractices.map(p => p.id))

export function freshBingo(random = Math.random) {
  const order = bingoPractices.map(p => p.id)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  order.splice(12, 0, freeSquare)
  return { version: 2, order, marked: [] }
}

export function restoreBingo(value) {
  try {
    const data = JSON.parse(value)
    if (![1,2].includes(data?.version) || !Array.isArray(data.order) || data.order.length !== 25
      || data.order[12] !== freeSquare || new Set(data.order).size !== 25
      || data.order.some(id => id !== freeSquare && !validIds.has(id))
      || !Array.isArray(data.marked)) return null
    return { version: 2, order: data.order, marked: [...new Set(data.marked.filter(id => validIds.has(id) && (data.version === 2 || !changedActivities.has(id))))] }
  } catch { return null }
}

export function bingoLines(order, marked) {
  const selected = new Set([...marked, freeSquare])
  const lines = []
  for (let row = 0; row < 5; row++) lines.push(Array.from({ length: 5 }, (_, col) => row * 5 + col))
  for (let col = 0; col < 5; col++) lines.push(Array.from({ length: 5 }, (_, row) => row * 5 + col))
  lines.push([0,6,12,18,24], [4,8,12,16,20])
  return lines.filter(line => line.every(index => selected.has(order[index])))
}
