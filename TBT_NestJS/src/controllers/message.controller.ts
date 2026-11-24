import { BadGatewayException, BadRequestException, Body, Controller, Get, InternalServerErrorException, Post, Param, ParseIntPipe, Query, UseGuards, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { MessageService } from '../services/message.service';
import { BaseMessageDto } from '../dto/message/message.dto';
import { Application, Customer } from '../models';
import { Message } from '../models/message';
import { SmsService } from '../services/sms.service';
import { ReceiveMessageDto } from '../dto/message/receive-message.dto';
import { WhatsAppMetaWebhookDto } from '../dto/message/receive-whatsapp-meta.dto';

@UseGuards(JwtAuthGuard)
@Controller('tickets/:ticketId/messages')
export class MessageController {
  constructor(private readonly service: MessageService, private readonly sms: SmsService) {}

  @Get('count')
  async getSmsCount(@Param('ticketId', ParseIntPipe) ticketId: number) {
    const [total, outbound, inbound] = await Promise.all([
      Message.count({ where: { ticket_id: ticketId } }),
      Message.count({ where: { ticket_id: ticketId, direction: 'outgoing' } }),
      Message.count({ where: { ticket_id: ticketId, direction: 'incoming' } }),
    ]);
    return { total, outbound, inbound };
  }

  @Get()
  async getForTicket(@Param('ticketId', ParseIntPipe) ticketId: number) {
    try {
      return await this.service.findByTicketId(ticketId);
    } catch (error: any) {
      throw new InternalServerErrorException(error?.message || 'Failed to fetch messages');
    }
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendForTicket(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body() dto: BaseMessageDto,
  ) {
    // Keep input shape consistent with provided payload `{ message, ticket_id }`
    const message = dto.message || (dto as any).comment; // tolerate accidental comment key

    // Resolve numbers and formatting
    const ctx = await this.service.resolveSendContext(ticketId, dto);
    if (!ctx.to) {
      throw new BadRequestException('Ticket has no destination phone number to send SMS');
    }

    // If send === false, only save to DB without sending
    if ((dto as any).send === false) {
      const fullBody = `${ctx.prefix || ''}${message}${ctx.suffix || ''}`;
      return this.service.logOutgoingForTicket(ticketId, fullBody, {
        from: ctx.from,
        to: ctx.to,
        applicationId: ctx.application?.id,
        customerId: ctx.customer?.id,
        type: dto.type || 'sms',
        message_data: { skipped: true, reason: 'save_only' },
      });
    }

    // Send SMS via SmsService only
    let twilioResp: any;
    try {
      twilioResp = await this.sms.sendSms({ to: ctx.to, from: ctx.from, message, prefix: ctx.prefix, suffix: ctx.suffix });
    } catch (err: any) {
      throw new BadGatewayException(`SMS send failed: ${err?.message || 'Unknown error'}`);
    }
    if (twilioResp && (twilioResp.skipped || twilioResp.success === false)) {
      const reason = twilioResp.reason || 'SMS send skipped';
      throw new BadGatewayException(`SMS not sent: ${reason}`);
    }

    // Log outgoing with Twilio response (save full formatted body)
    return this.service.logOutgoingForTicket(ticketId, twilioResp.body || message, {
      from: ctx.from,
      to: ctx.to,
      applicationId: ctx.application?.id,
      customerId: ctx.customer?.id,
      type: dto.type || 'sms',
      message_data: twilioResp,
    });
  }
}

// Public webhook controller (no guard)
@Controller('sms')
export class SmsWebhookController {
  private readonly logger = new Logger(SmsWebhookController.name);

  constructor(private readonly service: MessageService, private readonly sms: SmsService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  async getBalance() {
    const result = await this.sms.getBalance();
    if (!result) return { available: false };
    return { available: true, ...result };
  }

  // Twilio standard webhook: application/x-www-form-urlencoded with Body, From, To
  @Post('receive')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async twilioInbound(@Body() body: Record<string, unknown>) {
    try {
      // Map Twilio webhook body to DTO with proper type safety
      const receiveMessageDto: ReceiveMessageDto = {
        Body: this.getBodyValue(body, 'Body', 'body'),
        From: this.getBodyValue(body, 'From', 'from') || '',
        To: this.getBodyValue(body, 'To', 'to') || '',
        NumMedia: this.parseNumber(body.NumMedia),
        MessageSid: this.getBodyValue(body, 'MessageSid'),
        AccountSid: this.getBodyValue(body, 'AccountSid'),
        ApiVersion: this.getBodyValue(body, 'ApiVersion'),
        NumSegments: this.parseNumber(body.NumSegments),
        DateCreated: this.getBodyValue(body, 'DateCreated'),
        DateSent: this.getBodyValue(body, 'DateSent'),
        // Include dynamic media fields
        ...this.extractMediaFields(body),
      };
      // Validate required fields
      if (!receiveMessageDto.From || !receiveMessageDto.To) {
        this.logger.warn('Missing required fields From or To in webhook body');
        return { received: false, error: 'Missing required fields: From and To are required' };
      }

      // Use the comprehensive receiveMessage method
      const ticket = await this.service.receiveMessage(receiveMessageDto);

      // Twilio expects a 200; return success response
      return { received: true, ticketId: ticket?.id };
    } catch (error: unknown) {
      // Log error but still return 200 to Twilio (to avoid retries for webhook)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing SMS webhook: ${errorMessage}`, errorStack);
      
      return { 
        received: false, 
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : errorMessage,
      };
    }
  }

  /**
   * Helper: Safely extract body value with fallback
   */
  private getBodyValue(body: Record<string, unknown>, primaryKey: string, fallbackKey?: string): string | undefined {
    const value = body[primaryKey] || (fallbackKey ? body[fallbackKey] : undefined);
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Helper: Safely parse number from body
   */
  private parseNumber(value: unknown): number | undefined {
    if (value === undefined || value === null) return undefined;
    const parsed = typeof value === 'string' ? parseInt(value, 10) : Number(value);
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Helper: Extract media fields from webhook body
   */
  private extractMediaFields(body: Record<string, unknown>): Record<string, string> {
    const mediaFields: Record<string, string> = {};
    for (const [key, value] of Object.entries(body)) {
      if ((key.startsWith('MediaUrl') || key.startsWith('MediaContentType')) && typeof value === 'string') {
        mediaFields[key] = value;
      }
    }
    return mediaFields;
  }
}

// ─── WhatsApp Meta Cloud API webhook ───────────────────────────────────────
// No auth guard — Meta must be able to call these endpoints without a token.
// Secure via WHATSAPP_VERIFY_TOKEN (hub.verify_token check on GET).
@Controller('whatsapp')
export class WhatsAppMetaController {
  private readonly logger = new Logger(WhatsAppMetaController.name);

  constructor(private readonly service: MessageService) {}

  /**
   * GET /whatsapp/receive
   * Meta calls this once when you register the webhook URL in the App Dashboard.
   * Respond with hub.challenge to confirm ownership.
   * Set WHATSAPP_VERIFY_TOKEN in your env to match the token you configured in Meta.
   */
  @Get('receive')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string | object {
    this.logger.log('WhatsApp webhook verification request received');
    this.logger.log(`  mode      : ${mode}`);
    this.logger.log(`  token     : ${token}`);
    this.logger.log(`  challenge : ${challenge}`);

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

    if (!verifyToken) {
      this.logger.error('WHATSAPP_VERIFY_TOKEN is not configured');
      return { error: 'Server misconfiguration' };
    }

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('WhatsApp webhook verified successfully — returning challenge');
      return challenge;
    }

    this.logger.warn(`WhatsApp webhook verification failed. Mode: ${mode}, Token match: ${token === verifyToken}`);
    return { error: 'Verification failed' };
  }

  /**
   * POST /whatsapp/receive
   * Meta sends all incoming messages here as JSON.
   * Creates a new ticket or adds a comment to an existing one.
   */
  @Post('receive')
  async receiveMessage(@Body() body: WhatsAppMetaWebhookDto): Promise<object> {
    this.logger.log('WhatsApp inbound POST received');
    this.logger.log(`  Full payload: ${JSON.stringify(body, null, 2)}`);

    try {
      const ticket = await this.service.receiveWhatsAppMessage(body);
      this.logger.log(`  Result: ticketId=${ticket?.id ?? null}`);
      return { received: true, ticketId: ticket?.id ?? null };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`WhatsApp webhook processing error: ${msg}`);
      // Always return 200 to Meta — a non-200 causes retries
      return { received: false, error: process.env.NODE_ENV === 'production' ? 'Internal error' : msg };
    }
  }
}

// Convenience alias to support POST /api/v1/messages with body { message, ticket_id }
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessageAliasController {
  constructor(private readonly service: MessageService, private readonly sms: SmsService) {}

  @Get()
  async findAll(@Query('ticketId') ticketIdParam?: string) {
    try {
      const ticketId = ticketIdParam ? Number(ticketIdParam) : undefined;
      if (ticketId && Number.isNaN(ticketId)) {
        throw new BadRequestException('Invalid ticketId parameter');
      }
      const messages = ticketId ? await this.service.findByTicketId(ticketId) : await this.service.findAll();
      return messages;
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(error?.message || 'Failed to fetch messages');
    }
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async sendViaBody(@Body() dto: BaseMessageDto) {
    const ticketId = (dto as any).ticket_id || dto.ticket_id;
    if (!ticketId) {
      throw new BadRequestException('ticket_id is required in body when calling /api/v1/messages');
    }
    const message = dto.message || (dto as any).comment;

    // Resolve numbers and formatting
    const ctx = await this.service.resolveSendContext(Number(ticketId), dto);
    if (!ctx.to) {
      throw new BadRequestException('Ticket has no destination phone number to send SMS');
    }

    // If send === false, only save to DB without sending
    if ((dto as any).send === false) {
      const fullBody = `${ctx.prefix || ''}${message}${ctx.suffix || ''}`;
      return this.service.logOutgoingForTicket(Number(ticketId), fullBody, {
        from: ctx.from,
        to: ctx.to,
        applicationId: ctx.application?.id,
        customerId: ctx.customer?.id,
        type: dto.type || 'sms',
        message_data: { skipped: true, reason: 'save_only' },
      });
    }

    // Send SMS via SmsService only
    let twilioResp: any;
    try {
      twilioResp = await this.sms.sendSms({ to: ctx.to, from: ctx.from, message, prefix: ctx.prefix, suffix: ctx.suffix });
    } catch (err: any) {
      throw new BadGatewayException(`SMS send failed: ${err?.message || 'Unknown error'}`);
    }
    if (twilioResp && (twilioResp.skipped || twilioResp.success === false)) {
      const reason = twilioResp.reason || 'SMS send skipped';
      throw new BadGatewayException(`SMS not sent: ${reason}`);
    }

    // Log outgoing with Twilio response (save full formatted body)
    return this.service.logOutgoingForTicket(Number(ticketId), twilioResp.body || message, {
      from: ctx.from,
      to: ctx.to,
      applicationId: ctx.application?.id,
      customerId: ctx.customer?.id,
      type: dto.type || 'sms',
      message_data: twilioResp,
    });
  }
}
