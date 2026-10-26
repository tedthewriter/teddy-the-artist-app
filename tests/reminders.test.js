import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { dueReminders, validateSchedules, validEndpoint, workbookMessage } from '../supabase/functions/workbook-reminders/schedule.js'

const schedules = {
  cbt: { enabled: true, time: '10:00', days: [0,1,2,3,4,5,6] },
  'self-love': { enabled: true, time: '15:00', days: [0,1,2,3,4,5,6] },
}
const device = { timezone: 'America/Denver', schedules }
test('separate reminders fire at their own local times', () => {
  assert.deepEqual(dueReminders(device,new Date('2026-10-25T16:00:00Z')), [{ kind:'cbt', date:'2026-10-25' }])
  assert.deepEqual(dueReminders(device,new Date('2026-10-25T21:00:00Z')), [{ kind:'self-love', date:'2026-10-25' }])
})
test('UTC offset changes automatically for daylight saving', () => {
  assert.equal(dueReminders(device,new Date('2026-11-02T17:00:00Z'))[0]?.kind,'cbt')
  assert.deepEqual(dueReminders(device,new Date('2026-11-02T16:00:00Z')),[])
})
test('does not send early or accumulate overdue reminders', () => {
  for (const stamp of ['2026-10-25T15:59:00Z','2026-10-25T16:05:00Z','2026-10-25T18:00:00Z']) assert.deepEqual(dueReminders(device,new Date(stamp)),[])
  assert.equal(dueReminders(device,new Date('2026-10-25T16:04:00Z')).length,1)
})
test('disabled and unselected days are respected', () => {
  assert.deepEqual(dueReminders({ ...device,schedules:{ ...schedules,cbt:{ ...schedules.cbt,enabled:false } } },new Date('2026-10-25T16:00:00Z')),[])
  assert.deepEqual(dueReminders({ ...device,schedules:{ ...schedules,cbt:{ ...schedules.cbt,days:[1] } } },new Date('2026-10-25T16:00:00Z')),[])
})
test('midnight uses the correct local date and weekday', () => {
  const d={timezone:'Pacific/Auckland',schedules:{...schedules,cbt:{enabled:true,time:'00:00',days:[1]}}}
  assert.deepEqual(dueReminders(d,new Date('2026-10-25T11:00:00Z')),[{kind:'cbt',date:'2026-10-26'}])
})
test('validates timezone, times, days, boolean flags; removes duplicate days', () => {
  assert.equal(validateSchedules(schedules,'America/Denver').cbt.time,'10:00')
  assert.throws(()=>validateSchedules(schedules,'not/a-zone'))
  for(const change of [{time:'24:00'},{time:'10:99'},{days:[]},{days:[7]},{days:['1']},{enabled:'yes'}]) assert.throws(()=>validateSchedules({...schedules,cbt:{...schedules.cbt,...change}},'America/Denver'))
  assert.deepEqual(validateSchedules({...schedules,cbt:{...schedules.cbt,days:[1,1]}},'America/Denver').cbt.days,[1])
})
test('SSRF guard accepts push providers only, without redirects to arbitrary hosts', () => {
  for(const url of ['https://web.push.apple.com/a','https://wns2-db5p.notify.windows.com/a','https://fcm.googleapis.com/fcm/send/a','https://updates.push.services.mozilla.com/wpush/v2/a']) assert.ok(validEndpoint(url),url)
  for(const url of ['http://web.push.apple.com/a','https://localhost/a','https://127.0.0.1/a','https://fcm.googleapis.com.evil.test/a','https://evil.test/push.apple.com/a','https://me@web.push.apple.com/a','https://web.push.apple.com:444/a']) assert.equal(validEndpoint(url),false,url)
})

function worker(clients) {
  const handlers={}; const notices=[]
  const self={registration:{scope:'https://tedthewriter.github.io/teddy-the-artist-app/',showNotification:async(title,options)=>notices.push({title,...options})},clients,addEventListener:(name,fn)=>{handlers[name]=fn},skipWaiting:()=>{}}
  vm.runInNewContext(readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),{self,URL,Uint8Array})
  return {handlers,notices}
}
test('push preserves specific workbook text and activity link', async () => {
  const {handlers,notices}=worker({}); let p
  handlers.push({data:{json:()=>({kind:'self-love',title:'Self-love workbook',body:'Continue Understanding Self-Love. Tap to open this activity.',contentId:'12345678-1234-1234-1234-123456789012'})},waitUntil:x=>{p=x}}); await p
  assert.equal(notices[0].tag,'workbook-self-love')
  assert.equal(notices[0].title,'Self-love workbook')
  assert.match(notices[0].body,/Understanding Self-Love/)
  assert.equal(notices[0].data.contentId,'12345678-1234-1234-1234-123456789012')
})
test('malformed push still displays a visible notification',async()=>{
  const {handlers,notices}=worker({});let p
  handlers.push({data:{json:()=>{throw Error()}},waitUntil:x=>{p=x}});await p
  assert.equal(notices.length,1)
})
test('notification click reuses only this app’s window and preserves login intent',async()=>{
  let target,focused=false,p
  const client={url:'https://tedthewriter.github.io/teddy-the-artist-app/',navigate:async url=>{target=url;return client},focus:async()=>{focused=true}}
  const {handlers}=worker({matchAll:async()=>[client],openWindow:()=>{throw Error('unexpected')}})
  handlers.notificationclick({notification:{close(){},data:{kind:'self-love'}},waitUntil:x=>{p=x}});await p
  assert.equal(target,'https://tedthewriter.github.io/teddy-the-artist-app/?workbook=self-love');assert.ok(focused)
})
test('notification click opens workbook when app is closed',async()=>{
  let target,p
  const {handlers}=worker({matchAll:async()=>[{url:'https://tedthewriter.github.io/abbys-app/'}],openWindow:async url=>{target=url}})
  handlers.notificationclick({notification:{close(){},data:{kind:'cbt'}},waitUntil:x=>{p=x}});await p
  assert.equal(target,'https://tedthewriter.github.io/teddy-the-artist-app/?workbook=cbt')
})

const lessons = [
  {id:'b',title:'Day 2: Relationships and Belonging',content_type:'cbt_week_1',framework:'cbt_7_weeks',sort_order:212},
  {id:'c',title:'Day 1: Behavior Before Motivation',content_type:'cbt_week_2',framework:'cbt_7_weeks',sort_order:221},
  {id:'a',title:'Day 1: Your Starting Point and Strengths',content_type:'cbt_week_1',framework:'cbt_7_weeks',sort_order:211},
  {id:'intro',title:'CBT introduction',content_type:'cbt_intro',framework:'cbt_7_weeks',sort_order:1},
  {id:'love',title:'Understanding Self-Love',content_type:'self_love_reading',framework:'self_love',sort_order:600},
]
test('CBT reminder names the actual next incomplete week and day',()=>{
  const message=workbookMessage('cbt',lessons,['a'])
  assert.equal(message.title,'7 Week CBT workbook')
  assert.equal(message.body,'Continue Week 1 · Day 2: Relationships and Belonging. Tap to open this activity.')
  assert.equal(message.contentId,'b')
})
test('self-love reminder names its own activity, never a CBT lesson or response',()=>{
  const message=workbookMessage('self-love',lessons,[])
  assert.equal(message.title,'Self-love workbook')
  assert.equal(message.body,'Continue Understanding Self-Love. Tap to open this activity.')
  assert.equal(message.contentId,'love')
  assert.equal('response' in message,false)
})
test('test reminders use the same specific content as scheduled reminders',()=>{
  const message=workbookMessage('cbt',lessons,['a','b'],true)
  assert.equal(message.title,'Test: 7 Week CBT workbook')
  assert.match(message.body,/Week 2 · Day 1: Behavior Before Motivation/)
})
test('completed workbook suggests review rather than inventing an unfinished lesson',()=>{
  const message=workbookMessage('cbt',lessons,['a','b','c'])
  assert.match(message.body,/completed this workbook/)
  assert.equal(message.contentId,undefined)
})
test('missing lessons produce an actionable workbook-specific fallback',()=>{
  assert.match(workbookMessage('self-love',[],[]).body,/Self-love workbook/)
})
test('notification opens the named activity even if progress has since changed',async()=>{
  let target,p
  const {handlers}=worker({matchAll:async()=>[],openWindow:async url=>{target=url}})
  handlers.notificationclick({notification:{close(){},data:{kind:'self-love',contentId:'12345678-1234-1234-1234-123456789012'}},waitUntil:x=>{p=x}});await p
  assert.equal(target,'https://tedthewriter.github.io/teddy-the-artist-app/?workbook=self-love&activity=12345678-1234-1234-1234-123456789012')
})
