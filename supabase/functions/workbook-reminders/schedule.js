export const kinds = ['cbt', 'self-love']

export function workbookItems(items, kind) {
  return items.filter(item => kind === 'cbt'
    ? item.content_type?.startsWith('cbt_week_')
    : item.framework === 'self_love' || item.content_type?.startsWith('self_love'))
    .sort((a,b) => (kind === 'cbt' ? Number(a.content_type.slice(9)) - Number(b.content_type.slice(9)) : 0)
      || Number(a.sort_order || 0) - Number(b.sort_order || 0) || a.id.localeCompare(b.id))
}

export function workbookMessage(kind, items, completedIds, test = false) {
  const completed = new Set(completedIds)
  const ordered = workbookItems(items, kind)
  const next = ordered.find(item => !completed.has(item.id))
  const name = kind === 'cbt' ? '7 Week CBT workbook' : 'Self-love workbook'
  const prefix = next && kind === 'cbt' ? `Week ${Number(next.content_type.slice(9))} · ` : ''
  const title = `${test ? 'Test: ' : ''}${name}`
  if (next) return { title, body: `Continue ${prefix}${next.title}. Tap to open this activity.`, kind, contentId: next.id }
  return { title, body: ordered.length
    ? `You’ve completed this workbook. Revisit an activity you found helpful and try it again today.`
    : `Open your ${name} and choose an activity to work on today.`, kind }
}

export function validateSchedules(schedules, timezone) {
  new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format()
  if (typeof timezone !== 'string' || timezone.length > 100) throw new Error('Choose a valid time zone.')
  const clean = {}
  for (const kind of kinds) {
    const s = schedules?.[kind]
    if (!s || typeof s.enabled !== 'boolean' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time)
      || !Array.isArray(s.days) || s.days.some(d => !Number.isInteger(d) || d < 0 || d > 6)
      || (s.enabled && s.days.length === 0)) throw new Error('Choose a time and at least one day for each enabled reminder.')
    clean[kind] = { enabled: s.enabled, time: s.time, days: [...new Set(s.days)] }
  }
  return clean
}

export function dueReminders(device, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: device.timezone, year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now).map(p => [p.type, p.value]))
  const date = `${parts.year}-${parts.month}-${parts.day}`
  const day = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday)
  const minute = Number(parts.hour) * 60 + Number(parts.minute)
  return kinds.filter(kind => {
    const s = device.schedules[kind]
    if (!s?.enabled || !s.days.includes(day)) return false
    const [h,m] = s.time.split(':').map(Number)
    const lateness = minute - (h*60+m)
    // Short retry window; never build up overdue reminders.
    return lateness >= 0 && lateness < 5
  }).map(kind => ({ kind, date }))
}

export function validEndpoint(value) {
  try {
    const u = new URL(value)
    return u.protocol === 'https:' && !u.username && !u.password && !u.port
      && (u.hostname === 'fcm.googleapis.com' || u.hostname === 'updates.push.services.mozilla.com'
        || u.hostname === 'web.push.apple.com' || u.hostname.endsWith('.push.apple.com')
        || u.hostname.endsWith('.notify.windows.com'))
  } catch { return false }
}
