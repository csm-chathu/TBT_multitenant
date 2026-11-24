"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, AlertCircle, X } from "lucide-react"
import FormField from "./FormField"
import { cn } from "@/lib/utils"
import { validateFiles, FileValidationError, formatFileSize, FILE_UPLOAD_CONSTRAINTS } from "@/lib/fileValidation"

interface FileUploadFieldProps {
  label: string
  name: string
  onFileChange: (files: FileList | null) => void
  accept?: string
  multiple?: boolean
  maxSize?: string
  acceptedTypes?: string
  required?: boolean
  error?: string
  hint?: string
  disabled?: boolean
  className?: string
  selectedFiles?: File[]
  onValidationError?: (errors: FileValidationError[]) => void
  onFileRemove?: (index: number) => void
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  name,
  onFileChange,
  accept = ".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx,.xls,.xlsx",
  multiple = true,
  maxSize = "10MB",
  acceptedTypes = "JPEG, PNG, GIF, WebP, PDF, TXT, DOC, DOCX, XLS, XLSX",
  required = false,
  error,
  hint,
  disabled = false,
  className,
  selectedFiles = [],
  onValidationError,
  onFileRemove,
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [validationErrors, setValidationErrors] = useState<FileValidationError[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isMaxFilesReached = selectedFiles.length >= FILE_UPLOAD_CONSTRAINTS.MAX_FILES
  
  const handleBrowseClick = () => {
    if (!disabled && !isMaxFilesReached && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) {
      onFileChange(null)
      setValidationErrors([])
      if (fileInputRef.current) {
        // Ensure the same file can be selected again after clearing
        fileInputRef.current.value = ""
      }
      return
    }

    const fileArray = Array.from(files)
    const validation = validateFiles(fileArray)
    
    setValidationErrors(validation.errors)
    
    if (onValidationError) {
      onValidationError(validation.errors)
    }

    // Always pass the files to parent, let parent decide what to do with validation errors and accumulation
    onFileChange(files)

    // Reset the underlying input so selecting the same file again will fire onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (indexToRemove: number) => {
    if (!selectedFiles.length) return
    
    // If parent provides onFileRemove callback, use it for direct state management
    if (onFileRemove) {
      onFileRemove(indexToRemove)
      // Also clear the input so the same file can be picked again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
      return
    }
    
    // Fallback: try to convert to FileList (may not work reliably in all browsers)
    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove)
    const dt = new DataTransfer()
    updatedFiles.forEach(file => dt.items.add(file))
    
    onFileChange(dt.files.length > 0 ? dt.files : null)
    
    // Re-validate remaining files
    if (updatedFiles.length > 0) {
      const validation = validateFiles(updatedFiles)
      setValidationErrors(validation.errors)
      if (onValidationError) {
        onValidationError(validation.errors)
      }
    } else {
      setValidationErrors([])
      if (onValidationError) {
        onValidationError([])
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isMaxFilesReached) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (!disabled && !isMaxFilesReached) {
      const files = e.dataTransfer.files
      handleFileSelect(files)
    }
  }

  return (
    <FormField label={label} required={required} error={error} hint={hint} className={className} htmlFor={name}>
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          id={name}
          className="hidden"
          multiple={multiple}
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled || isMaxFilesReached}
        />
        
        {/* Upload Area */}
        <div className="p-2 mt-3 bg-surface-secondary w-full h-[280px] rounded-2xl">
          <div
            className={cn(
              "relative h-full flex flex-col justify-center items-center border border-dashed border-borderColor-secondary rounded-xl transition-colors",
              !disabled && !isMaxFilesReached && "hover:border-primary-300 hover:bg-primary-50 cursor-pointer",
              (disabled || isMaxFilesReached) && "opacity-50 cursor-not-allowed",
              isDragOver && !isMaxFilesReached && "border-primary-500 bg-primary-100"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <Upload className="text-4xl text-primary-500 w-10 h-10" />
            <p>Drag and drop files here or</p>
            <div className="my-6 space-x-3">
              {/* <button
                type="button"
                className="h-8 px-3 rounded-md text-sm border border-borderColor-primary hover:bg-gray-50"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  // TODO: Implement recent uploads functionality
                }}
              >
                Recent Upload
              </button> */}
              <button
                type="button"
                className="h-8 px-3 rounded-md text-sm text-base-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={disabled || isMaxFilesReached}
                onClick={(e) => {
                  e.stopPropagation()
                  handleBrowseClick()
                }}
              >
                {isMaxFilesReached ? 'Max Files Reached' : 'Browse'}
              </button>
            </div>
            <p className="text-xs text-center text-textColor-muted">Accepted file type: {acceptedTypes}</p>
            <p className="text-xs text-center text-textColor-muted">
              Max file size {maxSize} • {selectedFiles.length > 0 
                ? `${selectedFiles.length}/${FILE_UPLOAD_CONSTRAINTS.MAX_FILES} files selected (${FILE_UPLOAD_CONSTRAINTS.MAX_FILES - selectedFiles.length} remaining)`
                : `Max ${FILE_UPLOAD_CONSTRAINTS.MAX_FILES} files`}
            </p>
          </div>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg max-h-48 overflow-auto">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-gray-700">
                Selected Files ({selectedFiles.length}/{FILE_UPLOAD_CONSTRAINTS.MAX_FILES})
              </p>
              {selectedFiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onFileChange(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ""
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 p-2 bg-white rounded border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500"
                    disabled={disabled}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">File Upload Issues:</p>
                <ul className="mt-2 space-y-1 text-sm text-red-700">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error.message}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </FormField>
  )
}

export default FileUploadField
