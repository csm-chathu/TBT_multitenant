import { useState } from 'react'
import api from '@/services/api'

export const DatabaseBackup = () => {
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [s3Result, setS3Result] = useState<{ key: string; filename: string; sizeKb: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      const res = await api.get('/backup/download', { responseType: 'blob' })
      const disposition = res.headers['content-disposition'] || ''
      const match = disposition.match(/filename="?([^"]+)"?/)
      const filename = match?.[1] || `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/octet-stream' }))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Download failed. Ensure mysqldump is available on the server.')
    } finally {
      setDownloading(false)
    }
  }

  const handleS3Backup = async () => {
    setUploading(true)
    setError(null)
    setS3Result(null)
    try {
      const res = await api.post('/backup/s3')
      setS3Result(res.data)
    } catch {
      setError('S3 backup failed. Check AWS configuration and server logs.')
    } finally {
      setUploading(false)
    }
  }

  const busy = downloading || uploading

  return (
    <div>
      <h2 className="text-lg font-semibold text-textColor-base mb-1">Database Backup</h2>
      <p className="text-sm text-textColor-muted mb-6">
        Generate a full SQL dump of the database and either download it locally or upload it to your S3 bucket.
      </p>

      <div className="space-y-4">
        {/* Download */}
        <div className="p-4 border border-borderColor-secondary rounded-lg flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-textColor-base flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-primary-500">download</span>
              Download Backup
            </p>
            <p className="text-xs text-textColor-muted mt-0.5">
              Generate a full SQL dump and save it directly to your device.
            </p>
          </div>
          <button
            onClick={handleDownload}
            disabled={busy}
            className="shrink-0 px-4 py-2 text-sm font-medium bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {downloading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                Generating…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">download</span>
                Download
              </>
            )}
          </button>
        </div>

        {/* S3 */}
        <div className="p-4 border border-borderColor-secondary rounded-lg flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-textColor-base flex items-center gap-1.5">
              <span className="material-symbols-outlined text-base text-primary-500">cloud_upload</span>
              Backup to S3
            </p>
            <p className="text-xs text-textColor-muted mt-0.5">
              Upload a full SQL dump directly to your configured S3 bucket under <code className="bg-surface-secondary px-1 rounded text-[11px]">db-backups/</code>.
            </p>
            {s3Result && (
              <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-300 space-y-0.5">
                <p className="font-medium">✓ Backup uploaded successfully</p>
                <p className="truncate opacity-80">{s3Result.key}</p>
                <p className="opacity-70">{s3Result.sizeKb.toLocaleString()} KB · {s3Result.filename}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleS3Backup}
            disabled={busy}
            className="shrink-0 px-4 py-2 text-sm font-medium border border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {uploading ? (
              <>
                <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                Uploading…
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">cloud_upload</span>
                Backup to S3
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base">error</span>
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
