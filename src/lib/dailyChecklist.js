export function localDay(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export function restoreChecklist(raw, day = localDay()) {
  try {
    const value = JSON.parse(raw)
    if (value?.day === day && Array.isArray(value.checked)) {
      return { day, checked: [...new Set(value.checked.filter(id => typeof id === 'string'))] }
    }
  } catch {}
  return { day, checked: [] }
}

export function toggleChecklist(current, id, day = localDay()) {
  const checked = current.day === day ? current.checked : []
  return { day, checked: checked.includes(id) ? checked.filter(value => value !== id) : [...checked, id] }
}
