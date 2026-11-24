import api from '@/services/api'

type PusherConfig = {
  enabled?: boolean
  key?: string
  cluster?: string
  useTLS?: boolean
  authEndpoint?: string
  logToConsole?: boolean
}

let pusherInstance: any = null
type HandlerSet = { set: Set<(p: any) => void>, bound: ((p: any) => void) }
type ChannelEntry = { channel: any, handlers: Record<string, HandlerSet> }
let channelRegistry: Record<string, ChannelEntry> = {}

async function initPusher(cfg?: PusherConfig) {
  if (pusherInstance) return pusherInstance
  if (!cfg) {
    try { const res = await api.get('/realtime/config'); cfg = res?.data as PusherConfig } catch (e) { /* ignore */ }
  }
  if (!cfg || !cfg.enabled || !cfg.key) return null

  try {
    const { default: Pusher } = await import('pusher-js')
    const token = localStorage.getItem('token')
    let authEndpoint = cfg.authEndpoint
    try {
      if (authEndpoint && authEndpoint.startsWith('/')) {
        const base = (api as any)?.defaults?.baseURL ?? ''
        authEndpoint = (base.replace(/\/$/, '') || '') + authEndpoint
      }
    } catch (e) { /* ignore */ }

    const options: any = { forceTLS: cfg.useTLS !== false }
    if (cfg.cluster) options.cluster = cfg.cluster
    if (authEndpoint) options.authEndpoint = authEndpoint
    if (authEndpoint) options.auth = { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } }

    pusherInstance = new Pusher(cfg.key as string, options)
    try { if (cfg.logToConsole) Pusher.logToConsole = true } catch (e) { /* ignore */ }

    try {
      pusherInstance.connection.bind('connected', () => {
        // eslint-disable-next-line no-console
        console.log('[pusherClient] connected socket_id=', pusherInstance?.connection?.socket_id)
      })
      pusherInstance.connection.bind('error', (err: any) => {
        // eslint-disable-next-line no-console
        console.warn('[pusherClient] error', err)
      })
    } catch (e) { /* ignore */ }

    return pusherInstance
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[pusherClient] failed to import pusher-js', err)
    return null
  }
}

async function subscribe(channelName: string, eventName: string, handler: (p: any) => void) {
  if (!pusherInstance) await initPusher()
  const p = pusherInstance
  if (!p) {
    // eslint-disable-next-line no-console
    console.warn('[pusherClient] subscribe before init')
    return () => {}
  }
  if (!channelRegistry[channelName]) {
    try { channelRegistry[channelName] = { channel: p.subscribe(channelName), handlers: {} } } catch (e) { return () => {} }
  }
  const entry = channelRegistry[channelName]
  if (!entry.handlers[eventName]) {
    const bound = (payload: any) => { Array.from(entry.handlers[eventName].set).forEach((h) => { try { h(payload) } catch {} }) }
    entry.handlers[eventName] = { set: new Set(), bound }
    try { entry.channel.bind(eventName, bound) } catch (e) { /* ignore */ }
  }
  entry.handlers[eventName].set.add(handler)

  return () => {
    const ent = channelRegistry[channelName]
    if (!ent || !ent.handlers[eventName]) return
    ent.handlers[eventName].set.delete(handler)
    if (ent.handlers[eventName].set.size === 0) {
      try { ent.channel.unbind(eventName, ent.handlers[eventName].bound) } catch {}
      delete ent.handlers[eventName]
    }
    if (Object.keys(ent.handlers).length === 0) {
      try { p.unsubscribe(channelName) } catch {}
      delete channelRegistry[channelName]
    }
  }
}

async function subscribeMany(channelName: string, handlers: Record<string, (p: any) => void>) {
  const unsubs: Array<() => void> = []
  for (const [ev, h] of Object.entries(handlers)) {
    // eslint-disable-next-line no-await-in-loop
    const u = await subscribe(channelName, ev, h)
    unsubs.push(u)
  }
  return () => { unsubs.forEach((u) => { try { u() } catch {} }) }
}

function getInstance() { return pusherInstance }
function getActiveChannels() { return Object.keys(channelRegistry) }
function getChannelHandlers(channelName: string) {
  const e = channelRegistry[channelName]
  if (!e) return {}
  const out: Record<string, number> = {}
  Object.entries(e.handlers).forEach(([k, v]) => { out[k] = v.set.size })
  return out
}

function disconnect() {
  try {
    const p = pusherInstance
    Object.entries(channelRegistry).forEach(([ch, entry]) => {
      Object.entries(entry.handlers).forEach(([ev, hs]) => { try { entry.channel.unbind(ev, hs.bound) } catch {} })
      try { p?.unsubscribe(ch) } catch {}
    })
  } catch (e) { /* ignore */ }
  channelRegistry = {}
  try { pusherInstance?.disconnect() } catch {}
  pusherInstance = null
}

export { initPusher, subscribe, subscribeMany, getInstance, getActiveChannels, getChannelHandlers, disconnect }
// Deprecated/no-op pusher client shim
// The app may still import this module; to ensure no Pusher socket is created
// in environments where the backend-side realtime flow is used instead, this
// file intentionally provides harmless no-op implementations.

type ChannelStub = {
  bind: (ev: string, fn: (...args: any[]) => void) => void
  unbind: (ev?: string, fn?: (...args: any[]) => void) => void
}

export function getOrCreatePusher(_key: string, _options: any): null {
  // eslint-disable-next-line no-console
  console.warn('[pusherClient] pusher disabled in frontend - returning null')
  return null
}

export function clearPusher() {
  // noop
}

export function subscribeChannel(_channelName: string): ChannelStub {
  // return a harmless stub that accepts bind/unbind calls
  // eslint-disable-next-line no-console
  console.warn('[pusherClient] subscribeChannel called but pusher disabled')
  return {
    bind: () => { /* noop */ },
    unbind: () => { /* noop */ },
  }
}

export function unsubscribeChannel(_channelName: string) {
  // noop
}

export function getActiveChannelCount(): number { return 0 }

export function getPusherInstance(): null { return null }
