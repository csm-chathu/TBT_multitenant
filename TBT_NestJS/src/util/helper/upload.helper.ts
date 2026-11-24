import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'

/**
 * Resolve upload temp directory with optional subdirectory.
 * Respects env UPLOAD_TMP_DIR, falls back to os.tmpdir().
 */
export function getUploadTempDir(subdir?: string): string {
  const base =
    (process.env.UPLOAD_TMP_DIR && process.env.UPLOAD_TMP_DIR.trim()) || os.tmpdir()
  return subdir ? path.join(base, subdir) : base
}

/**
 * Ensure directory exists (sync wrappers are fine for multer callbacks).
 */
export function ensureDirSync(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * Sanitize filename to avoid path traversal and control chars.
 */
export function sanitizeFilename(name: string): string {
  return (name || '')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/[\u0000-\u001F\u007F]/g, '_')
}

/**
 * Basic CSV file check (by mimetype or extension).
 */
export function isCsvFile(file: { mimetype?: string; originalname?: string }): boolean {
  const ext = (file.originalname || '').toLowerCase()
  return file.mimetype === 'text/csv' || ext.endsWith('.csv')
}

