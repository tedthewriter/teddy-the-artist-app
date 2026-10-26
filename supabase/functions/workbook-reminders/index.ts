import { createClient } from 'npm:@supabase/supabase-js@2.116.0'
import webpush from 'npm:web-push@3.6.7'
import { dueReminders, validateSchedules, validEndpoint, workbookMessage } from './schedule.js'

const origin = 'https://tedthewriter.github.io'
const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' }
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
function result(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }) }
function checked<T>(r: { data: T; error: unknown }): T { if (r.error) throw new Error('Database operation failed'); return r.data }

async function push(device: any, kind: string, config: any, test = false) {
  if (!validEndpoint(device.endpoint)) throw new Error('Invalid endpoint')
  // Only approved lesson metadata and completion IDs—not reflections or responses.
  const [library, progress] = await Promise.all([
    db.from('content_items').select('id,title,content_type,framework,sort_order').eq('approved', true).eq('active', true)
      .or(kind === 'cbt' ? 'content_type.like.cbt_week_%' : 'framework.eq.self_love,content_type.like.self_love%'),
    db.from('user_content_completions').select('content_id').eq('user_id', device.user_id),
  ])
  const message = workbookMessage(kind, checked(library), checked(progress).map((row: any) => row.content_id), test)
  const details = webpush.generateRequestDetails(device.subscription, JSON.stringify(message), { TTL: 300, urgency: 'normal', topic: kind === 'cbt' ? 'workbook-cbt' : 'workbook-self-love',
    vapidDetails: { subject: 'https://tedthewriter.github.io/teddy-the-artist-app/', publicKey: config.public_key, privateKey: config.private_key } })
  // Fetch instead of Node HTTP: supported by the Edge runtime. Never follow redirects.
  const response = await fetch(details.endpoint, { method: 'POST', headers: details.headers, body: new Uint8Array(details.body), redirect: 'error', signal: AbortSignal.timeout(10000) })
  if (response.status === 404 || response.status === 410) {
    checked(await db.from('workbook_push_devices').delete().eq('id', device.id))
    throw new Error('Subscription expired. Enable reminders again on this phone.')
  }
  if (!response.ok) throw new Error('The notification service could not accept the reminder.')
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  if (req.method !== 'POST') return result({ error: 'POST required' }, 405)
  try {
    if (Number(req.headers.get('content-length')) > 16000) return result({ error: 'Request too large' }, 413)
    const text = await req.text()
    if (text.length > 16000) return result({ error: 'Request too large' }, 413)
    const body = JSON.parse(text)
    const config: any = checked(await db.from('workbook_push_config').select('*').eq('id', true).single())
    if (body.action === 'dispatch') {
      const secret = req.headers.get('x-reminder-secret') || ''
      // Constant-time comparison; scheduler credentials never enter the browser.
      const digest = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))
      const [a,b] = await Promise.all([digest(secret), digest(config.cron_secret)])
      if (a.reduce((n,x,i) => n | (x ^ b[i]), 0)) return result({ error: 'Unauthorized' }, 401)
      if (body.selfTest === true) {
        // Operational crypto health check: synthetic receiver, no outgoing push.
        const receiver = webpush.generateVAPIDKeys()
        const details = webpush.generateRequestDetails({ endpoint: 'https://web.push.apple.com/test', keys: { p256dh: receiver.publicKey, auth: 'AAAAAAAAAAAAAAAAAAAAAA' } }, '{"kind":"cbt"}', {
          TTL: 300, vapidDetails: { subject: 'https://tedthewriter.github.io/teddy-the-artist-app/', publicKey: config.public_key, privateKey: config.private_key },
        })
        return result({ encryptedBytes: details.body.length, encoding: details.headers['Content-Encoding'], signed: Boolean(details.headers.Authorization) })
      }
      const devices: any[] = checked(await db.from('workbook_push_devices').select('*'))
      let sent = 0, failed = 0
      for (const device of devices) {
        for (const { kind, date } of dueReminders(device)) {
          const claimed = checked(await db.rpc('claim_workbook_push', { p_device: device.id, p_kind: kind, p_date: date }))
          if (!claimed) continue
          let status = 'sent'
          try { await push(device, kind, config); sent++ } catch { status = 'failed'; failed++ }
          checked(await db.from('workbook_push_deliveries').update({ status, updated_at: new Date().toISOString() }).eq('device_id', device.id).eq('kind', kind).eq('local_date', date))
        }
      }
      return result({ sent, failed })
    }
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer /i, '')
    const { data: { user }, error } = await db.auth.getUser(token)
    if (error || !user) return result({ error: 'Please sign in again.' }, 401)
    const member = checked(await db.from('app_members').select('user_id').eq('user_id', user.id).maybeSingle())
    if (!member) return result({ error: 'This account is not connected.' }, 403)
    if (body.action === 'config') {
      const device = body.endpoint ? checked(await db.from('workbook_push_devices').select('schedules,timezone').eq('user_id', user.id).eq('endpoint', body.endpoint).maybeSingle()) : null
      return result({ publicKey: config.public_key, device })
    }
    if (body.action === 'save') {
      const s = body.subscription
      if (!s || !validEndpoint(s.endpoint) || !/^[A-Za-z0-9_-]{87}$/.test(s.keys?.p256dh) || !/^[A-Za-z0-9_-]{22}$/.test(s.keys?.auth)) return result({ error: 'Please enable notifications on this device again.' }, 400)
      const schedules = validateSchedules(body.schedules, body.timezone)
      const existing: any = checked(await db.from('workbook_push_devices').select('user_id').eq('endpoint', s.endpoint).maybeSingle())
      if (existing && existing.user_id !== user.id) return result({ error: 'Turn off reminders for the previous account on this device first.' }, 409)
      checked(await db.from('workbook_push_devices').upsert({ user_id: user.id, endpoint: s.endpoint, subscription: { endpoint: s.endpoint, keys: s.keys }, timezone: body.timezone, schedules, updated_at: new Date().toISOString() }, { onConflict: 'endpoint' }))
      return result({ ok: true })
    }
    if (body.action === 'disable') {
      checked(await db.from('workbook_push_devices').delete().eq('user_id', user.id).eq('endpoint', body.endpoint))
      return result({ ok: true })
    }
    if (body.action === 'test') {
      const device: any = checked(await db.from('workbook_push_devices').select('*').eq('user_id', user.id).eq('endpoint', body.endpoint).single())
      if (device.last_test_at && Date.now() - Date.parse(device.last_test_at) < 60000) return result({ error: 'Wait a minute before sending another test.' }, 429)
      checked(await db.from('workbook_push_devices').update({ last_test_at: new Date().toISOString() }).eq('id', device.id))
      await push(device, body.kind === 'self-love' ? 'self-love' : 'cbt', config, true)
      return result({ ok: true })
    }
    return result({ error: 'Unknown action' }, 400)
  } catch (error) {
    // Do not log tokens, subscriptions, endpoints, or personal data.
    return result({ error: error instanceof Error && /Choose |Subscription expired/.test(error.message) ? error.message : 'Reminders could not be updated. Please try again.' }, 400)
  }
})
