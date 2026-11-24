export function extractMessage(input: unknown): string {
  if (!input) return 'An error occurred'
  try {
    const anyInput = input as any
    if (anyInput.response && anyInput.response.data) {
      const data = anyInput.response.data
      if (typeof data === 'string') return data
      if (data.message) return String(data.message)
      if (data.error) return String(data.error)
    }
    if (anyInput.message) return String(anyInput.message)
    if (typeof input === 'string') return input
    return JSON.stringify(input)
  } catch (e) {
    return 'An error occurred'
  }
}

export default extractMessage
