import React, { useEffect, useState } from 'react'
import realtimeDebug from '@/lib/realtimeDebug'

type State = {
  connected?: boolean
  socketId?: string | null
  channel?: string | null
  lastEvent?: { event: string; payload: unknown; time: string } | null
}

const RealtimeDebugPanel: React.FC = () => {
  const [state, setState] = useState<State>(() => realtimeDebug.getState())

  useEffect(() => {
    const onChange = (s: State) => setState(s)
    realtimeDebug.subscribe(onChange)
    return () => realtimeDebug.unsubscribe(onChange)
  }, [])

  const connected = state.connected ?? false

  return (
    <div className="hidden lg:flex items-center gap-2 px-2 py-1 text-xs text-muted bg-surface-secondary rounded">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
        <span className="font-medium">RT</span>
      </div>
      <div className="min-w-[120px]">
        <div className="truncate">{state.channel ?? 'no-channel'}</div>
        <div className="truncate text-xxs text-muted">{state.socketId ?? 'no-socket'}</div>
      </div>
    </div>
  )
}

export default RealtimeDebugPanel
