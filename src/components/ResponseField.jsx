import { useEffect, useRef, useState } from 'react'

const AUTOSAVE_DELAY = 800

function emptyValue(kind) {
  if (kind === 'multi_choice') return []
  return ''
}

function readStoredValue(kind, responseValue) {
  if (kind === 'text') return typeof responseValue?.text === 'string' ? responseValue.text : ''
  if (kind === 'multi_choice') return Array.isArray(responseValue?.selected) ? responseValue.selected : []
  if (kind === 'scale') return responseValue?.value ?? ''
  return responseValue?.selected ?? ''
}

function toResponseValue(kind, value) {
  if (kind === 'text') return { text: value }
  if (kind === 'multi_choice') return { selected: value }
  if (kind === 'scale') return { value }
  return { selected: value }
}

function signature(kind, value) {
  return JSON.stringify(toResponseValue(kind, value))
}

function optionParts(option) {
  if (typeof option === 'string' || typeof option === 'number') {
    return { label: String(option), value: String(option) }
  }
  return { label: option.label, value: String(option.value ?? option.label) }
}

export default function ResponseField({
  contextType = 'content',
  contextId,
  contentId = null,
  responseKey,
  kind = 'text',
  label = 'Your response',
  prompt,
  placeholder = 'Write whatever feels useful…',
  options = [],
  min = 0,
  max = 10,
  minLabel,
  maxLabel,
  record,
  onSave,
  onDelete,
}) {
  const initialValue = readStoredValue(kind, record?.response_value)
  const [draft, setDraft] = useState(initialValue)
  const [status, setStatus] = useState(record ? 'saved' : 'idle')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const timerRef = useRef(null)
  const saveSequenceRef = useRef(0)
  const lastSavedRef = useRef(signature(kind, initialValue))

  useEffect(() => {
    const nextValue = readStoredValue(kind, record?.response_value)
    clearTimeout(timerRef.current)
    setDraft(nextValue)
    setStatus(record ? 'saved' : 'idle')
    setConfirmingDelete(false)
    lastSavedRef.current = signature(kind, nextValue)
  }, [contextType, contextId, responseKey, kind, record?.updated_at])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  async function persist(nextValue) {
    clearTimeout(timerRef.current)
    const nextSignature = signature(kind, nextValue)
    if (nextSignature === lastSavedRef.current) return true

    const sequence = saveSequenceRef.current + 1
    saveSequenceRef.current = sequence
    setStatus('saving')
    const saved = await onSave({
      contextType,
      contextId,
      contentId,
      responseKey,
      responseKind: kind,
      prompt,
      responseValue: toResponseValue(kind, nextValue),
    })

    if (sequence !== saveSequenceRef.current) return saved
    if (saved) {
      lastSavedRef.current = nextSignature
      setStatus('saved')
    } else {
      setStatus('error')
    }
    return saved
  }

  function updateDraft(nextValue) {
    setDraft(nextValue)
    setStatus('waiting')
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => persist(nextValue), AUTOSAVE_DELAY)
  }

  async function deleteResponse() {
    clearTimeout(timerRef.current)
    setStatus('saving')
    const deleted = await onDelete({ contextType, contextId, responseKey })
    if (!deleted) {
      setStatus('error')
      setConfirmingDelete(false)
      return
    }
    const nextValue = emptyValue(kind)
    setDraft(nextValue)
    lastSavedRef.current = signature(kind, nextValue)
    setStatus('deleted')
    setConfirmingDelete(false)
  }

  const normalizedOptions = options.map(optionParts)
  const hasDraft = Array.isArray(draft) ? draft.length > 0 : draft !== ''
  const canDelete = Boolean(record || hasDraft)

  return (
    <div className="response-field">
      <div className="response-heading">
        <label>{label}</label>
        <span className={`save-status ${status}`} role="status" aria-live="polite">
          {status === 'waiting' && 'Waiting to save…'}
          {status === 'saving' && 'Saving…'}
          {status === 'saved' && 'Saved'}
          {status === 'deleted' && 'Deleted'}
          {status === 'error' && 'Couldn’t save'}
        </span>
      </div>

      {kind === 'text' && (
        <textarea
          rows="4"
          value={draft}
          placeholder={placeholder}
          onChange={(event) => updateDraft(event.target.value)}
          onBlur={() => persist(draft)}
        />
      )}

      {kind === 'single_choice' && (
        <div className="choice-list">
          {normalizedOptions.map((option, index) => (
            <label className="choice-option" key={`${option.value}-${index}`}>
              <input
                type="radio"
                name={`${contextType}-${contextId}-${responseKey}`}
                checked={draft === option.value}
                onChange={() => updateDraft(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}

      {kind === 'multi_choice' && (
        <div className="choice-list">
          {normalizedOptions.map((option, index) => {
            const checked = draft.includes(option.value)
            return (
              <label className="choice-option" key={`${option.value}-${index}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => updateDraft(checked
                    ? draft.filter((value) => value !== option.value)
                    : [...draft, option.value])}
                />
                <span>{option.label}</span>
              </label>
            )
          })}
        </div>
      )}

      {kind === 'scale' && (
        <div className="scale-response">
          <div className="scale-options" role="radiogroup" aria-label={label}>
            {Array.from({ length: max - min + 1 }, (_, index) => min + index).map((number) => (
              <button
                type="button"
                className={String(draft) === String(number) ? 'selected' : ''}
                role="radio"
                aria-checked={String(draft) === String(number)}
                key={number}
                onClick={() => updateDraft(number)}
              >{number}</button>
            ))}
          </div>
          {(minLabel || maxLabel) && (
            <div className="scale-labels"><span>{minLabel}</span><span>{maxLabel}</span></div>
          )}
        </div>
      )}

      {status === 'error' && <p className="response-error">Your response is still here. Check your connection and try editing it again.</p>}

      {canDelete && (
        <div className="response-delete-row">
          {confirmingDelete ? (
            <>
              <span>Delete this response?</span>
              <button type="button" onClick={() => setConfirmingDelete(false)}>Cancel</button>
              <button type="button" className="confirm-delete" onClick={deleteResponse}>Delete</button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmingDelete(true)}>Delete response</button>
          )}
        </div>
      )}
    </div>
  )
}
