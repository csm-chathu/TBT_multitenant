"use client"

import { forwardRef } from "react"
import FormField from "./FormField"
import TagInput, { type TagInputHandle } from "../Atomic/TagInput"

interface TagInputFieldProps {
  label?: string
  name: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
  className?: string
  maxTags?: number
  suggestions?: string[]
}

const TagInputField = forwardRef<TagInputHandle, TagInputFieldProps>(({
  label,
  tags,
  onTagsChange,
  placeholder,
  disabled = false,
  required = false,
  error,
  hint,
  className,
  maxTags,
  suggestions,
}, ref) => {
  return (
    <FormField label={label} error={error} hint={hint} required={required} className={className}>
      <div className="">
        <TagInput ref={ref} tags={tags} onTagsChange={onTagsChange} placeholder={placeholder} disabled={disabled} maxTags={maxTags} suggestions={suggestions} />
      </div>
    </FormField>
  )
})

TagInputField.displayName = "TagInputField"

export default TagInputField
