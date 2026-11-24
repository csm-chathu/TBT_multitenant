// realtimeDebug removed — provide a noop stub to avoid runtime imports
const noop = {
  setState: (_: any) => {},
  getState: () => ({}),
  subscribe: (_: any) => {},
  unsubscribe: (_: any) => {},
}

export default noop
