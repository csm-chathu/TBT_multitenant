import { useEffect, useRef, useCallback } from 'react'
import { initPusher, subscribe as pusherSubscribe, subscribeMany as pusherSubscribeMany, disconnect as pusherDisconnect, getInstance as getPusherInstance, getActiveChannels as pusherGetActiveChannels, getChannelHandlers as pusherGetChannelHandlers } from '@/lib/pusherClient'

type PusherConfig = {
  enabled?: boolean
  key?: string
  cluster?: string
  useTLS?: boolean
  authEndpoint?: string
  logToConsole?: boolean
}

// Singleton Pusher instance shared across hook users
// (No module-level pusher instance or registry here - delegated to shared client)

export type UsePusherOptions = {
  autoConnect?: boolean
  fetchConfig?: boolean
  config?: PusherConfig
}

export default function usePusherClient({ autoConnect = true, fetchConfig = true, config }: UsePusherOptions = {}) {
  const mountedRef = useRef(true)

  useEffect(() => { return () => { mountedRef.current = false } }, [])

  const init = useCallback(async (cfg?: PusherConfig) => {
    // delegate to shared client; prefer explicit cfg, then provided `config`, then server fetch
    if (cfg) return await initPusher(cfg)
    if (config) return await initPusher(config)
    if (fetchConfig) return await initPusher()
    return getPusherInstance()
  }, [config, fetchConfig])

  useEffect(() => {
    if (!autoConnect) return
    ;(async () => { try { await init() } catch {} })()
  }, [autoConnect, init])

  const subscribe = useCallback(async (channelName: string, eventName: string, handler: (payload: any) => void) => {
    return await pusherSubscribe(channelName, eventName, handler)
  }, [])

  const subscribeMany = useCallback(async (channelName: string, handlers: Record<string, (p: any) => void>) => {
    return await pusherSubscribeMany(channelName, handlers)
  }, [])

  // delegated diagnostics

  const disconnect = useCallback(() => { pusherDisconnect() }, [])

  const getInstance = useCallback(() => getPusherInstance(), [])
  const getActiveChannels = useCallback(() => pusherGetActiveChannels(), [])
  const getChannelHandlers = useCallback((channelName: string) => pusherGetChannelHandlers(channelName), [])

  return { init, subscribe, subscribeMany, disconnect, getInstance, getActiveChannels, getChannelHandlers }
}
 
