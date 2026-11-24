export const normalizeStatus = (s: unknown): string => {
  if (s === null || s === undefined) return 'N/A'
  return String(s).toLowerCase().trim()
}

export const getStatusClass = (s: unknown): string => {
  const status = normalizeStatus(s)
  if (!status || status === 'n/a') return 'status-chip'
  if (status.includes('in progress') || status.includes('in_progress') || status.includes('inprogress') || status === 'in-progress') {
    return 'status-chip status-in-progress'
  }
  // match whole word 'resolved' to avoid matching 'unresolved'
  if (/\bresolved\b/.test(status)) {
    return 'status-chip status-resolved'
  }

  // match whole word 'closed' to avoid accidental substring matches
  if (/\bclosed\b/.test(status)) {
    return 'status-chip status-closed'
  }

  if (status.includes('hold') || status.includes('on hold') || status === 'on-hold') {
    return 'status-chip status-on-hold'
  }

  if (status.includes('pending') || status.includes('awaiting')) {
    return 'status-chip status-pending'
  }

  // default to open/info style
  return 'status-chip status-open'
}

export const getAgingClass = (bucket: unknown): string => {
  const b = String(bucket || '').toLowerCase().trim()
  if (!b || b === 'n/a') return 'aging-chip aging-na'
  if (b === '-' || b === 'resolved' || b === 'closed') return 'aging-chip aging-dash'
  if (b === '0-5') return 'aging-chip aging-0-5'
  if (b === '6-10') return 'aging-chip aging-6-10'
  if (b === '11-20') return 'aging-chip aging-11-20'
  if (b === '21-30') return 'aging-chip aging-21-30'
  if (b === '>30') return 'aging-chip aging-gt-30'
  return 'aging-chip aging-na'
}

export const getStatusColors = (s: unknown): { bg: string; fg: string } => {
  const status = normalizeStatus(s)
  if (!status || status === 'n/a') return { bg: 'var(--color-surface-secondary)', fg: 'var(--color-text-muted)' }
  if (status.includes('in progress') || status.includes('in_progress') || status.includes('inprogress') || status === 'in-progress') {
    return { bg: 'var(--color-warning-100)', fg: 'var(--color-warning-600)' }
  }
  if (/\bresolved\b/.test(status)) {
    return { bg: 'var(--color-success-100)', fg: 'var(--color-success-600)' }
  }
  if (/\bclosed\b/.test(status)) {
    return { bg: 'var(--color-surface-secondary)', fg: 'var(--color-text-muted)' }
  }
  if (status.includes('hold') || status.includes('on hold') || status === 'on-hold') {
    return { bg: 'var(--color-warning-100)', fg: 'var(--color-warning-600)' }
  }
  if (status.includes('pending') || status.includes('awaiting')) {
    return { bg: 'var(--color-info-100)', fg: 'var(--color-info-600)' }
  }
  // default open/info
  return { bg: 'var(--color-info-100)', fg: 'var(--color-info-600)' }
}

export type AgingInfo = {
  days: number | null
  label: string
  bucket: string
}

/**
 * Compute aging info (days, label, bucket) for a ticket-like object or a date value.
 * Accepts an object with `dateCreated` or `createdAt` and optional `status`.
 */
export const computeAging = (ticketOrDate: any): AgingInfo => {
  try {
    const start = ticketOrDate && (ticketOrDate.dateCreated || ticketOrDate.createdAt || ticketOrDate)
    if (!start) return { days: null, label: 'N/A', bucket: 'N/A' }

    const startNorm = typeof start === 'string' ? start.replace(/ PS[TD]$/, '').replace(/ [A-Z]{2,4}$/, '') : start
    const startDate = new Date(startNorm)
    if (isNaN(startDate.getTime())) return { days: null, label: 'N/A', bucket: 'N/A' }

    const now = new Date()
    const diffMs = now.getTime() - startDate.getTime()
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    let bucket = ''
    if (days <= 5) bucket = '0-5'
    else if (days <= 10) bucket = '6-10'
    else if (days <= 20) bucket = '11-20'
    else if (days <= 30) bucket = '21-30'
    else bucket = '>30'

    return { days, label: `${days}d`, bucket }
  } catch (e) {
    return { days: null, label: 'N/A', bucket: 'N/A' }
  }
}
