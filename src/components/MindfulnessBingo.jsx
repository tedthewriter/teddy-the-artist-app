import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { bingoPractices, bingoLines, freshBingo, freeSquare, restoreBingo } from '../data/mindfulnessBingo'

const practiceById = Object.fromEntries(bingoPractices.map(p => [p.id, p]))

function PracticePrompt({ practice, marked, onToggle, onClose }) {
  const dialog = useRef(null)
  useEffect(() => {
    const node = dialog.current
    const trigger = document.activeElement
    node.showModal()
    return () => { node.close(); trigger?.focus?.() }
  }, [])
  return <dialog ref={dialog} className="bingo-dialog" onClose={onClose} aria-labelledby="bingo-prompt-title">
    <button className="back-button" onClick={onClose} autoFocus>Close</button>
    <p className="eyebrow">A small mindful moment</p>
    <h2 id="bingo-prompt-title">{practice.title}</h2>
    <p className="bingo-gentle">From {practice.source.title} · {practice.source.minutes}</p>
    <p>{practice.cue}</p>
    {practice.source.safety && <p className="gentle-callout">{practice.source.safety}</p>}
    <details className="bingo-practice-guide" open={practice.fullPractice || undefined}>
      <summary>Instructions from Mindfulness</summary>
      <h3>Use this when</h3>
      <p>{practice.source.when}</p>
      <h3>Try it now</h3>
      <ol>{practice.source.steps.map(step => <li key={step}>{step}</li>)}</ol>
    </details>
    <p className="bingo-gentle">A few moments are enough. You don’t have to feel calmer for your practice to count.</p>
    <button className="primary-button" onClick={onToggle}>{marked ? 'Unmark this square' : 'I tried this'}</button>
    <button className="soft-button" onClick={onClose}>{marked ? 'Keep marked' : 'Maybe another time'}</button>
  </dialog>
}

export default function MindfulnessBingo({ userId, onBack }) {
  const storageKey = `teddy-mindfulness-bingo-v1:${userId || 'preview'}`
  const [card, setCard] = useState(() => {
    try { return restoreBingo(localStorage.getItem(storageKey)) || freshBingo() } catch { return freshBingo() }
  })
  const [storageError, setStorageError] = useState(false)
  const [selected, setSelected] = useState(null)
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(card)); setStorageError(false) }
    catch { setStorageError(true) }
  }, [card, storageKey])
  const lines = bingoLines(card.order, card.marked)
  const winningSquares = new Set(lines.flat())
  const selectedPractice = practiceById[selected]
  function toggle() {
    setCard(current => ({ ...current, marked: current.marked.includes(selected) ? current.marked.filter(id => id !== selected) : [...current.marked, selected] }))
    setSelected(null)
  }
  function reset() {
    if (window.confirm('Start a fresh bingo card? This clears your marked squares on this device and rearranges the activities.')) {
      setCard(freshBingo()); setSelected(null)
    }
  }
  return <main className="app-shell library-shell bingo-shell">
    <header className="library-header"><button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Mindfulness</button></header>
    <p className="eyebrow">Notice · pause · return</p>
    <h1 className="library-title">Mindfulness bingo</h1>
    <p className="library-intro">Your ten Mindfulness practices, plus smaller ways to try them. Tap a square for its instructions, then mark it when you’ve tried it. Five across, down, or diagonally makes a bingo. There’s no deadline.</p>
    <div className="bingo-progress" role="status" aria-live="polite" aria-atomic="true">
      <strong>{card.marked.length === 24 ? 'A full card of mindful moments.' : lines.length ? `Bingo! ${lines.length === 1 ? 'One completed line.' : `${lines.length} completed lines.`}` : 'One small moment at a time.'}</strong>
      <span>{card.marked.length} of 24 squares tried{lines.length ? ' · Keep exploring or start fresh whenever you like.' : ''}</span>
    </div>
    <table className="bingo-board">
      <caption className="bingo-caption">Your mindfulness bingo card. The center is a free space.</caption>
      <thead><tr>{['B','I','N','G','O'].map(letter => <th scope="col" key={letter}>{letter}</th>)}</tr></thead>
      <tbody>{Array.from({ length: 5 }, (_, row) => <tr key={row}>{card.order.slice(row*5,row*5+5).map((id,col) => {
        if (id === freeSquare) return <td key={id}><div className="bingo-square bingo-free"><Icon name="heart" size={22} /><span>Free space</span><small>You can pause.</small></div></td>
        const marked = card.marked.includes(id)
        return <td key={id}><button className={`bingo-square${marked ? ' is-marked' : ''}${winningSquares.has(row*5+col) ? ' in-bingo' : ''}`} aria-label={`${practiceById[id].title}${marked ? ', tried' : ', not marked'}. Open practice.`} aria-pressed={marked} aria-haspopup="dialog" onClick={() => setSelected(id)}><span className="bingo-check" aria-hidden="true">{marked ? '✓' : '·'}</span><span>{practiceById[id].title}</span></button></td>
      })}</tr>)}</tbody>
    </table>
    <p className="bingo-gentle">Green with a check mark means tried. Tap a marked square to revisit it or unmark it. Every small practice counts, even without a bingo.</p>
    <button className="soft-button" onClick={reset}>Start fresh</button>
    <p className="bingo-gentle">{storageError ? 'This browser couldn’t save your card. You can keep playing, but marks may be lost when you leave.' : 'Your card saves automatically for this account in this browser. It doesn’t sync to other devices.'}</p>
    <p className="support-note">Choose what feels manageable. Adapt or skip any practice, and stop if it feels uncomfortable. This is an optional self-support activity, not a test or a replacement for professional care.</p>
    {selectedPractice && <PracticePrompt key={selected} practice={selectedPractice} marked={card.marked.includes(selected)} onToggle={toggle} onClose={() => setSelected(null)} />}
  </main>
}
