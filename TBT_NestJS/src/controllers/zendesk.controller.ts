import {
  Body,
  Controller,
  Logger,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TicketService } from '../services/ticket.service';
import { CreateZendeskTicketDto, ZendeskWebhookPayloadDto } from '../dto/ticket/zendesk-ticket.dto';
import { ZendeskWebhookLog } from '../models/zendesk_webhook_log';

@ApiTags('Zendesk')
@Controller(['zendesk'])
export class ZendeskController {
  private readonly logger = new Logger(ZendeskController.name);

  constructor(private readonly ticketService: TicketService) {}

  @Post(['', 'tickets', 'ticket', 'webhook'])
  @ApiOperation({ summary: 'Create ticket from Zendesk webhook (Public / Unauthenticated)' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully from Zendesk' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  async createTicket(@Body() raw: ZendeskWebhookPayloadDto) {
    const detail = raw.detail ?? {};

    // Strip email signature — everything after standalone "--" line
    const fullDescription = detail.description || '';
    const signatureSplit = fullDescription.split(/\r?\n--\r?\n/);
    const cleanDescription = signatureSplit[0].trim();
    const signaturePart = signatureSplit.slice(1).join('\n--\n');

    // Try to extract email from the signature block for customer lookup
    const emailMatch = signaturePart.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    const extractedEmail = emailMatch ? emailMatch[0].toLowerCase() : undefined;

    // Map actual Zendesk envelope → internal DTO
    const dto: CreateZendeskTicketDto = {
      ticket_id: detail.id,
      title: detail.id ? `${detail.subject} [Zendesk #${detail.id}]` : detail.subject,
      description: cleanDescription,
      status: detail.status,
      priority: detail.priority,
      tags: detail.tags ?? undefined,
      updated_at: detail.updated_at,
      requester: extractedEmail ? { email: extractedEmail } : undefined,
    };

    this.logger.log(
      `Zendesk webhook [${raw.type || 'N/A'}] ticket #${dto.ticket_id || 'N/A'}: "${dto.title || 'No Title'}" via ${detail.via?.channel || 'N/A'} requester: ${extractedEmail || 'unknown'}`,
    );

    const log = await ZendeskWebhookLog.create({
      zendesk_ticket_id: dto.ticket_id ? String(dto.ticket_id) : undefined,
      payload: raw as object,
    }).catch((err) => this.logger.warn(`Failed to log Zendesk payload: ${err?.message}`));

    const result = await this.ticketService.createZendeskTicket(dto);

    if (log && (result as any)?.id) {
      await log.update({ created_ticket_id: (result as any).id }).catch(() => {});
    }

    return result;
  }
}
