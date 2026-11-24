import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { S3Client, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import * as crypto from 'crypto'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

@Injectable()
export class S3Service {
  private readonly client: any
  private readonly bucket: string
  private readonly publicBaseUrl?: string
  private readonly forcePathStyle: boolean
  private readonly acl?: string
  private readonly basePrefix: string
  private readonly defaultExpireSeconds: number

  constructor() {
    const region = (process.env.AWS_DEFAULT_REGION || 'us-east-1').trim()
    const useEndpoint = (process.env.S3_USE_ENDPOINT || '').toLowerCase() === 'true'
    const rawEndpoint = process.env.AWS_URL
    const endpoint = useEndpoint && rawEndpoint ? rawEndpoint.trim() : undefined
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim()
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim()
    this.bucket = (process.env.AWS_BUCKET || '').trim()
    this.publicBaseUrl = endpoint ? endpoint.replace(/\/$/, '') : undefined
    this.forcePathStyle = Boolean(endpoint)
    this.acl = (process.env.S3_ACL || '').trim() || undefined
    // Base prefix (aka top-level folder) for all S3 uploads, e.g., "v2"
    this.basePrefix = (process.env.S3_BASE_PREFIX || '').trim().replace(/^\/+|\/+$/g, '')
    // Default expiration time for signed URLs (in seconds)
    const expireSeconds = process.env.AWS_SIGNED_URL_EXPIRE_SECONDS
    this.defaultExpireSeconds = expireSeconds ? parseInt(expireSeconds, 10) : 3600

    if (!this.bucket || !accessKeyId || !secretAccessKey) {
      throw new InternalServerErrorException('Missing AWS configuration. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_BUCKET.')
    }

    this.client = new (S3Client as any)({
      region,
      endpoint,
      forcePathStyle: this.forcePathStyle,
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    })
  }

  generateObjectKey(prefix: string, originalName: string): string {
    const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const unique = crypto.randomUUID()
    const now = new Date().toISOString().replace(/[:.]/g, '-')
    const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, '')
    const combined = [this.basePrefix, normalizedPrefix].filter(Boolean).join('/')
    return `${combined}/${now}-${unique}-${safeName}`
  }

  async uploadBuffer(params: {
    buffer: Buffer
    contentType: string
    key: string
    acl?: string
  }): Promise<{ key: string; url: string }>
  {
    try {
      const upload = new (Upload as any)({
        client: this.client,
        params: {
          Bucket: this.bucket,
          Key: params.key,
          Body: params.buffer,
          ContentType: params.contentType,
          // Only set ACL if explicitly provided either via method param or env (for buckets with ACLs enabled)
          ...(params.acl || this.acl ? { ACL: (params.acl as any) || (this.acl as any) } : {}),
        },
      })
      await upload.done()

      const url = this.buildPublicUrl(params.key)
      return { key: params.key, url }
    } catch (error) {
      // If ACLs are not supported, retry once without ACL
      const code = error?.Code || error?.code || error?.name
      const msg = error?.message
      // eslint-disable-next-line no-console
      console.error('S3 upload error', { code, message: msg })
      if (code === 'AccessControlListNotSupported' || /ACL|AccessControlList/i.test(msg || '')) {
        try {
          const retry = new (Upload as any)({
            client: this.client,
            params: {
              Bucket: this.bucket,
              Key: params.key,
              Body: params.buffer,
              ContentType: params.contentType,
              // No ACL on retry
            },
          })
          await retry.done()
          const url = this.buildPublicUrl(params.key)
          return { key: params.key, url }
        } catch (retryErr) {
          // eslint-disable-next-line no-console
          console.error('S3 upload retry failed', retryErr)
        }
      }
      throw new InternalServerErrorException('Failed to upload to S3')
    }
  }

  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
    } catch (error) {
      // swallow errors to avoid blocking delete of DB record
    }
  }

  buildPublicUrl(key: string): string {
    if (this.publicBaseUrl) {
      if (this.forcePathStyle) {
        return `${this.publicBaseUrl}/${this.bucket}/${encodeURI(key)}`
      }
      return `${this.publicBaseUrl}/${encodeURI(key)}`
    }
    return `https://${this.bucket}.s3.${process.env.AWS_DEFAULT_REGION || 'us-west-1'}.amazonaws.com/${encodeURI(key)}`
  }

  async getSignedUrlForKey(key: string, expiresInSeconds?: number): Promise<string> {
    const expireTime = expiresInSeconds ?? this.defaultExpireSeconds
    try {
      const command = new GetObjectCommand({ Bucket: this.bucket, Key: key })
      const signedUrl = await getSignedUrl(this.client, command, { expiresIn: expireTime })
      // Verify the URL is actually a presigned URL (contains query parameters)
      if (!signedUrl || !signedUrl.includes('?')) {
        throw new Error('Generated URL does not appear to be a presigned URL')
      }
      return signedUrl
    } catch (error) {
      // Log the error for debugging
      console.error('Failed to generate presigned URL:', {
        error: error?.message || error,
        bucket: this.bucket,
        key: key,
        region: process.env.AWS_DEFAULT_REGION,
      })
      // Don't fallback to public URL - throw error instead so we know what's wrong
      throw new InternalServerErrorException(
        `Failed to generate presigned URL for ${key}: ${error?.message || 'Unknown error'}. ` +
        `Please check AWS credentials and bucket permissions.`
      )
    }
  }

  /**
   * Generate a signed URL for a file path (compatible with old Sails.js helper)
   * @param filePath - The S3 object key (file path)
   * @returns Signed URL that expires based on AWS_SIGNED_URL_EXPIRE_SECONDS or default 3600 seconds
   */
  async generateSignedUrl(filePath: string): Promise<string> {
    return await this.getSignedUrlForKey(filePath, this.defaultExpireSeconds)
  }
}



