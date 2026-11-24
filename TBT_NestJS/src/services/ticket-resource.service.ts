import { Injectable, NotFoundException } from '@nestjs/common'
import { TicketResourceRepository } from '../repositories/ticket-resource.repository'
import { S3Service } from './s3.service'
import { TicketsResourceAttributes } from 'src/intertfaces/tickets-resource.interface'
import { Ticket } from '../models'
import * as fs from 'fs'
import type { Express } from 'express'

export type ResourceWithUrls = TicketsResourceAttributes & {
  file_url?: string
  thumb_url?: string
}

@Injectable()
export class TicketResourceService {
  constructor(
    private readonly repo: TicketResourceRepository,
    private readonly s3: S3Service,
  ) {}

  async uploadForTicket(params: {
    ticketId: number
    file: Express.Multer.File | { buffer?: Buffer; path?: string; originalname: string; mimetype: string }
    remarks?: string
  }): Promise<ResourceWithUrls> {
    const key = this.s3.generateObjectKey(`tickets/${params.ticketId}`, params.file.originalname)
    const buffer: Buffer = params.file?.buffer ?? (params.file?.path ? fs.readFileSync(params.file.path) : undefined as any)
    const { url } = await this.s3.uploadBuffer({
      buffer,
      contentType: params.file.mimetype,
      key,
    })

    const record: TicketsResourceAttributes = {
      file_mime_type: params.file.mimetype,
      file_path: key,
      hash: url,
      remarks: params.remarks,
      ticket_id: params.ticketId,
    }

    const created = await this.repo.create(record)
    const withUrls = await this.addUrls([created])
    return withUrls[0]
  }

  async listForTicket(ticketId: number): Promise<ResourceWithUrls[]> {
    const records = await this.repo.findByTicketId(ticketId)
    return await this.addUrls(records)
  }

  // Helpers to support both numeric ID and string hash as ticket reference
  private async resolveTicketId(ticketRef: string): Promise<number> {
    // If numeric, use directly
    const asNumber = Number(ticketRef)
    if (!Number.isNaN(asNumber) && Number.isFinite(asNumber)) {
      return asNumber
    }
    // Otherwise, look up by hash
    const ticket = await Ticket.findOne({ where: { hash: ticketRef } })
    if (!ticket) {
      throw new NotFoundException('Ticket not found')
    }
    return ticket.id
  }

  async uploadForTicketRef(params: { ticketRef: string; file: Express.Multer.File; remarks?: string }) {
    const ticketId = await this.resolveTicketId(params.ticketRef)
    return await this.uploadForTicket({ ticketId, file: params.file, remarks: params.remarks })
  }

  async listForTicketRef(ticketRef: string): Promise<ResourceWithUrls[]> {
    const ticketId = await this.resolveTicketId(ticketRef)
    return await this.listForTicket(ticketId)
  }

  async remove(id: number, key?: string) {
    if (key) {
      await this.s3.deleteObject(key)
    }
    const deleted = await this.repo.remove(id)
    if (!deleted) {
      throw new NotFoundException('Resource not found')
    }
    return { deleted: true }
  }

  async getDownloadUrl(id: number): Promise<string> {
    const resource = await this.repo.findById(id)
    if (!resource) {
      throw new NotFoundException('Resource not found')
    }
    if ((resource as any).deletedAt === true || (resource as any).deletedAt === 1) {
      throw new NotFoundException('Resource has been deleted')
    }
    const fileKey = resource.file_path
    if (!fileKey) {
      throw new NotFoundException('File path not found for resource')
    }
    return await this.s3.getSignedUrlForKey(fileKey)
  }

  private async addUrls(records: TicketsResourceAttributes[]): Promise<ResourceWithUrls[]> {
    return Promise.all(
      (records || []).map(async (record: any) => {
        const r: ResourceWithUrls = typeof record.toJSON === 'function' ? (record.toJSON() as ResourceWithUrls) : (record as ResourceWithUrls)
        const fileKey = r.file_path
        const thumbKey = r.thumb_path || fileKey
        if (fileKey) {
          r.file_url = await this.s3.getSignedUrlForKey(String(fileKey))
        }
        if (thumbKey) {
          r.thumb_url = await this.s3.getSignedUrlForKey(String(thumbKey))
        }
        return r
      }),
    )
  }
}



