import { supabase } from './supabase'

export async function reminderApi(body) {
  if (!supabase) throw new Error('Please sign in to set reminders.')
  const { data, error } = await supabase.functions.invoke('workbook-reminders', { body })
  if (error) {
    let message
    try { message = (await error.context?.json())?.error } catch { /* offline or unavailable */ }
    throw new Error(message || 'Could not connect to reminders. Check your connection and try again.')
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export function supported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function registration() {
  await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
  return navigator.serviceWorker.ready
}

export function applicationKey(key) {
  return Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0))
}

export async function stopDeviceReminders() {
  if (!supported()) return
  const reg = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL)
  const sub = await reg?.pushManager.getSubscription()
  if (sub) {
    await reminderApi({ action: 'disable', endpoint: sub.endpoint })
    if (!await sub.unsubscribe()) throw new Error('Could not turn off notifications on this device. Please try again.')
  }
}
