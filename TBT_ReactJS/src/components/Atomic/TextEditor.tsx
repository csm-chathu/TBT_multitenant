"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"

interface TextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

const TextEditor: React.FC<TextEditorProps> = ({
  value = "",
  onChange = () => {},
  placeholder = "Type @ to mention and notify someone",
  className = "",
  disabled = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const [, setActiveFormats] = useState<Set<string>>(new Set())

  const textStyle = [
    { id: "format_bold", command: "bold" },
    { id: "format_italic", command: "italic" },
    { id: "format_underlined", command: "underline" },
    { id: "format_strikethrough", command: "strikeThrough" },
    { id: "code", command: "code" },
  ]

  // Update editor content when value prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || ""
    }
  }, [value])

  // Check active formats
  const checkActiveFormats = () => {
    if (!editorRef.current || disabled) return
    const formats = new Set<string>()
    textStyle.forEach(({ id, command }) => {
      try {
        if (document.queryCommandState(command)) {
          formats.add(id)
        }
      } catch (e) {
        // Some commands may not be supported
      }
    })
    setActiveFormats(formats)
  }

  

  const handleInput = () => {
    if (!editorRef.current || disabled) return
    onChange(editorRef.current.innerHTML)
    checkActiveFormats()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (disabled) {
      e.preventDefault()
      return
    }
    
    // Allow paste but strip formatting to keep it simple
    e.preventDefault()
    const text = e.clipboardData.getData("text/plain")
    document.execCommand("insertText", false, text)
  }

  return (
    <div
      className={`w-full h-32 border border-borderColor-secondary rounded-xl overflow-hidden ${className} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onPaste={handlePaste}
        onBlur={checkActiveFormats}
        onMouseUp={checkActiveFormats}
        onKeyUp={checkActiveFormats}
        className={`w-full h-full bg-surface-primary outline-none p-5 overflow-y-auto ${disabled ? "cursor-not-allowed" : ""}`}
        style={{ minHeight: "calc(100% - 2.5rem)" }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}

export default TextEditor
