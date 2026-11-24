import * as crypto from 'crypto'

export function generateHash(prefix = 'inv'): string {
  const rand = crypto.randomBytes(6).toString('hex')
  const ts = Date.now().toString(36)
  return `${prefix}_${ts}_${rand}`
}

