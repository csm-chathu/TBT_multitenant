import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import api from '@/services/api'
import { getStatusClass } from '@/lib/statusUtils'
import { formatPhone } from '@/utils/textUtils'

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

interface TicketResult {
  id: number
  hash?: string
  title?: string
  status?: string
  Customer?: { first_name?: string; last_name?: string; mobile_number?: string }
}

interface Props {
  open: boolean
  onClose: () => void
}

const STORAGE_KEY = 'global-search-chips'

const GlobalSearch: React.FC<Props> = ({ open, onClose }) => {
  const [chips, setChips] = useState<string[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]') } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [tickets, setTickets] = useState<TicketResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Combined query: all chips + current input
  const combinedQuery = [...chips, input.trim()].filter(Boolean).join(' ')
  const debouncedQuery = useDebounce(combinedQuery, 300)

  // Persist chips to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chips))
  }, [chips])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setInput('')
      setActiveIndex(-1)
    }
  }, [open])

  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      setTickets([])
      return
    }
    setLoading(true)
    const q = encodeURIComponent(debouncedQuery.trim())
    api.get(`/tickets?search=${q}&limit=5`).then(res => {
      const raw = res?.data
      setTickets((Array.isArray(raw) ? raw : (raw?.rows ?? [])).slice(0, 5))
    }).catch(() => {
      setTickets([])
    }).finally(() => {
      setLoading(false)
    })
  }, [debouncedQuery])

  const addChip = () => {
    const val = input.trim()
    if (val && !chips.includes(val)) {
      setChips(prev => [...prev, val])
    }
    setInput('')
    setActiveIndex(-1)
  }

  const removeChip = (idx: number) => {
    setChips(prev => prev.filter((_, i) => i !== idx))
    inputRef.current?.focus()
  }

  const allResults = tickets.map(t => ({ type: 'ticket' as const, item: t }))

  const handleSelect = (_type: 'ticket', item: any) => {
    onClose()
    navigate(`/dashboard/tickets/details/${item.hash ?? item.id}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        const r = allResults[activeIndex]
        if (r) { handleSelect(r.type, r.item); return }
      }
      if (input.trim()) { addChip(); return }
    }
    if (e.key === 'Backspace' && !input && chips.length > 0) {
      setChips(prev => prev.slice(0, -1))
      return
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, allResults.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, -1)) }
  }

  if (!open) return null

  const hasResults = allResults.length > 0
  const searched = debouncedQuery.trim().length >= 2

  return createPortal(
    <div
      className="fixed inset-0 z-[999] flex flex-col items-center bg-black/70 backdrop-blur-sm pt-16 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl min-h-[400px] bg-surface-primary rounded-xl shadow-2xl border border-borderColor-secondary overflow-hidden mt-8 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Input row with chips */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-borderColor-secondary">
          <svg className="w-5 h-5 text-text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          {chips.map((chip, idx) => (
            <span key={idx} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-500 text-sm border border-primary-500/40">
              {chip}
              <button onClick={() => removeChip(idx)} className="hover:text-primary-300 leading-none">×</button>
            </span>
          ))}

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); setActiveIndex(-1) }}
            onKeyDown={handleKeyDown}
            placeholder={chips.length === 0 ? 'Search by ID, title, description, phone, location, comment… (Enter to add filter)' : 'Add another keyword…'}
            className="flex-1 min-w-[160px] bg-transparent text-text-primary placeholder:text-text-secondary text-base focus:outline-none"
          />

          {loading && <span className="text-xs text-text-secondary animate-pulse shrink-0">Searching…</span>}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors shrink-0 flex items-center justify-center cursor-pointer"
            title="Close search"
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        {hasResults && (
          <div className="max-h-[420px] overflow-y-auto">
            {tickets.map((t, i) => {
              const rawReporter = [t.Customer?.first_name, t.Customer?.last_name].filter(Boolean).join(' ') || (t.Customer?.mobile_number ?? '')
              const reporter = /^\+?[\d\s\-().]{7,}$/.test(rawReporter.trim()) ? formatPhone(rawReporter) : rawReporter
              const isActive = activeIndex === i
              return (
                <button
                  key={`t-${t.id}`}
                  className={`w-full text-left px-4 py-2.5 flex items-start gap-3 border-b border-borderColor-secondary transition-colors ${isActive ? 'bg-surface-secondary' : 'hover:bg-surface-secondary'}`}
                  onClick={() => handleSelect('ticket', t)}
                >
                  <span className="text-xs text-text-secondary font-mono w-10 shrink-0 pt-0.5">#{t.id}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-primary truncate flex-1">{t.title || '(no title)'}</span>
                      {t.status && <span className={`${getStatusClass(t.status)} shrink-0`}>{t.status}</span>}
                    </div>
                    {reporter && <div className="text-xs text-text-secondary mt-0.5">{reporter}</div>}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* No results */}
        {searched && !loading && !hasResults && (
          <div className="px-4 py-8 text-center text-sm text-text-secondary">
            No results for <span className="text-text-primary">"{debouncedQuery}"</span>
          </div>
        )}

        {/* Prompt */}
        {!searched && (
          <div className="px-4 py-6 text-center text-sm text-text-secondary">
            Type and press <kbd className="border border-borderColor-secondary rounded px-1 bg-surface-primary text-xs">Enter</kbd> to add a keyword filter
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto px-4 py-2 border-t border-borderColor-secondary flex gap-4 text-xs text-text-secondary bg-surface-secondary">
          <span><kbd className="border border-borderColor-secondary rounded px-1 bg-surface-primary">↑↓</kbd> navigate</span>
          <span><kbd className="border border-borderColor-secondary rounded px-1 bg-surface-primary">↵</kbd> add filter / open</span>
          <span><kbd className="border border-borderColor-secondary rounded px-1 bg-surface-primary">⌫</kbd> remove last</span>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default GlobalSearch
