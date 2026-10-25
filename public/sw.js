// Push only: do not cache private content, responses, or authentication data.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('push', event => {
  let data = {}
  try { data = event.data?.json() || {} } catch { /* Always show a visible notification. */ }
  const kind = data.kind === 'self-love' ? 'self-love' : 'cbt'
  event.waitUntil(self.registration.showNotification(data.title || 'A moment for you', {
    body: data.body || 'Your workbook is ready whenever you are.',
    icon: 'images/app-icon-192.png',
    tag: `workbook-${kind}`,
    data: { kind },
  }))
})
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const kind = event.notification.data?.kind === 'self-love' ? 'self-love' : 'cbt'
  const target = new URL(`./?workbook=${kind}`, self.registration.scope).href
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of windows) {
      if (client.url.startsWith(self.registration.scope)) {
        // Navigation preserves the intent even if this window is at the login screen.
        const navigated = await client.navigate(target)
        await (navigated || client).focus()
        return
      }
    }
    await self.clients.openWindow(target)
  })())
})
