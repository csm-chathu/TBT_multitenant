"use client"

import { useState, type KeyboardEvent, useImperativeHandle, forwardRef, useRef, useEffect } from "react"
import Input from "./Input"

interface TagInputProps {
  tags?: string[]
  onTagsChange?: (tags: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  maxTags?: number
  suggestions?: string[]
}

export interface TagInputHandle {
  flushPendingValue: () => string | null
  getPendingValue: () => string
}

const TagInput = forwardRef<TagInputHandle, TagInputProps>(({
  tags: externalTags,
  onTagsChange,
  placeholder = "Enter a tags",
  className = "",
  disabled = false,
  maxTags,
  suggestions = [],
}, ref) => {
  const [internalTags, setInternalTags] = useState<string[]>([])
  const [inputValue, setInputValue] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const suggestionsRef = useRef<HTMLUListElement>(null)
  const wasFocusedRef = useRef(false)
  const ignoreBlurRef = useRef(false)

  const tags = externalTags || internalTags
  const updateTags = onTagsChange || setInternalTags

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(s)
  )

  // Maintain focus on input after tags are added
  useEffect(() => {
    if (wasFocusedRef.current && inputRef.current && document.activeElement !== inputRef.current && !ignoreBlurRef.current) {
      requestAnimationFrame(() => {
        if (inputRef.current && !ignoreBlurRef.current) {
          inputRef.current.focus()
        }
      })
    }
  }, [tags.length])

  // Reset highlighted index when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1)
  }, [inputValue])

  const addTagFromInput = (value?: string, shouldMaintainFocus = false) => {
    const val = (value ?? inputValue).trim()
    if (val.length > 0 && !tags.includes(val)) {
      if (maxTags !== undefined && tags.length >= maxTags) return
      if (shouldMaintainFocus) {
        wasFocusedRef.current = true
      } else {
        wasFocusedRef.current = document.activeElement === inputRef.current
      }
      updateTags([...tags, val])
      setInputValue("")
      setShowSuggestions(false)
    }
  }

  const addSuggestion = (suggestion: string) => {
    if (!tags.includes(suggestion)) {
      if (maxTags !== undefined && tags.length >= maxTags) return
      wasFocusedRef.current = true
      updateTags([...tags, suggestion])
      setInputValue("")
      setShowSuggestions(false)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  useImperativeHandle(ref, () => ({
    flushPendingValue: () => {
      const val = inputValue.trim()
      if (val.length > 0 && !tags.includes(val)) {
        addTagFromInput()
        return val
      }
      return null
    },
    getPendingValue: () => inputValue.trim()
  }))

  const addTag = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      if (filteredSuggestions.length > 0) {
        setShowSuggestions(true)
        setHighlightedIndex((prev) => Math.min(prev + 1, filteredSuggestions.length - 1))
      }
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setHighlightedIndex((prev) => Math.max(prev - 1, -1))
      return
    }
    if (event.key === "Escape") {
      setShowSuggestions(false)
      setHighlightedIndex(-1)
      return
    }
    if (event.code === "Comma" || event.code === "Enter") {
      event.preventDefault()
      event.stopPropagation()
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        addSuggestion(filteredSuggestions[highlightedIndex])
        return
      }
      const val = inputValue.trim()
      if (val.length > 0 && !tags.includes(val)) {
        if (maxTags !== undefined && tags.length >= maxTags) return
        wasFocusedRef.current = true
        updateTags([...tags, val])
        setInputValue("")
        setShowSuggestions(false)
        Promise.resolve().then(() => {
          if (inputRef.current && wasFocusedRef.current) inputRef.current.focus()
        })
      }
    }
  }

  const handleFocus = () => {
    wasFocusedRef.current = true
    ignoreBlurRef.current = false
    if (inputValue || filteredSuggestions.length > 0) setShowSuggestions(true)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const relatedTarget = e.relatedTarget as Node | null
    const container = containerRef.current

    // Focus moved within our component (e.g. clicking a tag's remove button) — keep focus
    if (container && relatedTarget && container.contains(relatedTarget)) {
      ignoreBlurRef.current = true
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          ignoreBlurRef.current = false
        }
      }, 0)
      return
    }

    // Focus genuinely left the component — flush pending text as a chip
    wasFocusedRef.current = false
    setShowSuggestions(false)
    addTagFromInput()
  }

  const removeTag = (index: number) => {
    const newTags = [...tags]
    newTags.splice(index, 1)
    updateTags(newTags)
  }

  const removeLastTag = () => {
    if (inputValue.length === 0 && tags.length > 0) removeTag(tags.length - 1)
  }

  const clearAllTags = () => {
    if (!disabled && tags.length > 0) updateTags([])
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div
        className={`min-h-12 w-full flex flex-wrap items-start gap-2 py-2 px-2 bg-surface-secondary border border-borderColor-secondary duration-200 outline-none rounded-lg ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${className}`}
        onMouseDown={(e) => {
          if (e.target !== inputRef.current && containerRef.current?.contains(e.target as Node)) {
            const target = e.target as HTMLElement
            if (target.closest('[class*="cursor-pointer"]') || target.tagName === 'SPAN') {
              e.preventDefault()
            }
          }
        }}
      >
        {tags.map((tag, index) => (
          <div
            key={index}
            className="text-sm font-semibold flex items-center gap-x-1 h-7 px-2 bg-primary-100 hover:text-primary-600 rounded-md flex-shrink-0"
          >
            {tag}
            {!disabled && (
              <span
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(index)
                  setTimeout(() => inputRef.current?.focus(), 0)
                }}
                className="material-symbols-outlined text-base cursor-pointer"
              >
                close
              </span>
            )}
          </div>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(true)
          }}
          onKeyDown={(e) => {
            if (!disabled) {
              e.stopPropagation()
              addTag(e)
              if (e.key === "Backspace") removeLastTag()
            }
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={maxTags !== undefined && tags.length >= maxTags ? `Maximum ${maxTags} tags allowed` : placeholder}
          disabled={disabled || (maxTags !== undefined && tags.length >= maxTags)}
          className="outline-none border-none ring-0 focus:ring-0 focus:outline-none flex-1 min-w-[120px] bg-transparent disabled:cursor-not-allowed h-8"
        />
        {!disabled && tags.length > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation()
              clearAllTags()
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
            className="material-symbols-outlined text-base cursor-pointer text-textColor-muted hover:text-textColor-base flex-shrink-0"
            title="Clear all"
          >
            close
          </span>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && !disabled && (
        <ul
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full bg-surface-primary border border-borderColor-secondary rounded-lg shadow-lg max-h-48 overflow-auto"
        >
          {filteredSuggestions.map((suggestion, idx) => (
            <li
              key={suggestion}
              onMouseDown={(e) => {
                e.preventDefault()
                addSuggestion(suggestion)
              }}
              className={`px-3 py-2 text-sm cursor-pointer ${
                idx === highlightedIndex
                  ? "bg-primary-100 text-primary-700"
                  : "hover:bg-surface-secondary"
              }`}
            >
              {suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})

TagInput.displayName = "TagInput"

export default TagInput
