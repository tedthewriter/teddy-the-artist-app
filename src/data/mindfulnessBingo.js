export const bingoPractices = [
  { id: 'see-five', title: 'Notice 5 things', cue: 'Look around and name five things you can see. Notice one detail about each: its shape, color, or texture.' },
  { id: 'hear-three', title: 'Hear 3 sounds', cue: 'Pause and listen for three sounds. Notice near and far sounds without needing to change them.' },
  { id: 'feet', title: 'Feel your feet', cue: 'Sitting or standing comfortably, notice where your feet meet the floor. Feel the support beneath you for a few moments.' },
  { id: 'breaths', title: '3 easy breaths', cue: 'Notice three comfortable breaths. Let them come and go naturally; there is no need to deepen or hold your breath.' },
  { id: 'sip', title: 'Mindful sip', cue: 'Take a small sip of a comfortable-temperature drink. Notice the cup, the taste, and the sensation of swallowing.' },
  { id: 'jaw', title: 'Soften your jaw', cue: 'Notice whether your jaw is gripping. If comfortable, let your teeth separate slightly and soften your face. Nothing needs to be forced.' },
  { id: 'shoulders', title: 'Rest shoulders', cue: 'Notice where your shoulders are. Let them settle into a comfortable position and feel the support of your chair or body.' },
  { id: 'stretch', title: 'Gentle stretch', cue: 'Choose one small, comfortable stretch or movement. Notice how it feels. Stay within your comfortable range, or simply imagine the movement.' },
  { id: 'sky', title: 'Notice the sky', cue: 'From a window or outdoors, look at the sky without looking directly at the sun. Notice a color, a cloud, or a change in light.' },
  { id: 'bite', title: 'Savor a bite', cue: 'If eating feels comfortable, notice the color, texture, and flavor of one small bite. Otherwise, notice the texture of an object in your hand.' },
  { id: 'leaves', title: 'Leaves on a stream', cue: 'Imagine a stream. Place one thought on a leaf and watch it float along. You do not have to get rid of the thought or make the stream perfectly calm.' },
  { id: 'feeling', title: 'Name a feeling', cue: 'Ask, “What am I feeling right now?” Name it gently: worried, tired, content, uncertain—or something else. You do not need to explain or fix it.' },
  { id: 'kindness', title: 'Kind words', cue: 'Offer yourself one believable, kind sentence: “I can take one small step,” or “This is hard, and I can be kind to myself.” Choose your own words.' },
  { id: 'touch', title: 'Hand on heart', cue: 'If comforting, rest a hand over your heart, on your arm, or in your lap. Notice the warmth and pressure. Skip the touch if you prefer.' },
  { id: 'walk', title: 'Mindful movement', cue: 'Take a few slow steps, or gently move your hands while seated. Notice one movement at a time and the support beneath you.' },
  { id: 'one-task', title: 'Do one thing', cue: 'Choose a small part of an everyday task: fold one towel, wash one cup, or put away one item. Give that action your attention, returning gently when your mind wanders.' },
  { id: 'color', title: 'Find a color', cue: 'Choose a color and find it in three places nearby. Notice how the shades differ in light and shadow.' },
  { id: 'scan', title: 'Mini body scan', cue: 'Notice your hands, shoulders, and feet in turn. There is no right sensation to find. If focusing inside feels uncomfortable, look around the room instead.' },
  { id: 'hum', title: 'Gentle humming', cue: 'If comfortable, hum softly on one easy exhale. Notice the sound or vibration. Keep it unforced, and stop if it strains your throat or feels unpleasant.' },
  { id: 'music', title: 'Listen to music', cue: 'Listen to a short part of a song. Follow one instrument, voice, or rhythm. Let listening be the only task for a moment.' },
  { id: 'texture', title: 'Explore a texture', cue: 'Hold something comfortable, such as a blanket, a smooth stone, or your sleeve. Notice its texture, weight, and temperature.' },
  { id: 'light', title: 'Find the light', cue: 'Notice a patch of light or a soft shadow nearby. Look at its edges and shapes. Let yourself simply observe it.' },
  { id: 'hands', title: 'Unclench hands', cue: 'Notice your hands. If they are gripping, invite them to rest open or loosely in your lap. Notice the contact beneath them.' },
  { id: 'return', title: 'Gently return', cue: 'Notice where your attention has wandered. Say, “Thinking,” if that helps, then return to one thing you can see or hear. Returning is the practice—not a mistake.' },
]

export const freeSquare = 'free'
const validIds = new Set(bingoPractices.map(p => p.id))

export function freshBingo(random = Math.random) {
  const order = bingoPractices.map(p => p.id)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  order.splice(12, 0, freeSquare)
  return { version: 1, order, marked: [] }
}

export function restoreBingo(value) {
  try {
    const data = JSON.parse(value)
    if (data?.version !== 1 || !Array.isArray(data.order) || data.order.length !== 25
      || data.order[12] !== freeSquare || new Set(data.order).size !== 25
      || data.order.some(id => id !== freeSquare && !validIds.has(id))
      || !Array.isArray(data.marked)) return null
    return { version: 1, order: data.order, marked: [...new Set(data.marked.filter(id => validIds.has(id)))] }
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
