import { useEffect, useState } from 'react'
import Icon from './Icon'
import { applicationKey, registration, reminderApi, stopDeviceReminders, supported } from '../lib/reminders'

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const defaults = {
  cbt: { enabled: false, time: '10:00', days: [0,1,2,3,4,5,6] },
  'self-love': { enabled: false, time: '15:00', days: [0,1,2,3,4,5,6] },
}

export default function WorkbookReminders({ onBack }) {
  const [schedules, setSchedules] = useState(defaults)
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Denver')
  const [publicKey, setPublicKey] = useState('')
  const [busy, setBusy] = useState(true)
  const [connected, setConnected] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone
  const canEnable = supported() && (!isIOS || standalone)
  const denied = 'Notification' in window && Notification.permission === 'denied'

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const reg = supported() ? await registration() : null
        const sub = await reg?.pushManager.getSubscription()
        const data = await reminderApi({ action: 'config', endpoint: sub?.endpoint })
        if (!active) return
        setPublicKey(data.publicKey)
        if (data.device) { setSchedules(data.device.schedules); setTimezone(data.device.timezone); setConnected(Boolean(sub)) }
      } catch (error) { if (active) { setMessage(error.message); setFailed(true) } }
      finally { if (active) setBusy(false) }
    }
    load()
    return () => { active = false }
  }, [])

  function change(kind, values) { setSchedules(current => ({ ...current, [kind]: { ...current[kind], ...values } })); setMessage('Changes are not saved yet.'); setFailed(false) }
  async function save() {
    // Permission is requested directly from the tap, before network requests.
    const wantsReminders = Object.values(schedules).some(s => s.enabled)
    if (wantsReminders && Object.values(schedules).some(s => s.enabled && !s.days.length)) { setMessage('Choose at least one day for each enabled reminder.'); setFailed(true); return }
    setBusy(true); setMessage(''); setFailed(false)
    try {
      if (!wantsReminders) { await stopDeviceReminders(); setConnected(false); setMessage('Both reminders are off on this device.'); return }
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') throw new Error('Notifications were not allowed. You can change this in your phone’s notification settings.')
      const reg = await registration()
      let sub = await reg.pushManager.getSubscription()
      const created = !sub
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: applicationKey(publicKey) })
      try { await reminderApi({ action: 'save', subscription: sub.toJSON(), schedules, timezone }) }
      catch (error) { if (created) await sub.unsubscribe(); throw error }
      setConnected(true); setMessage('Saved. Your reminders are set for this device—even when the app is closed.')
    } catch (error) { setMessage(error.message); setFailed(true) }
    finally { setBusy(false) }
  }
  async function test(kind) {
    setBusy(true); setFailed(false)
    try {
      const sub = await (await registration()).pushManager.getSubscription()
      if (!sub) throw new Error('Enable reminders first.')
      await reminderApi({ action: 'test', endpoint: sub.endpoint, kind })
      setMessage('Test sent. Check your notifications. Focus or notification settings may silence it.')
    } catch (error) { setMessage(error.message); setFailed(true) }
    finally { setBusy(false) }
  }
  async function disable() {
    setBusy(true)
    try { await stopDeviceReminders(); setSchedules(s => Object.fromEntries(Object.entries(s).map(([k,v]) => [k,{ ...v,enabled:false }]))); setConnected(false); setFailed(false); setMessage('Both reminders are off on this device.') }
    catch (error) { setFailed(true); setMessage(error.message) }
    finally { setBusy(false) }
  }

  return <main className="app-shell library-shell">
    <header className="library-header"><button className="back-button" onClick={onBack}><Icon name="back" size={19} /> Home</button></header>
    <h1>Workbook reminders</h1>
    <p className="reminder-copy">A gentle nudge, not another obligation. Choose a different time for each workbook. No missed-reminder backlog.</p>
    {isIOS && !standalone && <p className="reminder-help">On iPhone: open this page in Safari, tap Share → Add to Home Screen (choose Open as Web App if shown). Open the new Home Screen icon, sign in, and return here to enable reminders.</p>}
    {!supported() && !isIOS && <p className="reminder-help">This browser does not support push notifications. Try a supported browser on your phone.</p>}
    {denied && <p className="reminder-help">Notifications are blocked. Allow them in your phone’s Settings → Notifications for Teddy the Artist, then reopen the app.</p>}
    <form onSubmit={event => { event.preventDefault(); save() }}>
      {Object.entries(schedules).map(([kind,s]) => <fieldset className={`reminder-card ${kind === 'cbt' ? 'reminder-cbt' : 'reminder-love'}`} key={kind} disabled={busy}>
        <legend>{kind === 'cbt' ? '7 Week CBT workbook' : 'Self-love workbook'}</legend>
        <label className="reminder-toggle"><input type="checkbox" checked={s.enabled} onChange={e => change(kind,{ enabled:e.target.checked })} /> Remind me</label>
        <label className="reminder-time">Time <input type="time" required value={s.time} onChange={e => change(kind,{ time:e.target.value })} /></label>
        <div className="reminder-days" aria-label="Days of the week">{days.map((day,i) => <button key={day} type="button" aria-label={['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i]} aria-pressed={s.days.includes(i)} onClick={() => change(kind,{ days:s.days.includes(i) ? s.days.filter(d => d!==i) : [...s.days,i] })}>{day}</button>)}</div>
        {connected && <button type="button" className="soft-button" onClick={() => test(kind)}>Send test reminder</button>}
      </fieldset>)}
      <label className="reminder-time">Time zone <input type="text" required value={timezone} onChange={e => {setTimezone(e.target.value); setMessage('Changes are not saved yet.')}} aria-describedby="timezone-help" /></label>
      <p id="timezone-help" className="reminder-copy">Detected from your device. Times follow this zone, including daylight saving. Update it here if you travel.</p>
      <button type="submit" className="primary-button" disabled={busy || !publicKey || (Object.values(schedules).some(s => s.enabled) && (!canEnable || denied))}>{busy ? 'Please wait…' : 'Save reminders'}</button>
      {connected && <button type="button" className="soft-button reminder-stop" disabled={busy} onClick={disable}>Turn off both on this device</button>}
    </form>
    {message && <p role={failed ? 'alert' : 'status'} className="reminder-help">{message}</p>}
    <p className="reminder-copy">Notifications say “Your workbook is ready” without naming CBT or showing private reflections. Tapping one opens the next unfinished activity. Internet is needed; Focus and phone settings can delay or silence alerts. Settings apply to this device only.</p>
  </main>
}
