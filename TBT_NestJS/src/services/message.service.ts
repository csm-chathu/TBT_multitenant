import { 
  BadGatewayException, 
  BadRequestException, 
  Injectable, 
  Logger, 
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MessageRepository } from '../repositories/message.repository';
import { TicketRepository } from '../repositories/ticket.repository';
import { SmsService } from './sms.service';
import { WhatsAppMetaService } from './whatsapp-meta.service';
import { BaseMessageDto } from '../dto/message/message.dto';
import { ReceiveMessageDto } from '../dto/message/receive-message.dto';
import { WhatsAppMetaWebhookDto } from '../dto/message/receive-whatsapp-meta.dto';
import { Application, Customer, TeamApplication, Team, Agent, TicketComment, Ticket } from '../models';
import { CustomerRepository } from '../repositories/customer.repository';
import { ApplicationRepository } from '../repositories/application.repository';
import { TeamRepository } from '../repositories/team.repository';
import { TicketCommentRepository } from '../repositories/ticket-comment.repository';
import { TicketResourceRepository } from '../repositories/ticket-resource.repository';
import { S3Service } from './s3.service';
import { BaseTicketDto } from '../dto/ticket/ticket.dto';
import { TicketsResourceAttributes } from '../intertfaces/tickets-resource.interface';
import { NotificationService } from './notification.service';
import { RealtimeService } from './realtime.service';
import * as mime from 'mime-types';
import { Sequelize, Transaction, Op } from 'sequelize';
import { extractTeamLeader } from '../util/helper/team.helper';
import { log } from 'node:console';
import { PusherService } from './pusher.service';
import { TicketQueueService } from './ticket-queue.service';
import { perTicketChannel, userChannel,publicTicketsChannel } from '../config/channel.constants';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    private readonly repo: MessageRepository,
    private readonly ticketRepo: TicketRepository,
    private readonly sms: SmsService,
    private readonly whatsApp: WhatsAppMetaService,
    private readonly customerRepository: CustomerRepository,
    private readonly applicationRepository: ApplicationRepository,
    private readonly teamRepository: TeamRepository,
    private readonly ticketCommentRepository: TicketCommentRepository,
    private readonly ticketResourceRepository: TicketResourceRepository,
    private readonly s3Service: S3Service,
    private readonly notificationService: NotificationService,
    private readonly realtimeService: RealtimeService,
    private readonly pusher: PusherService,
    private readonly ticketQueueService: TicketQueueService,
  ) {}

  private resolveFromTo(ticket: any): { from?: string; to?: string; application?: any; customer?: any } {
    const application = ticket?.Application;
    const customer = ticket?.Customer || ticket?.reporter;

    const to = (customer?.mobile_number || customer?.phone_number || '').trim() || undefined;
    const fromEnv = (process.env.SMS_FROM_NUMBER || process.env.TWILIO_FROM_NUMBER || '').trim();
    const from = (application?.service_phone_number || fromEnv || '').trim() || undefined;

    return { from, to, application, customer } as any;
  }

  // Expose a helper to resolve all sending context without actually sending
  async resolveSendContext(ticketId: number, dto?: BaseMessageDto) {
    const ticket: any = await this.ticketRepo.findOneEnriched(ticketId);
    if (!ticket) throw new BadRequestException('Ticket not found');
    const { from, to, application, customer } = this.resolveFromTo(ticket);
    const idChar = (process.env.TICKET_ID_IDENTIFICATION_CHAR || '@').replace(/["']/g, '');
    const isInternal = (dto?.type || '').toLowerCase() === 'internal';
    const prefix = isInternal ? '' : (process.env.SMS_PREFIX || '').trim();
    const suffix = isInternal ? '' : (process.env.SMS_SUFFIX || `  Use ${idChar}${ticketId} always when replying to this ticket.`).trim();
    return { from, to, application, customer, prefix, suffix };
  }


  // NOTE: This method no longer sends SMS. It only logs the outgoing message.
  async sendAndLogForTicket(ticketId: number, dto: BaseMessageDto) {
    const ticket: any = await this.ticketRepo.findOneEnriched(ticketId);
    if (!ticket) throw new BadRequestException('Ticket not found');

    const { from, to, application, customer } = this.resolveFromTo(ticket);

    // Format phone numbers with country code for storage
    const fromNumber = from || 'unknown';
    const toNumber = to || 'unknown';

    const payload = {
      from: fromNumber !== 'unknown' ? this.formatPhoneNumberForStorage(fromNumber) : 'unknown',
      to: toNumber !== 'unknown' ? this.formatPhoneNumberForStorage(toNumber) : 'unknown',
      message: dto.message,
      message_data: undefined,
      type: dto.type || 'sms',
      direction: 'outgoing',
      customer_id: customer?.id,
      application_id: application?.id || ticket?.application_id,
      ticket_id: ticketId,
    } as any;

    return await this.repo.create(payload);
  }

  async logOutgoingForTicket(ticketId: number, message: string, meta?: { from?: string; to?: string; applicationId?: number; customerId?: number; type?: string; message_data?: any }) {
    const ticket: any = await this.ticketRepo.findOneEnriched(ticketId);
    const resolved = this.resolveFromTo(ticket);
    const safeStringify = (obj: any) => {
      try {
        return JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
      } catch {
        return undefined;
      }
    };
    
    // Format phone numbers with country code for storage
    const fromNumber = meta?.from || resolved.from || 'unknown';
    const toNumber = meta?.to || resolved.to || 'unknown';
    
    this.logger.log(`Logging outgoing message for ticket ${ticketId} to ${toNumber}: ${message}`);
    
    const payload = {
      from: fromNumber !== 'unknown' ? this.formatPhoneNumberForStorage(fromNumber) : 'unknown',
      to: toNumber !== 'unknown' ? this.formatPhoneNumberForStorage(toNumber) : 'unknown',
      message,
      message_data: meta?.message_data ? safeStringify(meta.message_data) : undefined,
      type: meta?.type || 'sms',
      direction: 'outgoing',
      customer_id: meta?.customerId || resolved.customer?.id,
      application_id: meta?.applicationId || resolved.application?.id || ticket?.application_id,
      ticket_id: ticketId,
    } as any;
    return await this.repo.create(payload);
  }

  async logIncoming(opts: { from: string; to: string; message: string; ticketId?: number; applicationId?: number; customerId?: number; message_data?: any }) {
    const safeStringify = (obj: any) => {
      try {
        return JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? v.toString() : v));
      } catch {
        return undefined;
      }
    };
    
    const payload = {
      from: opts.from,
      to: opts.to,
      message: opts.message,
      message_data: opts.message_data ? safeStringify(opts.message_data) : undefined,
      type: 'sms',
      direction: 'incoming',
      customer_id: opts.customerId,
      application_id: opts.applicationId,
      ticket_id: opts.ticketId,
    } as any;

    return await this.repo.create(payload);
  }

  async findAll(ticketId?: number) {
    return await this.repo.findAll(ticketId);
  }

  async findByTicketId(ticketId: number) {
    return await this.repo.findByTicketId(ticketId);
  }

  /**
   * Comprehensive message receive handler - migrates logic from Sails.js
   * Handles incoming SMS/MMS, creates tickets, adds comments, processes media
   */
  async receiveMessage(inputs: ReceiveMessageDto) {
    const sequelize = (Ticket as any).sequelize as Sequelize;
    
    try {
      return await sequelize.transaction(async (transaction) => {
        // Preserve original phone numbers with country code for storage
        const originalFrom = this.formatPhoneNumberForStorage(inputs.From);
        const originalTo = this.formatPhoneNumberForStorage(inputs.To);
        
        // Normalize phone numbers for matching/comparison (removes formatting but keeps digits)
        const normalizedFrom = this.normalizePhoneNumber(inputs.From);
        const normalizedTo = this.normalizePhoneNumber(inputs.To);
        
        if (!normalizedFrom || !normalizedTo) {
          throw new BadRequestException('Invalid phone numbers provided');
        }
        
        // Set default body if empty
        const messageBody = inputs.Body || '<NO TEXT MESSAGE CONTENT>';
        
        // Find application by service number (use normalized for matching)
        const application = await this.findApplicationByServiceNumber(normalizedTo);

        if (!application) {
          await this.sendInvalidServiceNumberSms(originalTo, originalFrom);
          this.logger.warn(`Application not found for service number: ${originalTo} (normalized: ${normalizedTo})`);
          throw new BadRequestException('Unknown Application. Please check service number again!');
        }

        // Find or create customer (use original format with country code for storage)
        const customer = await this.findOrCreateCustomer(originalFrom, normalizedFrom, transaction);
        if (!customer?.hash) {
          throw new InternalServerErrorException('Customer creation error occurred!');
        }

        // Log incoming message (use original format with country code for storage)
        await this.logIncoming({
          from: originalFrom,
          to: originalTo,
          message: messageBody,
          applicationId: application.id,
          customerId: customer.id as number,
          message_data: this.extractTwilioMetadata(inputs),
        });

        // Find team by application_id
        const team = await this.findTeamByApplicationId(application.id as number);
        if (!team) {
          throw new NotFoundException(`Team not found for application ${application.id}`);
        }

        // Process ticket (create new or add comment to existing)
        const ticketResult = await this.processTicketMessage(
          messageBody,
          customer,
          application,
          team,
          inputs,
          transaction,
        );

        // Send reply SMS (use original phone numbers with country code)
        await this.sendReplySms(
          originalFrom,
          originalTo,
          ticketResult.ticket,
          customer,
          ticketResult.replyMsg,
          ticketResult.addMsgTailPart,
          application.id as number,
        );

        return ticketResult.ticket;
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error processing incoming message: ${errorMessage}`, errorStack);
      
      // Re-throw NestJS exceptions, wrap others
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to process message: ${errorMessage}`);
    }
  }

  /**
   * Handle incoming WhatsApp messages from Meta Cloud API webhook.
   * Mirrors receiveMessage() but uses the Meta payload shape and replies via Graph API.
   */
  async receiveWhatsAppMessage(body: WhatsAppMetaWebhookDto | any): Promise<Ticket | null> {
    // Normalize both payload shapes:
    // Shape A (full Meta format): { object, entry: [{ changes: [{ field, value }] }] }
    // Shape B (direct change):    { field, value: { messaging_product, metadata, contacts, messages } }
    let value: any;
    if (body?.entry?.[0]?.changes?.[0]?.value) {
      value = body.entry[0].changes[0].value;
    } else if (body?.value?.messages) {
      value = body.value;
    } else if (body?.messages) {
      value = body;
    } else {
      this.logger.debug('WhatsApp webhook received with no messages (likely a status update).');
      return null;
    }

    if (!value?.messages?.length) {
      this.logger.debug('WhatsApp webhook received with no messages (likely a status update).');
      return null;
    }

    const message = value.messages[0];
    const metadata = value.metadata;
    const contactName = value.contacts?.[0]?.profile?.name;

    // Extract From/To — using display_phone_number as the "service number"
    const fromRaw = message.from;                        // sender's WhatsApp number
    const toRaw = metadata.display_phone_number;         // business number
    const phoneNumberId = metadata.phone_number_id;      // needed to reply

    // Extract text body; for media messages use caption or a fallback
    const messageBody =
      message.text?.body ||
      message.image?.caption ||
      message.document?.caption ||
      message.video?.caption ||
      `[${message.type} message]`;

    const originalFrom = this.formatPhoneNumberForStorage(fromRaw);
    const originalTo = this.formatPhoneNumberForStorage(toRaw);
    const normalizedFrom = this.normalizePhoneNumber(fromRaw);

    if (!normalizedFrom) {
      throw new BadRequestException('Invalid phone number in WhatsApp webhook');
    }

    // Use application id 1; fall back to first available application
    let application = await Application.findByPk(1);
    if (!application) {
      application = await Application.findOne({ order: [['id', 'ASC']] });
    }
    if (!application) {
      throw new BadRequestException('No application found in the system');
    }
    this.logger.log(`WhatsApp using application: id=${application.id} name=${application.name}`);

    try {
      // Find or create customer (no transaction — avoids table lock from findAll)
      const customer = await this.findOrCreateCustomer(originalFrom, normalizedFrom);
      if (contactName && customer.first_name === originalFrom) {
        await customer.update({ first_name: contactName });
      }

      // Log incoming message
      await this.logIncoming({
        from: originalFrom,
        to: originalTo,
        message: messageBody,
        applicationId: application.id as number,
        customerId: customer.id as number,
        message_data: { whatsapp_message_id: message.id, type: message.type },
      });

      // Find team by application
      const team = await this.findTeamByApplicationId(application.id as number);
      if (!team) {
        throw new NotFoundException(`Team not found for application ${application.id}`);
      }

      const syntheticInputs: ReceiveMessageDto = {
        Body: messageBody,
        From: originalFrom,
        To: originalTo,
        NumMedia: 0,
      };

      // Create ticket or add comment (pass null transaction — each write is atomic)
      const ticketResult = await this.processTicketMessage(
        messageBody,
        customer,
        application,
        team,
        syntheticInputs,
        null as any,
      );

      // Handle media (external HTTP — must be outside any lock)
      if (message.type !== 'text' && message.type !== 'unknown') {
        const mediaObj = message.image || message.document || message.audio || message.video;
        if (mediaObj?.id) {
          await this.processWhatsAppMedia(
            ticketResult.ticket,
            mediaObj.id,
            mediaObj.mime_type,
          ).catch((err) => this.logger.warn(`WhatsApp media processing failed: ${err}`));
        }
      }

      // Send WhatsApp reply (external HTTP)
      await this.sendWhatsAppReply(
        fromRaw,
        phoneNumberId,
        ticketResult.ticket,
        customer,
        ticketResult.replyMsg,
        ticketResult.addMsgTailPart,
        application.id as number,
      );

      return ticketResult.ticket;

    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing WhatsApp webhook: ${msg}`);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to process WhatsApp message: ${msg}`);
    }
  }

  /**
   * Download a WhatsApp media file from Meta and attach it to a ticket as a resource.
   */
  private async processWhatsAppMedia(
    ticket: Ticket,
    mediaId: string,
    mimeType: string,
  ): Promise<void> {
    const mediaInfo = await this.whatsApp.getMediaUrl(mediaId);
    if (!mediaInfo) {
      this.logger.warn(`Could not retrieve WhatsApp media URL for media_id ${mediaId}`);
      return;
    }

    const buffer = await this.whatsApp.downloadMedia(mediaInfo.url);
    if (!buffer) {
      this.logger.warn(`Could not download WhatsApp media for media_id ${mediaId}`);
      return;
    }

    const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'dev';
    const extension = mime.extension(mimeType) || 'bin';
    const fileName = `${this.generateRandomString()}.${extension}`;
    const s3Key = `${environment}/${ticket.hash}/${fileName}`;

    await this.s3Service.uploadBuffer({ buffer, contentType: mimeType, key: s3Key });

    await this.ticketResourceRepository.create({
      ticket_id: ticket.id,
      file_mime_type: mimeType,
      file_path: s3Key,
      thumb_path: s3Key,
      hash: s3Key,
    } as TicketsResourceAttributes);

    this.logger.log(`WhatsApp media attached to ticket ${ticket.id}: ${s3Key}`);
  }

  /**
   * Send a WhatsApp reply and log it to the messages table.
   */
  private async sendWhatsAppReply(
    to: string,
    phoneNumberId: string,
    ticket: Ticket,
    customer: Customer,
    replyMsg: string,
    addMsgTailPart: boolean,
    applicationId?: number,
  ): Promise<void> {
    const ticketChar = (process.env.TICKET_ID_IDENTIFICATION_CHAR || '@').replace(/["']/g, '');
    const msgTail = `Use ${ticketChar}${ticket.id} always when replying to this ticket.`;
    const fullReplyMsg = addMsgTailPart ? `${replyMsg} ${msgTail}` : replyMsg;

    try {
      const result = await this.whatsApp.sendTextMessage({ to, phoneNumberId, message: fullReplyMsg });

      if (result?.skipped) {
        this.logger.warn(`WhatsApp reply skipped for ticket ${ticket.id}: ${result.reason}`);
        return;
      }

      await this.logOutgoingForTicket(ticket.id as number, fullReplyMsg, {
        from: phoneNumberId,
        to,
        applicationId: applicationId || ticket.application_id,
        customerId: customer.id as number,
        type: 'whatsapp',
        message_data: result,
      });
    } catch (err) {
      this.logger.warn(`WhatsApp reply failed for ticket ${ticket.id}: ${err}`);
      // Don't throw — ticket is already created; reply failure should not roll back
    }
  }

  /**
   * Find or create customer by mobile number
   * @param originalNumber - Phone number with country code (e.g., +94703871464) for storage
   * @param normalizedNumber - Normalized phone number (e.g., 94703871464) for matching
   */
  private async findOrCreateCustomer(
    originalNumber: string,
    normalizedNumber: string,
    transaction?: Transaction,
  ): Promise<Customer> {
    // Try to find customer by normalized number (to match existing records)
    let customer = await this.customerRepository.findByMobileNumber(normalizedNumber);
    
    // Also try to find by original format (in case it's stored with +)
    if (!customer) {
      customer = await this.customerRepository.findByMobileNumber(originalNumber);
    }
    
    // If still not found, search all customers and compare normalized values
    if (!customer) {
      const { data: allCustomers } = await this.customerRepository.findAll();
      for (const cust of allCustomers) {
        const custNormalized = this.normalizePhoneNumber(cust.mobile_number || '');
        if (custNormalized === normalizedNumber) {
          customer = cust;
          break;
        }
      }
    }
    
    if (!customer) {
      // Create new customer with original format (including country code)
      const customerHash = this.generateCustomerHash();
      const newCustomer = await this.customerRepository.create({
        first_name: originalNumber,
        email: `customer_${originalNumber}@tbt.com`,
        status: 'active',
        hash: customerHash,
        mobile_number: originalNumber, // Store with country code (e.g., +94703871464)
        phone_number: originalNumber,  // Store with country code (e.g., +94703871464)
      });
      
      // Reload customer to ensure we have all fields including hash and user_id
      customer = await this.customerRepository.findOne(newCustomer.id as number);
      if (!customer) {
        throw new InternalServerErrorException('Failed to retrieve created customer');
      }
      
      this.logger.log(`Created new customer with phone number: ${originalNumber}`);
    }

    return customer;
  }

  /**
   * Process ticket message - creates new ticket or adds comment to existing
   */
  private async processTicketMessage(
    messageBody: string,
    customer: Customer,
    application: Application,
    team: Team & { agents?: Agent[] },
    inputs: ReceiveMessageDto,
    transaction: Transaction,
  ): Promise<{ ticket: Ticket; replyMsg: string; addMsgTailPart: boolean }> {
    const ticketChar = (process.env.TICKET_ID_IDENTIFICATION_CHAR || '@').replace(/["']/g, '');
    const regex = new RegExp('\\' + ticketChar + '(\\d+)');
    const hashMatch = messageBody.match(regex);

    // 1. Message contains a Ticket ID (@ticket_id)
    let existingTicket: Ticket | null = null;
    if (hashMatch && hashMatch.length > 0) {
      const ticketId = parseInt(hashMatch[0].replace(ticketChar, ''), 10);
      if (ticketId > 0) {
        existingTicket = await this.findTicketByIdAndCustomer(ticketId, customer.id as number, transaction);
      }
    }

    // If the customer sends a message with a valid @ticket_id, do not create a new ticket.
    // Add the message as a comment to the specified ticket.
    if (existingTicket?.id) {
      return await this.handleExistingTicket(
        existingTicket,
        messageBody,
        customer,
        inputs,
        ticketChar,
        hashMatch,
        transaction,
      );
    }

    // 2. Message does not contain a Ticket ID (or valid @ticket_id not found)
    // Check the customer's most recent ticket:
    const mostRecentTicket = await this.findMostRecentTicketByCustomer(customer.id as number, transaction);

    if (mostRecentTicket) {
      const isClosed = (mostRecentTicket.status || '').toLowerCase() === 'closed';
      if (!isClosed) {
        const createdAtDate = (mostRecentTicket as any).createdAt || (mostRecentTicket as any).created_at;
        const createdAt = createdAtDate ? new Date(createdAtDate).getTime() : Date.now();
        const now = Date.now();
        const diffInHours = (now - createdAt) / (1000 * 60 * 60);

        if (diffInHours < 24) {
          // Previous ticket is open/in progress and less than 24 hours have passed since creation
          // → Do not create a new ticket; add message as a comment to the previous ticket.
          return await this.handleExistingTicket(
            mostRecentTicket,
            messageBody,
            customer,
            inputs,
            ticketChar,
            null,
            transaction,
          );
        }
      }
    }

    // Otherwise:
    // - No previous ticket
    // - Previous ticket is closed
    // - Previous ticket is open/in progress and 24 hours or more have passed since its creation
    // → Create a new ticket.
    return await this.createNewTicket(
      messageBody,
      customer,
      application,
      team,
      inputs,
      ticketChar,
    );
  }

  /**
   * Handle existing ticket - add comment or reject if closed
   */
  private async handleExistingTicket(
    ticket: Ticket,
    messageBody: string,
    customer: Customer,
    inputs: ReceiveMessageDto,
    ticketChar: string,
    hashMatch: RegExpMatchArray | null,
    transaction: Transaction,
  ): Promise<{ ticket: Ticket; replyMsg: string; addMsgTailPart: boolean }> {
    const agent = await Agent.findByPk(ticket.agent_id, { transaction });
    
    if ((ticket.status || '').toLowerCase() === 'closed') {
      const closedTicketId = ticket.id ?? (hashMatch ? parseInt(hashMatch[0].replace(ticketChar, ''), 10) : 0);
      return {
        ticket,
        replyMsg: `Ticket #${closedTicketId} has been resolved & closed. If you need help, text our support line at +1 (626) 263-4999 to open a new ticket. Thank you -Tech Support.`,
        addMsgTailPart: false,
      };
    }
    // Remove ticket id tokens like @29 from message body before saving
    let cleanedMessageBody = (messageBody || '')
      .replace(new RegExp('\\' + ticketChar + '\\d+', 'g'), '')
      .replace(/\s+/g, ' ')
      .trim();

    const numMedia = inputs.NumMedia ?? (inputs.MediaUrl0 ? 1 : 0);
    if (!cleanedMessageBody && numMedia > 0) {
      cleanedMessageBody = '<Attachment>';
    }

    // Add comment to existing ticket
    const comment = await this.ticketCommentRepository.create({
      ticket_id: ticket.id,
      comment: cleanedMessageBody,
      type: 'customer_to_agent',
      from: customer.user_id as number,
      to: agent?.user_id as number,
    });

    // Handle multimedia files (MMS)
    if (numMedia > 0) {
      const resourcesJson = await this.processCommentMedia(comment.id, ticket.hash, inputs);
      if (resourcesJson) {
        comment.resources = resourcesJson;
      }
    }

    // Enrich comment with signed URLs for media files before emitting and notifying
    const commentData = await this.enrichComment(comment);

    await this.notificationService.createNotification({
      message: ticket.id ? `Ticket #${ticket.id} new comment` : 'Ticket comment',
      type: 'ticket.comment.public',
      ticket_id: ticket.id as number,
      user_id: agent?.user_id,
      target_user_id: (commentData as any)?.to || undefined,
      data: {
        event: 'ticket.comment.public',
        ticketId: ticket.id,
        messageBody: cleanedMessageBody,
        comment: commentData,
        ticket: ticket,
      },
    });

    const uChan = userChannel(agent?.user_id as number);
    const tChan = perTicketChannel(ticket.id);
    // Ensure frontend receives same payload shape as comment service: include enriched `comment` object
    try {
      await this.pusher.trigger(uChan, 'ticket.comment.internal', { ticketId: ticket.id, comment: commentData, ticket });
    } catch (err) {
      this.logger.warn('Failed to emit internal comment to user channel', err as any);
    }
    try {
      // Send public comment to per-ticket channel so ticket viewers receive it
      await this.pusher.trigger(tChan, 'ticket.comment.public', { ticketId: ticket.id, comment: commentData, ticket });
      await this.pusher.trigger(`public-ticket-${ticket.id}`, 'ticket.comment.public', { ticketId: ticket.id, comment: commentData, ticket });
      if (ticket.hash) {
        await this.pusher.trigger(`public-ticket-${ticket.hash}`, 'ticket.comment.public', { ticketId: ticket.id, comment: commentData, ticket });
      }
    } catch (err) {
      this.logger.warn('Failed to emit public comment to ticket channel', err as any);
    }
    try {
      // Also emit to the public tickets channel so subscribers (RealtimeProvider) receive it
      await this.pusher.trigger(publicTicketsChannel(), 'ticket.comment.public', { ticketId: ticket.id, comment: commentData, ticket });
    } catch (err) {
      this.logger.warn('Failed to emit public comment to public-tickets channel', err as any);
    }

    // Add to followup queue so FollowUpHistory table reflects inbound Twilio messages
    this.ticketQueueService.enqueueUpdate({
      ticketId: ticket.id,
      eventType: 'COMMENT_ADDED',
      priority: 'medium',
      payload: {
        source: 'twilio_inbound',
        category: 'Public Comment',
        comment: cleanedMessageBody,
        ticketId: ticket.id,
      },
    }).catch((err) => this.logger.warn(`Failed to enqueue comment update for ticket ${ticket.id}: ${err?.message || err}`));

    return {
      ticket,
      replyMsg: 'Received your reply.',
      addMsgTailPart: true,
    };
  }

  /**
   * Create new ticket
   */
  private async createNewTicket(
    messageBody: string,
    customer: Customer,
    application: Application,
    team: Team & { agents?: Agent[] },
    inputs: ReceiveMessageDto,
    ticketChar: string,
  ): Promise<{ ticket: Ticket; replyMsg: string; addMsgTailPart: boolean }> {
    // Find team leader first (role_id: 1 - TEAM_LEAD)
    const teamLeader = extractTeamLeader(team);
    let assignedAgentId: number | null = null;

    if (teamLeader.leader_id) {
      assignedAgentId = teamLeader.leader_id;
      this.logger.log(`Assigning ticket to team leader (agent_id: ${assignedAgentId}) for application ${application.id}`);
    } else {
      // Fallback to first agent if no team leader is found
      const firstAgent = team.agents && team.agents.length > 0 ? team.agents[0] : null;
      if (!firstAgent) {
        throw new NotFoundException('No agents found in team');
      }
      assignedAgentId = firstAgent.id;
      this.logger.warn(`No team leader found for team ${team.id}, falling back to first agent (agent_id: ${assignedAgentId})`);
    }

    const ticketHash = this.generateTicketHash();
    const ticket = await this.ticketRepo.create({
      application_id: application.id as number,
      customer_id: customer.id as number,
      body: messageBody,
      agent_id: assignedAgentId,
      title: messageBody.substring(0, 100) || 'New Ticket',
      status: 'Assigned',
      priority: 'Medium',
      hash: ticketHash,
      ticketType: 'Help Desk',
    } as BaseTicketDto);

    // Handle multimedia files for new ticket
    if (inputs.NumMedia && inputs.NumMedia > 0) {
      await this.processTicketMedia(ticket.id as number, ticket.hash, inputs);
    }

    // Record notification for ticket creation
    try {
            await this.pusher.trigger(publicTicketsChannel(), 'ticket.created', { ticketId: ticket.id, event: 'ticket.created' });
      
      // await this.notificationService.createNotification({
      //   message: `Ticket #${ticket.id} created`,
      //   type: 'ticket.created',
      //   level: 'info',
      //   status: 'active',
      //   ticket_id: ticket.id as number,
      //   user_id: customer.user_id, // may be undefined, repo handles nullable
      //   data: {
      //     channel: 'tickets',
      //     event: 'ticket.created',
      //     payload: {
      //       ticketId: ticket.id,
      //       hash: ticket.hash,
      //       source: 'sms_webhook',
      //     },
      //   },
      // });
    } catch (err) {
      this.logger.warn(`Failed to record notification for ticket ${ticket.id}: ${err instanceof Error ? err.message : err}`);
    }

    // Add to followup queue so FollowUpHistory table reflects inbound Twilio-created tickets
    this.ticketQueueService.enqueueUpdate({
      ticketId: ticket.id,
      eventType: 'TICKET_CREATED',
      priority: 'high',
      payload: {
        source: 'twilio_inbound',
        category: 'Ticket Created',
        ticketId: ticket.id,
        hash: ticket.hash,
      },
    }).catch((err) => this.logger.warn(`Failed to enqueue ticket creation for ticket ${ticket.id}: ${err?.message || err}`));

    // Trigger Pusher event for ticket creation with message
    // try {
    //   const serializedTicket = typeof ticket.toJSON === 'function' ? ticket.toJSON() : ticket;
    //   await this.realtimeService.emitTicketEvent('ticket.created', {
    //     ticketId: ticket.id,
    //     ticket: serializedTicket,
    //     message: messageBody,
    //     source: 'sms_webhook',
    //   }, customer.user_id);
    // } catch (err) {
    //   this.logger.warn(`Failed to trigger Pusher event for ticket ${ticket.id}: ${err instanceof Error ? err.message : err}`);
    // }

    return {
      ticket,
      replyMsg: `MediTech Support TBT: We received your request. Your ticket is ${ticketChar}${ticket.id}. Please reply back with ${ticketChar}${ticket.id}, your name & facility.Our team will assist you ASAP`,
      addMsgTailPart: false,
    };
  }

  /**
   * Process media files for a comment
   */
  private async processCommentMedia(
    commentId: number,
    ticketHash: string,
    inputs: ReceiveMessageDto,
  ): Promise<string | null> {
    const commentResources: { media_files: Array<{ file_mime_type: string; file_path: string; thumb_path: string }> } = {
      media_files: [],
    };

    const numMedia = inputs.NumMedia ?? (inputs.MediaUrl0 ? 1 : 0);
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = (inputs[`MediaUrl${i}`] || (inputs as any)[`mediaUrl${i}`]) as string | undefined;
      const mimeType = (inputs[`MediaContentType${i}`] || (inputs as any)[`mediaContentType${i}`] || (inputs as any)[`MediaUrl${i}ContentType`]) as string | undefined;

      if (mediaUrl) {
        const storePath = `/${ticketHash}/comment/${commentId}/`;
        const effectiveMimeType = mimeType || 'image/jpeg';
        const extension = mime.extension(effectiveMimeType) || 'jpg';
        const tmpFileName = this.generateRandomString() + '.' + extension;

        try {
          const s3Key = await this.saveMultimediaFile(mediaUrl, tmpFileName, storePath, effectiveMimeType);

          commentResources.media_files.push({
            file_mime_type: effectiveMimeType,
            file_path: s3Key,
            thumb_path: s3Key,
          });
        } catch (err) {
          this.logger.error(`Failed to process comment media ${i} (${mediaUrl}): ${err}`);
        }
      }
    }

    // Update comment with resources
    if (commentResources.media_files.length > 0) {
      const resourcesJson = JSON.stringify(commentResources);
      await TicketComment.update(
        { resources: resourcesJson },
        { where: { id: commentId } },
      );
      return resourcesJson;
    }
    return null;
  }

  /**
   * Helper: Enrich comment with signed URLs for attached media files
   */
  private async enrichComment(comment: TicketComment | null): Promise<any> {
    if (!comment) return comment;
    const plain = typeof comment.toJSON === 'function' ? comment.toJSON() : { ...comment };

    if (plain.resources) {
      try {
        const parsed = typeof plain.resources === 'string' ? JSON.parse(plain.resources) : plain.resources;
        if (parsed && Array.isArray(parsed.media_files)) {
          const enrichedMediaFiles = await Promise.all(
            parsed.media_files.map(async (media: any) => {
              const enriched = { ...media };
              if (media.file_path) {
                try {
                  enriched.file_url = await this.s3Service.getSignedUrlForKey(media.file_path);
                } catch (err) {
                  this.logger.warn(`Failed to generate signed URL for comment media: ${media.file_path}`, err);
                }
              }
              if (media.thumb_path) {
                try {
                  enriched.thumb_url = await this.s3Service.getSignedUrlForKey(media.thumb_path);
                } catch (err) {
                  this.logger.warn(`Failed to generate signed URL for comment thumb: ${media.thumb_path}`, err);
                }
              }
              return enriched;
            })
          );
          plain.resources = {
            ...parsed,
            media_files: enrichedMediaFiles,
          };
        }
      } catch (err) {
        this.logger.warn(`Failed to parse comment resources JSON for comment ${plain.id}`, err);
      }
    }

    return plain;
  }

  /**
   * Process media files for a new ticket
   */
  private async processTicketMedia(
    ticketId: number,
    ticketHash: string,
    inputs: ReceiveMessageDto,
  ): Promise<void> {
    for (let i = 0; i < (inputs.NumMedia || 0); i++) {
      const mediaUrl = inputs[`MediaUrl${i}`] as string | undefined;
      const mimeType = inputs[`MediaContentType${i}`] as string | undefined;

      if (mediaUrl && mimeType) {
        const storePath = `/${ticketHash}/`;
        const extension = mime.extension(mimeType) || 'bin';
        const tmpFileName = this.generateRandomString() + '.' + extension;

        const s3Key = await this.saveMultimediaFile(mediaUrl, tmpFileName, storePath, mimeType);

        await this.ticketResourceRepository.create({
          ticket_id: ticketId,
          file_mime_type: mimeType,
          file_path: s3Key,
          thumb_path: s3Key,
          hash: s3Key,
        } as TicketsResourceAttributes);
      }
    }
  }

  /**
   * Send reply SMS with ticket information and log it to messages table
   */
  private async sendReplySms(
    to: string,
    from: string,
    ticket: Ticket,
    customer: Customer,
    replyMsg: string,
    addMsgTailPart: boolean,
    applicationId?: number,
  ): Promise<void> {
    const ticketChar = (process.env.TICKET_ID_IDENTIFICATION_CHAR || '@').replace(/["']/g, '');
    const msgTail = `Use ${ticketChar}${ticket.id} always when replying to this ticket.`;
    const fullReplyMsg = addMsgTailPart ? `${replyMsg} ${msgTail}` : replyMsg;

    this.logger.log(`Sending reply SMS for ticket ${ticket.id} to ${to}: ${fullReplyMsg}`);

    // Send SMS via SmsService
    const smsResult = await this.sms.sendSms({
      from,
      to,
      message: fullReplyMsg,
    });

    // If SMS failed or was skipped, abort (propagate error to rollback transaction)
    if (!smsResult || smsResult.skipped || smsResult.success === false) {
      const reason = smsResult?.reason || 'SMS send failed or skipped';
      this.logger.warn(`SMS send skipped or failed for ticket ${ticket.id}: ${reason}`);
      throw new BadGatewayException(`SMS not sent: ${reason}`);
    }

    // Log outgoing message to messages table after successful send
    await this.logOutgoingForTicket(
      ticket.id as number,
      fullReplyMsg,
      {
        from,
        to,
        applicationId: applicationId || ticket.application_id,
        customerId: customer.id as number,
        type: 'sms',
        message_data: smsResult,
      },
    );
    this.logger.log(`Reply SMS sent and logged for ticket ${ticket.id} to ${to}`);
  }

  /**
   * Send SMS for invalid service number
   */
  private async sendInvalidServiceNumberSms(from: string, to: string): Promise<void> {
    try {
      await this.sms.sendSms({
        from,
        to,
        message: 'Invalid request. Please check your service number again.',
      });
    } catch (error) {
      this.logger.error(`Failed to send invalid service number SMS: ${error}`);
      // Don't throw - we still want to return error to webhook
    }
  }

  /**
   * Helper: Normalize phone number (removes all formatting for comparison)
   * Used for matching/comparison purposes only
   */
  private normalizePhoneNumber(phone: string): string {
    if (!phone) return phone;
    // Remove common formatting characters (including + for comparison)
    return phone.replace(/[+,' "()\-]/g, '');
  }

  /**
   * Helper: Format phone number for storage (preserves country code with +)
   * Ensures phone numbers are stored with country code like +94703871464
   * This matches the format used when creating tickets manually
   */
  private formatPhoneNumberForStorage(phone: string): string {
    if (!phone) return phone;
    
    const trimmed = String(phone).trim();
    
    // Remove all formatting characters but preserve digits
    const digits = trimmed.replace(/\D/g, '');
    
    if (!digits) return trimmed; // Return original if no digits found
    
    // Always add + prefix for international format (matches manual ticket creation)
    // This ensures consistency: +94703871464 format
    return '+' + digits;
  }

  /**
   * Helper: Find application by service phone number
   * Normalizes both input and database values for comparison
   * Handles phone numbers stored in various formats (e.g., +1-555-1000, +1 (555) 1000, etc.)
   */
  private async findApplicationByServiceNumber(serviceNumber: string): Promise<Application | null> {
    const normalized = this.normalizePhoneNumber(serviceNumber);
    this.logger.debug(`Looking for application with service number: ${serviceNumber} (normalized: ${normalized})`);
    
    // Try exact match first (in case it's already normalized in DB)
    let app = await Application.findOne({
      where: { service_phone_number: serviceNumber },
    });
    if (app) {
      this.logger.debug(`Found application with exact match: ${app.id} - ${app.name}`);
      return app;
    }

    // Try normalized match
    app = await Application.findOne({
      where: { service_phone_number: normalized },
    });
    if (app) {
      this.logger.debug(`Found application with normalized match: ${app.id} - ${app.name}`);
      return app;
    }

    // Fetch all applications and compare normalized values
    // This is more reliable for handling various phone number formats
    const allApplications = await Application.findAll({
      attributes: ['id', 'name', 'service_phone_number', 'status', 'organization_id', 'hash'],
    });

    this.logger.debug(`Checking ${allApplications.length} applications for normalized match`);
    for (const application of allApplications) {
      const dbNormalized = this.normalizePhoneNumber(application.service_phone_number || '');
      if (dbNormalized === normalized) {
        this.logger.debug(`Found application with normalized comparison: ${application.id} - ${application.name} (DB: ${application.service_phone_number} -> ${dbNormalized})`);
        return application;
      }
    }

    this.logger.warn(`No application found for service number: ${serviceNumber} (normalized: ${normalized})`);
    return null;
  }

  /**
   * Helper: Find team by application_id
   * Checks both direct application_id column and TeamApplication join table
   */
  private async findTeamByApplicationId(applicationId: number): Promise<(Team & { agents?: Agent[] }) | null> {
    // First, try to find team directly by application_id column (teams table has application_id)
    let team = await Team.findOne({
      where: { application_id: applicationId },
      include: [
        {
          model: Agent,
          as: 'agents',
          through: { attributes: ['role_id', 'data', 'remarks'] },
        },
      ],
    });

    if (team) {
      return team;
    }

    // Fallback: Find team through TeamApplication relationship (many-to-many)
    const teamApplication = await TeamApplication.findOne({
      where: { application_id: applicationId },
    });

    if (!teamApplication) {
      return null;
    }

    // Get the team with agents
    team = await Team.findByPk(teamApplication.team_id, {
      include: [
        {
          model: Agent,
          as: 'agents',
          through: { attributes: ['role_id', 'data', 'remarks'] },
        },
      ],
    });

    return team;
  }

  /**
   * Helper: Find ticket by ID and customer ID (with fallback by ID for explicit @ticket references)
   */
  private async findTicketByIdAndCustomer(
    ticketId: number,
    customerId: number,
    transaction?: Transaction,
  ): Promise<Ticket | null> {
    let ticket = await Ticket.findOne({
      where: {
        id: ticketId,
        customer_id: customerId,
      },
      include: [
        { model: Agent, attributes: ['id', 'user_id'] },
      ],
      ...(transaction ? { transaction } : {}),
    });

    if (!ticket) {
      ticket = await Ticket.findByPk(ticketId, {
        include: [
          { model: Agent, attributes: ['id', 'user_id'] },
        ],
        ...(transaction ? { transaction } : {}),
      });
    }

    return ticket;
  }

  /**
   * Helper: Find customer's most recent ticket
   */
  private async findMostRecentTicketByCustomer(
    customerId: number,
    transaction?: Transaction,
  ): Promise<Ticket | null> {
    return await Ticket.findOne({
      where: {
        customer_id: customerId,
      },
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      include: [
        { model: Agent, attributes: ['id', 'user_id'] },
      ],
      ...(transaction ? { transaction } : {}),
    });
  }

  /**
   * Helper: Save multimedia file from URL to S3
   */
  private async saveMultimediaFile(
    mediaUrl: string,
    tmpFileName: string,
    storePath: string,
    mimeType: string,
  ): Promise<string> {
    const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'dev';
    const s3Key = `${environment}${storePath}${tmpFileName}`;

    try {
      // Fetch file from URL using native fetch (Node 18+)
      const response = await fetch(mediaUrl);
      
      if (!response.ok) {
        throw new BadGatewayException(
          `Failed to fetch media from Twilio: ${response.status} ${response.statusText}`,
        );
      }

      // Get buffer from response
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to S3 directly
      await this.s3Service.uploadBuffer({
        buffer,
        contentType: mimeType,
        key: s3Key,
      });

      this.logger.log(`Successfully uploaded media file to S3: ${s3Key}`);
      return s3Key;
    } catch (error) {
      this.logger.error(`Failed to save multimedia file from ${mediaUrl}: ${error}`);
      if (error instanceof BadGatewayException) {
        throw error;
      }
      throw new BadGatewayException(`Failed to process media file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper: Generate short URL (simple implementation - can be enhanced with external service)
   */
  private async generateShortUrl(url: string): Promise<string> {
    // For now, return the original URL
    // In production, you might want to use a service like bit.ly, tinyurl, etc.
    // Example: const response = await fetch(`https://api.tinyurl.com/create?api_token=${token}`, { method: 'POST', body: JSON.stringify({ url }) });
    return url;
  }

  /**
   * Helper: Extract Twilio metadata from webhook body
   */
  private extractTwilioMetadata(body: ReceiveMessageDto): Record<string, unknown> | undefined {
    const metadata: Record<string, unknown> = {};
    if (body.MessageSid) metadata.messageSid = body.MessageSid;
    if (body.AccountSid) metadata.accountSid = body.AccountSid;
    if (body.ApiVersion) metadata.apiVersion = body.ApiVersion;
    if (body.NumSegments) metadata.numSegments = body.NumSegments;
    if (body.NumMedia) metadata.numMedia = body.NumMedia;
    if (body.DateCreated) metadata.dateCreated = body.DateCreated;
    if (body.DateSent) metadata.dateSent = body.DateSent;
    
    const mediaUrls: string[] = [];
    let mediaIndex = 0;
    while (body[`MediaUrl${mediaIndex}`]) {
      const mediaUrl = body[`MediaUrl${mediaIndex}`];
      // Type guard: only push if it's a string
      if (typeof mediaUrl === 'string') {
        mediaUrls.push(mediaUrl);
      }
      mediaIndex++;
    }
    if (mediaUrls.length > 0) {
      metadata.mediaUrls = mediaUrls;
    }
    
    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }

  /**
   * Helper: Generate customer hash
   */
  private generateCustomerHash(): string {
    const rand = Math.random().toString(36).slice(2, 10);
    const ts = Date.now().toString(36);
    return `cus_${ts}_${rand}`;
  }

  /**
   * Helper: Generate ticket hash
   */
  private generateTicketHash(): string {
    const rand = Math.random().toString(36).slice(2, 10);
    const ts = Date.now().toString(36);
    return `tkt_${ts}_${rand}`;
  }

  /**
   * Helper: Generate random string for file names
   */
  private generateRandomString(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
