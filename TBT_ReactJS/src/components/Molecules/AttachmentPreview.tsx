"use client"

import type React from "react"
import { Download } from "lucide-react"
import imageIcon from "@/assets/Icons/image.svg"
import pdfIcon from "@/assets/Icons/pdf.svg"
import docsIcon from "@/assets/Icons/docs.svg"
import xslIcon from "@/assets/Icons/xsl.svg"
import textIcon from "@/assets/Icons/text.svg"
import zipIcon from "@/assets/Icons/zip.svg"
import videoIcon from "@/assets/Icons/video.svg"
import musicIcon from "@/assets/Icons/music.svg"
import otherIcon from "@/assets/Icons/other.svg"

interface AttachmentPreviewProps {
  fileUrl: string
  downloadUrl: string
  fileName: string
  mimeType?: string
}

const MIME_SUBTYPE_ALIASES: Record<string, string> = {
  pdf: "PDF",
  msword: "DOC",
  "vnd.ms-word": "DOC",
  "vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "wordprocessingml.document": "DOCX",
  "vnd.ms-excel": "XLS",
  "vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "spreadsheetml.sheet": "XLSX",
  plain: "TXT",
  csv: "CSV",
  json: "JSON",
  zip: "ZIP",
  "x-zip-compressed": "ZIP",
  "x-7z-compressed": "7Z",
  "octet-stream": "BIN",
}

const ICON_BY_EXTENSION: Record<string, string> = {
  jpg: imageIcon,
  jpeg: imageIcon,
  png: imageIcon,
  gif: imageIcon,
  webp: imageIcon,
  svg: imageIcon,
  bmp: imageIcon,
  heic: imageIcon,
  heif: imageIcon,
  pdf: pdfIcon,
  doc: docsIcon,
  docx: docsIcon,
  odt: docsIcon,
  rtf: docsIcon,
  xls: xslIcon,
  xlsx: xslIcon,
  csv: xslIcon,
  ods: xslIcon,
  txt: textIcon,
  md: textIcon,
  json: textIcon,
  log: textIcon,
  zip: zipIcon,
  rar: zipIcon,
  "7z": zipIcon,
  gz: zipIcon,
  tar: zipIcon,
  mp4: videoIcon,
  mov: videoIcon,
  avi: videoIcon,
  mkv: videoIcon,
  webm: videoIcon,
  mp3: musicIcon,
  wav: musicIcon,
  flac: musicIcon,
  m4a: musicIcon,
}

const deriveFileLabel = (extension?: string, mime?: string): string => {
  const cleanExtension = extension?.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()
  if (cleanExtension) {
    return cleanExtension.toUpperCase()
  }

  if (!mime) return "FILE"

  const [, subtypeRaw] = mime.split("/")
  if (!subtypeRaw) return mime.toUpperCase()

  const normalizedSubtype = subtypeRaw.toLowerCase()
  if (MIME_SUBTYPE_ALIASES[normalizedSubtype]) {
    return MIME_SUBTYPE_ALIASES[normalizedSubtype]
  }

  if (normalizedSubtype.includes(".")) {
    const lastSegment = normalizedSubtype.split(".").pop()
    if (lastSegment) {
      if (MIME_SUBTYPE_ALIASES[lastSegment]) {
        return MIME_SUBTYPE_ALIASES[lastSegment]
      }
      return lastSegment.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "FILE"
    }
  }

  return normalizedSubtype.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "FILE"
}

const getIconForFile = (extension?: string, mime?: string): string => {
  const extensionKey = extension?.toLowerCase()
  if (extensionKey && ICON_BY_EXTENSION[extensionKey]) {
    return ICON_BY_EXTENSION[extensionKey]
  }

  if (mime) {
    const [prefix, subtypeRaw] = mime.split("/")
    const subtypeKey = subtypeRaw?.toLowerCase()
    if (subtypeKey && ICON_BY_EXTENSION[subtypeKey]) {
      return ICON_BY_EXTENSION[subtypeKey]
    }

    if (subtypeKey) {
      if (subtypeKey.includes("pdf")) return pdfIcon
      if (subtypeKey.includes("word") || subtypeKey.includes("officedocument")) return docsIcon
      if (subtypeKey.includes("excel") || subtypeKey.includes("spreadsheet") || subtypeKey.includes("sheet")) return xslIcon
      if (subtypeKey.includes("zip") || subtypeKey.includes("compress")) return zipIcon
      if (subtypeKey.includes("audio")) return musicIcon
      if (subtypeKey.includes("video")) return videoIcon
      if (subtypeKey.includes("text")) return textIcon
    }

    if (prefix) {
      switch (prefix) {
        case "image":
          return imageIcon
        case "audio":
          return musicIcon
        case "video":
          return videoIcon
        case "text":
          return textIcon
        default:
          break
      }
    }
  }

  return otherIcon
}

const decodeComponent = (value?: string | null): string => {
  if (!value) return ""
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const looksGeneratedPrefix = (segment: string): boolean => {
  const trimmed = segment.trim()
  if (!trimmed) return true
  const cleaned = trimmed.replace(/[^a-zA-Z0-9]/g, "")
  if (!cleaned) return true
  if (/^\d{4}-\d{2}-\d{2}T\d{2}/.test(trimmed)) return true
  if (/^[0-9a-f]{8,}$/i.test(cleaned)) return true
  if (/^\d{6,}$/.test(cleaned)) return true
  return false
}

const sanitizeFileName = (value?: string | null): string | null => {
  if (!value) return null
  const decoded = decodeComponent(value)
  const withoutQuery = decoded.split("?")[0]?.split("#")[0] ?? decoded
  const leaf = withoutQuery.split(/[/\\]/).pop() ?? withoutQuery
  const trimmed = leaf.trim()
  if (!trimmed) return null

  const dotIndex = trimmed.lastIndexOf(".")
  if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
    return trimmed
  }

  const base = trimmed.slice(0, dotIndex)
  const ext = trimmed.slice(dotIndex)
  const segments = base.split("-").filter(Boolean)

  if (segments.length <= 1) {
    return `${base}${ext}`
  }

  let firstMeaningful = 0
  while (
    firstMeaningful < segments.length - 1 &&
    looksGeneratedPrefix(segments[firstMeaningful])
  ) {
    firstMeaningful++
  }

  const cleanedBase =
    segments.slice(firstMeaningful).join("-") ||
    segments[segments.length - 1] ||
    base

  return `${cleanedBase}${ext}`
}

const deriveDisplayName = (primary?: string | null, fallback?: string | null): string => {
  const sanitizedPrimary = sanitizeFileName(primary)
  if (sanitizedPrimary) {
    return sanitizedPrimary
  }
  const sanitizedFallback = sanitizeFileName(fallback)
  if (sanitizedFallback) {
    return sanitizedFallback
  }
  return "attachment"
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  fileUrl,
  downloadUrl,
  fileName,
  mimeType,
}) => {
  const getFileExtension = (name: string): string => {
    const parts = name.split(".")
    return parts.length > 1 ? parts[parts.length - 1] : ""
  }

  const isImage = (url: string, mime?: string): boolean => {
    if (mime?.startsWith("image/")) return true
    const lower = url.toLowerCase()
    return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg", ".heic", ".heif"].some((ext) =>
      lower.includes(ext)
    )
  }

  const effectiveFileName = deriveDisplayName(fileName, downloadUrl || fileUrl)
  const extensionFromName = effectiveFileName ? getFileExtension(effectiveFileName) : ""
  const extensionFromUrl = fileUrl ? getFileExtension(fileUrl.split("?")[0] ?? "") : ""
  const rawExtension = (extensionFromName || extensionFromUrl).toLowerCase()
  const fileLabel = deriveFileLabel(rawExtension, mimeType)
  const iconSrc = getIconForFile(rawExtension, mimeType)
  const showImagePreview = Boolean(fileUrl && isImage(fileUrl, mimeType))
  const downloadHref = downloadUrl || fileUrl || ""
  const hasDownloadHref = Boolean(downloadHref)
  const secondaryInfo =
    mimeType || (fileLabel && fileLabel !== "FILE" ? fileLabel : undefined)
  const cardInner = (
    <div className="relative w-full h-full">
      {showImagePreview ? (
        <div className="w-full h-full flex items-center justify-center bg-surface-primary p-2">
          <img
            src={fileUrl}
            alt={effectiveFileName}
            className="max-w-full max-h-full object-contain rounded"
          />
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-surface-primary p-6">
          <img src={iconSrc} alt={`${fileLabel} icon`} className="w-12 h-12" />
          <span className="text-xs font-semibold uppercase tracking-wide text-textColor-muted">{fileLabel || "FILE"}</span>
        </div>
      )}
    </div>
  )

  const cardClasses =
    "bg-white rounded-lg shadow-md border border-borderColor-secondary overflow-hidden w-[150px] h-[100px]"

  return (
    <div className="space-y-3 w-[150px]">
      {hasDownloadHref ? (
        <a
          href={downloadHref}
          target="_blank"
          rel="noreferrer"
          className={`${cardClasses} block`}
          title={`Open ${effectiveFileName}`}
        >
          {cardInner}
        </a>
      ) : (
        <div className={cardClasses}>{cardInner}</div>
      )}

      <div className="flex items-start justify-between w-full gap-2">
        <div className="min-w-0">
          <span
            className="text-primary-600 font-medium text-sm truncate block"
            title={effectiveFileName}
          >
            {effectiveFileName}
          </span>
          {secondaryInfo && (
            <span className="text-xs text-textColor-muted truncate block" title={secondaryInfo}>
              {secondaryInfo}
            </span>
          )}
        </div>
        {hasDownloadHref && (
          <a
            href={downloadHref}
            target="_blank"
            rel="noreferrer"
            download
            className="text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-1 flex-shrink-0 mt-0.5"
            title={`Download ${effectiveFileName}`}
            aria-label={`Download ${effectiveFileName}`}
          >
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}

export default AttachmentPreview

