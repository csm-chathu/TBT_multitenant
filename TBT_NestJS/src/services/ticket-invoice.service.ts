import { Injectable, Logger } from '@nestjs/common';
import { TicketInvoiceRepository } from '../repositories/ticket-invoice.repository';
import { CreateTicketInvoiceDto, UpdateTicketInvoiceDto } from '../dto/ticket-invoice/ticket-invoice.dto';
import { S3Service } from './s3.service';
import * as fs from 'fs';
import type { Express } from 'express';

@Injectable()
export class TicketInvoiceService {
  private readonly logger = new Logger(TicketInvoiceService.name);

  constructor(
    private readonly repo: TicketInvoiceRepository,
    private readonly s3: S3Service,
  ) {}

  async getInvoiceForTicket(ticketId: number) {
    const invoice = await this.repo.findByTicketId(ticketId);
    return this.enrichInvoiceWithSignedUrls(invoice);
  }

  async addInvoiceForTicket(ticketId: number, dto: CreateTicketInvoiceDto) {
    dto.ticket_id = ticketId;
    return this.repo.create(dto);
  }

  async updateInvoice(id: number, dto: UpdateTicketInvoiceDto) {
    await this.repo.update(id, dto);
    return { success: true };
  }

  async deleteInvoice(id: number) {
    await this.repo.delete(id);
    return { success: true };
  }

  async uploadInvoiceAttachment(
    ticketId: number,
    file: Express.Multer.File | { buffer?: Buffer; path?: string; originalname: string; mimetype: string }
  ) {
    const key = this.s3.generateObjectKey(`tickets/${ticketId}/invoices`, file.originalname);
    const buffer: Buffer = file?.buffer ?? (file?.path ? fs.readFileSync(file.path) : undefined as any);
    
    const { url: publicUrl } = await this.s3.uploadBuffer({
      buffer,
      contentType: file.mimetype,
      key,
    });

    // Generate a signed URL so the frontend can preview it immediately
    const signedUrl = await this.s3.getSignedUrlForKey(key);

    return { url: signedUrl, key, name: file.originalname, size: (file as any).size };
  }

  private async enrichInvoiceWithSignedUrls(invoice: any) {
    if (!invoice) return invoice;
    const inv = typeof invoice.toJSON === 'function' ? invoice.toJSON() : invoice;
    
    let attachments = inv.attachments;
    let isString = false;
    
    if (typeof attachments === 'string') {
      try {
        attachments = JSON.parse(attachments);
        isString = true;
      } catch (e) {
        // ignore
      }
    }

    if (attachments && Array.isArray(attachments)) {
      for (const attachment of attachments) {
        if (attachment && typeof attachment === 'object' && attachment.key) {
          try {
            attachment.url = await this.s3.getSignedUrlForKey(attachment.key);
          } catch (e) {
            this.logger.warn(`Failed to generate signed URL for invoice attachment ${attachment.key}`);
          }
        }
      }
      inv.attachments = isString ? JSON.stringify(attachments) : attachments;
    }
    return inv;
  }
}
