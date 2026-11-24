import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TicketRepository } from '../repositories/ticket.repository';
import { BaseTicketDto, UpdateTicketDto } from '../dto/ticket/ticket.dto';
import { EnrichedTicketResponseDto } from '../dto/ticket/enriched-ticket.dto';
import { CreateTicketWithFilesDto } from '../dto/ticket/create-ticket-with-files.dto';
import { CreatePublicTicketDto } from '../dto/ticket/public-ticket.dto';
import { CreateRenewPortalTicketDto } from '../dto/ticket/renew-portal-ticket.dto';
import { CreateZendeskTicketDto } from '../dto/ticket/zendesk-ticket.dto';
import { S3Service } from './s3.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { TicketResourceService, ResourceWithUrls } from './ticket-resource.service';
import { TicketResourceRepository } from '../repositories/ticket-resource.repository';
import { TicketsResourceAttributes } from 'src/intertfaces/tickets-resource.interface';
import { CustomerRepository } from '../repositories/customer.repository';
import { BaseCustomerDto } from '../dto/customer/customer.dto';
import { Agent, Application, InventoryItemLocation, InventoryItem, TicketActionType, Customer, Team, TeamApplication, Ticket } from '../models';
import { Op } from 'sequelize';
import { extractTeamLeader } from '../util/helper/team.helper';
import { PusherService } from './pusher.service';
import { TicketQueueService } from './ticket-queue.service';
import { NotificationService } from './notification.service';
import { TicketCommentService } from './ticket-comment.service';
import { publicTicketsChannel, perTicketChannel, userChannel } from '../config/channel.constants';
import { MessageRepository } from '../repositories/message.repository';
import { from } from 'form-data';

@Injectable()
export class TicketService {
  private readonly logger = new Logger(TicketService.name);

  constructor(
    private readonly ticketRepository: TicketRepository,
    private readonly s3Service: S3Service,
    private readonly emailService: EmailService,
    private readonly customerRepository: CustomerRepository,
    private readonly ticketResourceRepository: TicketResourceRepository,
    private readonly ticketResourceService: TicketResourceService,
    private readonly ticketCommentService: TicketCommentService,
    private readonly sms: SmsService,
    private readonly pusher: PusherService,
    private readonly ticketQueue: TicketQueueService,
    private readonly notifications: NotificationService,
    private readonly messageRepository: MessageRepository,
  ) {}

  async findAll(
    startDate?: string,
    endDate?: string,
    status?: string,
    priority?: string,
    agentId?: number,
    deviceId?: number,
    locationId?: number,
    page?: number,
    limit?: number,
    actionType?: string,
    sortBy?: string,
    sortOrder?: string,
    userId?: number,
    search?: string,
    isUnread?: boolean,
    customerId?: number,
  ) {
    const { rows, count } = await this.ticketRepository.findAll(startDate, endDate, status, priority, agentId, deviceId, locationId, page, limit, actionType, sortBy, sortOrder, search, userId, isUnread, customerId);
    const locations = await InventoryItemLocation.findAll();
    const locMap = new Map(locations.map(l => [String(l.id), l.name]));

    const actionTypes = await TicketActionType.findAll();
    const actionTypeMap = new Map(actionTypes.map(at => [at.id, { id: at.id, name: at.name }]));

    const data = rows.map(ticket => this.serializeTicket(ticket, locMap, actionTypeMap));

    if (page && limit) {
      return {
        data,
        meta: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        }
      };
    }

    return data;
  }

  async findOneByHash(hash: string) {
    const ticket = await this.ticketRepository.findOneByHash(hash);
    if (!ticket) return null;
    const locations = await InventoryItemLocation.findAll();
    const locMap = new Map(locations.map(l => [String(l.id), l.name]));
    const actionTypes = await TicketActionType.findAll();
    const actionTypeMap = new Map(actionTypes.map(at => [at.id, { id: at.id, name: at.name }]));
    return this.serializeTicket(ticket, locMap, actionTypeMap);
  }

  async getPublicTicketTracking(hashOrId: string) {
    let ticket = await this.ticketRepository.findOneByHash(hashOrId);
    if (!ticket && !isNaN(Number(hashOrId))) {
      ticket = await this.ticketRepository.findOne(Number(hashOrId));
    }
    if (!ticket) {
      throw new NotFoundException(`Ticket '${hashOrId}' not found.`);
    }

    let comments: any[] = [];
    try {
      const allComments = await this.ticketCommentService.listForTicket(ticket.id as number);
      comments = (allComments || []).filter(
        (c: any) => (c.type || '').toLowerCase() !== 'internal'
      );
    } catch (err) {
      this.logger.warn(`Failed to load comments for public ticket tracking ${ticket.id}: ${err}`);
    }

    let resources: any[] = [];
    try {
      const rawResources = await this.ticketResourceRepository.findByTicketId(ticket.id as number);
      resources = await Promise.all(
        (rawResources || []).map(async (r: any) => {
          const plain = typeof r?.toJSON === 'function' ? r.toJSON() : (typeof r?.get === 'function' ? r.get({ plain: true }) : { ...r });
          let signedUrl = plain.url || plain.file_url;
          const targetKey = plain.file_path || plain.s3Key || plain.key;
          if (targetKey) {
            try {
              signedUrl = await this.s3Service.generateSignedUrl(targetKey);
            } catch (s3Err) {
              this.logger.warn(`Failed to generate signed URL for resource ${plain.id}: ${s3Err}`);
              try {
                signedUrl = this.s3Service.buildPublicUrl(targetKey);
              } catch (_) {}
            }
          }
          return {
            ...plain,
            file_url: signedUrl || (targetKey ? this.s3Service.buildPublicUrl(targetKey) : null),
            url: signedUrl || (targetKey ? this.s3Service.buildPublicUrl(targetKey) : null),
          };
        })
      );
    } catch (err) {
      this.logger.warn(`Failed to load resources for public ticket tracking ${ticket.id}: ${err}`);
    }

    return {
      id: ticket.id,
      hash: ticket.hash,
      title: ticket.title,
      body: ticket.body,
      status: ticket.status || 'Open',
      priority: ticket.priority,
      ticketType: ticket.ticketType,
      serialNo: ticket.serialNo,
      createdAt: (ticket as any).createdAt || (ticket as any).created_at,
      updatedAt: (ticket as any).updatedAt || (ticket as any).updated_at,
      resources,
      comments: comments.map((c: any) => ({
        id: c.id,
        comment: c.comment,
        type: c.type,
        createdAt: c.createdAt || c.created_at,
        fromUser: c.FromUser ? { name: c.FromUser.name } : (c.from ? { name: 'Support Agent' } : null),
        resources: c.resources,
      })),
    };
  }

  async getPublicResourceDownloadUrl(ticketRef: string, resourceId: number): Promise<string> {
    let ticket = await this.ticketRepository.findOneByHash(ticketRef);
    if (!ticket && !isNaN(Number(ticketRef))) {
      ticket = await this.ticketRepository.findOne(Number(ticketRef));
    }
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    const resource = await this.ticketResourceRepository.findById(resourceId);
    if (!resource || resource.ticket_id !== ticket.id) {
      throw new NotFoundException('Resource not found for this ticket');
    }
    const fileKey = resource.file_path;
    if (!fileKey) {
      throw new NotFoundException('File path not found');
    }
    return await this.s3Service.generateSignedUrl(fileKey);
  }

  async markTicketRead(ticketId: number): Promise<void> {
    await Ticket.update({ read_at: new Date() }, { where: { id: ticketId, read_at: null } });
  }

  async findOne(id: number) {
    const ticket = await this.ticketRepository.findOne(id);
    if (!ticket) return ticket;
    
    const locations = await InventoryItemLocation.findAll();
    const locMap = new Map(locations.map(l => [String(l.id), l.name]));
    
    const actionTypes = await TicketActionType.findAll();
    const actionTypeMap = new Map(actionTypes.map(at => [at.id, { id: at.id, name: at.name }]));
    
    // Reporter is now an Agent - serialize and return as is
    return this.serializeTicket(ticket, locMap, actionTypeMap);
  }

  async create(createTicketDto: BaseTicketDto, userId?: number) {
    const ticketData = { ...createTicketDto } as BaseTicketDto;
    await this.processActionTypes(ticketData);
    let mobileForSMS: string | undefined = undefined;
    // If mobile_number is provided (and customer_id isn't), link or create customer
    if (!ticketData.customer_id && ticketData.mobile_number) {
      const mobile = this.normalizeMobile(ticketData.mobile_number);
      const customerId = await this.findOrCreateCustomerByMobile(mobile);
      ticketData.customer_id = customerId;
      mobileForSMS = mobile;
    }

    // Ensure we don't persist the transient mobile_number on the ticket
    delete (ticketData as any).mobile_number;

    if (!ticketData.device_id) {
      let deviceName: string | undefined = (createTicketDto as any).deviceName;
      let locationId: number | undefined;

      if (createTicketDto.data) {
        try {
          const dataObj = typeof createTicketDto.data === 'string' ? JSON.parse(createTicketDto.data) : createTicketDto.data;
          if (dataObj) {
            if (dataObj.assetsDevice && !deviceName) {
              deviceName = dataObj.assetsDevice;
            }
            if (dataObj.location) {
              locationId = Number(dataObj.location);
            }
          }
        } catch (e) {}
      }

      if (deviceName) {
        let device = await InventoryItem.findOne({ where: { name: deviceName } });
        if (!device) {
          device = await InventoryItem.create({ 
            name: deviceName, 
            category_id: 1,
            ownership: 'own',
            location_id: locationId
          } as any);
        }
        ticketData.device_id = device.id;
      }
    }
    delete (ticketData as any).deviceName;

    const ticket = await this.ticketRepository.create(ticketData);

    // Resolve assigned agent's user id (from User table) for realtime/notifications
    const assignedUserId = await this.resolveAssignedUserId(ticket);

    // Enqueue realtime ticket update for dashboard queue
    this.ticketQueue
      .enqueueUpdate({
        ticketId: ticket.id,
        eventType: 'TICKET_CREATED',
        payload: { id: ticket.id, hash: ticket.hash, title: ticket.title, priority: ticket.priority, status: ticket.status },
        userId,
        priority: ticket.priority || 'medium',
      })
      .catch((err) => this.logger.warn(`Failed to enqueue TICKET_CREATED for ${ticket.id}: ${err?.message || err}`));

    // Send email notification
    this.emailService.sendTicketCreatedEmail(ticket).catch((err) =>
      this.logger.warn(`Ticket created email failed: ${err?.message}`),
    );

    // Persist a notification for the assigned user (if any) and push via Pusher
    try {
      const enriched = await this.findOneEnriched(ticket.id as number).catch(() => null);
      if (assignedUserId) {
        const notifPayload = {
          message: `Ticket #${ticket.id} assigned to you`,
          type: 'ticket.created',
          ticket_id: ticket.id,
          user_id: assignedUserId,
          data: { event: 'ticket.created', ticket: enriched ?? ticket },
        } as any;

        await this.notifications.createNotification(notifPayload);

        try {
          await this.pusher.trigger(userChannel(assignedUserId), 'ticket.created', { ticketId: ticket.id, ticket: enriched ?? ticket, notification: notifPayload });
        } catch (err) {
          this.logger.warn(`Failed to emit pusher user ticket.created for user ${assignedUserId}: ${err instanceof Error ? err.message : err}`);
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to persist notification for ticket ${ticket.id}: ${err instanceof Error ? err.message : err}`);
    }

    // Attempt to send an SMS confirmation to the ticket's customer (non-blocking)
    try {
      let to = mobileForSMS;
      if (!to && (ticket as any)?.customer_id) {
        const customer = await Customer.findByPk((ticket as any).customer_id);
        if (customer?.mobile_number || customer?.phone_number) {
          to = this.normalizeMobile(customer.mobile_number || customer.phone_number || '');
        }
      }
      if (to) {
        const ticketChar = (process.env.TICKET_ID_IDENTIFICATION_CHAR || '@').replace(/['"]/g, '');
        const rawText = (ticket.body || ticket.title).replace(/<[^>]*>/g, '').trim();
        const msg = `Ticket #${ticket.id} created: "${rawText}". Use ${ticketChar}${ticket.id} when replying.`;
        const smsResult = await this.sms.sendSms({ to, message: msg }).catch((e) => ({ error: e }));
        if (smsResult && (smsResult as any).skipped) {
          this.logger.warn(`SMS skipped for ticket ${ticket.id} to ${to}: ${(smsResult as any).reason}`);
        } else if ((smsResult as any).error) {
          this.logger.warn(`SMS error for ticket ${ticket.id} to ${to}: ${(smsResult as any).error?.message || smsResult}`);
        } else {
          this.logger.log(`Sent ticket creation SMS for ticket ${ticket.id} to ${to}`);
          await this.logOutboundSmsToMessagesTable({
            ticketId: ticket.id,
            to,
            message: msg,
            customerId: (ticket as any)?.customer_id,
            applicationId: (ticket as any)?.application_id,
            smsResult,
          });
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to send SMS for ticket ${ticket.id}: ${err instanceof Error ? err.message : err}`);
    }

    const locations = await InventoryItemLocation.findAll();
    const locMap = new Map(locations.map(l => [String(l.id), l.name]));
    const actionTypes = await TicketActionType.findAll();
    const actionTypeMap = new Map(actionTypes.map(at => [at.id, { id: at.id, name: at.name }]));

    return this.serializeTicket(ticket, locMap, actionTypeMap);
  }

  async createWithFiles(
    createTicketDto: CreateTicketWithFilesDto,
    files?: Express.Multer.File[],
    userId?: number,
  ) {
    let mobileForSMS: string | undefined = undefined;

    try {
      // We'll store S3 object KEYS (not public URLs). Presigned URLs will be returned via resources.
      const uploadedKeys: string[] = [];

      // Upload files to S3 if provided
      if (files && files.length > 0) {
        this.logger.log(`Uploading ${files.length} files to S3`);
        
        // Upload each file to S3
        for (const file of files) {
          const key = this.s3Service.generateObjectKey('tickets', file.originalname);
          const uploadResult = await this.s3Service.uploadBuffer({
            buffer: file.buffer,
            contentType: file.mimetype,
            key: key,
          });
          // Keep the key for DB persistence; avoid public URL usage
          uploadedKeys.push(key);
        }
        
        this.logger.log(`Successfully uploaded files: ${uploadedKeys.join(', ')}`);
      }

      // Create ticket (optionally store keys in attachments JSON for legacy support)
      const ticketData: BaseTicketDto = {
        ...createTicketDto,
        attachments: uploadedKeys,
      } as BaseTicketDto;

      await this.processActionTypes(ticketData);

      // Resolve customer by mobile if provided and customer_id is absent
      if (!ticketData.customer_id && (createTicketDto as any).mobile_number) {
        const mobile = this.normalizeMobile((createTicketDto as any).mobile_number);
        const customerId = await this.findOrCreateCustomerByMobile(mobile);
        ticketData.customer_id = customerId;
        mobileForSMS = mobile;
      }

      // Clean transient field
      delete (ticketData as any).mobile_number;

      if (!ticketData.device_id) {
        let deviceName: string | undefined = (createTicketDto as any).deviceName;
        let locationId: number | undefined;

        if (createTicketDto.data) {
          try {
            const dataObj = typeof createTicketDto.data === 'string' ? JSON.parse(createTicketDto.data) : createTicketDto.data;
            if (dataObj) {
              if (dataObj.assetsDevice && !deviceName) {
                deviceName = dataObj.assetsDevice;
              }
              if (dataObj.location) {
                locationId = Number(dataObj.location);
              }
            }
          } catch (e) {}
        }

        if (deviceName) {
          let device = await InventoryItem.findOne({ where: { name: deviceName } });
          if (!device) {
            device = await InventoryItem.create({ 
              name: deviceName, 
              category_id: 1,
              ownership: 'own',
              location_id: locationId
            } as any);
          }
          ticketData.device_id = device.id;
        }
      }
      delete (ticketData as any).deviceName;

      const createdTicket = await this.ticketRepository.create(ticketData);
      this.logger.log(`Ticket created successfully with ID: ${createdTicket.id}`);

      // Persist each uploaded file as a TicketResource record
      if (uploadedKeys.length > 0) {
        for (let i = 0; i < uploadedKeys.length; i++) {
          const file = files![i];
          const record: TicketsResourceAttributes = {
            file_mime_type: file.mimetype,
            file_path: uploadedKeys[i],
            thumb_path: uploadedKeys[i],
            hash: uploadedKeys[i],
            ticket_id: createdTicket.id as number,
          } as any;
          await this.ticketResourceRepository.create(record);
        }
      }

      // Return enriched ticket including presigned URLs for resources
      const enriched = await this.findOneEnriched(createdTicket.id as number);

      // Resolve assigned agent's user id (from User table) for realtime/notifications
      const assignedUserId = await this.resolveAssignedUserId(createdTicket);

      // Emit public ticket event via Pusher
      try {
        await this.pusher.trigger(publicTicketsChannel(), 'ticket.created', { ticketId: createdTicket.id, id: createdTicket.id, hash: createdTicket.hash, title: createdTicket.title, priority: createdTicket.priority, status: createdTicket.status, event: 'ticket.created' });
      } catch (err) {
        this.logger.warn(`Failed to push public ticket.created for ${createdTicket.id}: ${err instanceof Error ? err.message : err}`);
      }

      // Send email notification
      this.emailService.sendTicketCreatedEmail(createdTicket).catch((err) =>
        this.logger.warn(`Ticket created email failed: ${err?.message}`),
      );

      // Persist a notification for the assigned user (if any) and push via Pusher
      try {
        if (assignedUserId) {
          const notifPayload = {
            message: `Ticket #${createdTicket.id} assigned to you`,
            type: 'ticket.created',
            ticket_id: createdTicket.id,
            user_id: assignedUserId,
            data: { event: 'ticket.created', ticket: enriched ?? createdTicket },
          } as any;

          await this.notifications.createNotification(notifPayload);

          try {
            await this.pusher.trigger(userChannel(assignedUserId), 'ticket.created', { ticketId: createdTicket.id, ticket: enriched ?? createdTicket, notification: notifPayload });
          } catch (err) {
            this.logger.warn(`Failed to emit pusher user ticket.created for user ${assignedUserId}: ${err instanceof Error ? err.message : err}`);
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to persist notification for ticket ${createdTicket.id}: ${err instanceof Error ? err.message : err}`);
      }

      // Attempt to send an SMS confirmation to the ticket's customer (non-blocking)
      try {
        let to = mobileForSMS;
        if (!to && (createdTicket as any)?.customer_id) {
          const customer = await Customer.findByPk((createdTicket as any).customer_id);
          if (customer?.mobile_number || customer?.phone_number) {
            to = this.normalizeMobile(customer.mobile_number || customer.phone_number || '');
          }
        }
        if (to) {
          const ticketChar = (process.env.TICKET_ID_IDENTIFICATION_CHAR || '@').replace(/['"]/g, '');
          const msg = `Ticket #${createdTicket.id} created: "${createdTicket.title}". Use ${ticketChar}${createdTicket.id} when replying.`;
          const smsResult = await this.sms.sendSms({ to, message: msg }).catch((e) => ({ error: e }));

          if (smsResult && (smsResult as any).skipped) {
            this.logger.warn(`SMS skipped for ticket ${createdTicket.id} to ${to}: ${(smsResult as any).reason}`);
          } else if ((smsResult as any).error) {
            this.logger.warn(`SMS error for ticket ${createdTicket.id} to ${to}: ${(smsResult as any).error?.message || smsResult}`);
          } else {
            this.logger.log(`Sent ticket creation SMS for ticket ${createdTicket.id} to ${to}`);
            await this.logOutboundSmsToMessagesTable({
              ticketId: createdTicket.id,
              to,
              message: msg,
              customerId: (createdTicket as any)?.customer_id,
              applicationId: (createdTicket as any)?.application_id,
              smsResult,
            });
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to send SMS for ticket ${createdTicket.id}: ${err instanceof Error ? err.message : err}`);
      }

      return enriched;
    } catch (error) {
      this.logger.error(`Failed to create ticket: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: number, updateTicketDto: UpdateTicketDto, userId?: number) {
    // Load existing ticket to detect assignment changes
    const before = await this.ticketRepository.findOne(id);

    const ticketData = { ...updateTicketDto };
    await this.processActionTypes(ticketData);

    const updated = await this.ticketRepository.update(id, ticketData);

    try {
      const changes = this.serializePayload(updateTicketDto);
      try {
        this.logger.log(`Ticket ${id} updated by user ${userId ?? 'unknown'}; changes=${JSON.stringify(changes)}`);
      } catch {
        this.logger.log(`Ticket ${id} updated by user ${userId ?? 'unknown'}`);
      }
    } catch (e) {
      // don't let logging interfere with update flow
    }

    // Resolve assigned agent's user id (from User table) for realtime/notifications
    const assignedUserId = await this.resolveAssignedUserId(updated);

    // Enqueue realtime ticket update for dashboard queue
    const isStatusChanged = before && before.status !== updated.status;
    const isPriorityChanged = before && before.priority !== updated.priority;

    let queueEventType = 'TICKET_UPDATED';
    if (isPriorityChanged) {
      queueEventType = 'PRIORITY_CHANGED';
    } else if (isStatusChanged) {
      queueEventType = 'STATUS_CHANGED';
    }

    this.ticketQueue
      .enqueueUpdate({
        ticketId: id,
        eventType: queueEventType,
        payload: {
          id,
          hash: before?.hash ?? updated.hash,
          title: updated.title,
          status: updated.status,
          previousStatus: before?.status,
          priority: updated.priority,
          previousPriority: before?.priority,
          changes: this.serializePayload(updateTicketDto),
        },
        userId,
        priority: updated.priority || 'medium',
      })
      .catch((err) => this.logger.warn(`Failed to enqueue ${queueEventType} for ${id}: ${err?.message || err}`));

    // Send Twilio SMS notification when ticket status changes to closed
    const updatedStatus = updated.status?.toLowerCase();
    const previousStatus = before?.status?.toLowerCase();
    if (updatedStatus === 'closed' && previousStatus !== updatedStatus) {
      this.sendTicketStatusSms(updated, 'closed').catch((err) =>
        this.logger.warn(`Failed to send status SMS for ticket ${id}: ${err?.message}`),
      );
    }

    const locations = await InventoryItemLocation.findAll();
    const locMap = new Map(locations.map(l => [String(l.id), l.name]));
    const actionTypes = await TicketActionType.findAll();
    const actionTypeMap = new Map(actionTypes.map(at => [at.id, { id: at.id, name: at.name }]));

    const serialized = this.serializeTicket(updated, locMap, actionTypeMap);

    // Emit private and public per-ticket update
    try {
      const updatePayload = {
        ticketId: id,
        hash: updated.hash,
        ticket: serialized,
        changes: this.serializePayload(updateTicketDto),
      };
      await this.pusher.trigger(perTicketChannel(id), 'ticket.updated', updatePayload);
      await this.pusher.trigger(`public-ticket-${id}`, 'ticket.updated', updatePayload);
      if (updated.hash) {
        await this.pusher.trigger(`public-ticket-${updated.hash}`, 'ticket.updated', updatePayload);
      }
    } catch (err) {
      this.logger.warn(`Failed to push per-ticket update for ${id}: ${err instanceof Error ? err.message : err}`);
    }

    return serialized;
  }

  async remove(id: number) {
    await this.ticketRepository.remove(id);

    // Enqueue realtime ticket update for dashboard queue
    this.ticketQueue
      .enqueueUpdate({
        ticketId: id,
        eventType: 'TICKET_DELETED',
        payload: { ticketId: id },
        priority: 'high',
      })
      .catch((err) => this.logger.warn(`Failed to enqueue TICKET_DELETED for ${id}: ${err?.message || err}`));
  }

  async updateAssignees(id: number, agentIds: number[], userId?: number): Promise<any> {
    const ticket = await this.ticketRepository.findOne(id);
    if (!ticket) throw new NotFoundException(`Ticket with ID ${id} not found`);

    // Validate all agent IDs exist
    const agents = await Agent.findAll({ where: { id: agentIds } });
    if (agents.length !== agentIds.length) {
      const foundIds = agents.map(a => a.id);
      const missing = agentIds.filter(id => !foundIds.includes(id));
      throw new NotFoundException(`Agent(s) not found: ${missing.join(', ')}`);
    }

    // Primary agent = first in list; multiple_assignees = full list
    const primaryAgentId = agentIds[0] ?? null;
    await ticket.update({ agent_id: primaryAgentId, multiple_assignees: agentIds });

    this.logger.log(`Ticket ${id} assignees updated to [${agentIds.join(', ')}] by user ${userId ?? 'unknown'}`);

    const locations = await InventoryItemLocation.findAll();
    const locMap = new Map(locations.map(l => [String(l.id), l.name]));
    const serialized = this.serializeTicket(ticket, locMap);

    // Broadcast public update
    try {
      await this.pusher.trigger(publicTicketsChannel(), 'ticket.updated', { ticketId: id, event: 'ticket.updated', actorId: userId });
      await this.pusher.trigger(perTicketChannel(id), 'ticket.updated', { ticketId: id, ticket: serialized, changes: { multiple_assignees: agentIds } });
    } catch (err) {
      this.logger.warn(`Failed to push ticket.updated for ${id}: ${err instanceof Error ? err.message : err}`);
    }

    return { ...serialized, multiple_assignees: agentIds };
  }

  async updateActionTypes(id: number, actionTypeIds: number[], userId?: number): Promise<any> {
    const ticket = await this.ticketRepository.findOne(id);
    if (!ticket) throw new NotFoundException(`Ticket with ID ${id} not found`);

    if (actionTypeIds.length > 0) {
      const records = await TicketActionType.findAll({ where: { id: actionTypeIds } });
      const foundIds = records.map(r => r.id);
      const missing = actionTypeIds.filter(aid => !foundIds.includes(aid));
      if (missing.length > 0) {
        throw new NotFoundException(`Action Type(s) not found: ${missing.join(', ')}`);
      }
    }

    await ticket.update({ action_types: actionTypeIds });

    this.logger.log(`Ticket ${id} action types updated to [${actionTypeIds.join(', ')}] by user ${userId ?? 'unknown'}`);

    const locations = await InventoryItemLocation.findAll();
    const locMap = new Map(locations.map(l => [String(l.id), l.name]));
    const serialized = this.serializeTicket(ticket, locMap);

    const actionRecords = actionTypeIds.length > 0
      ? await TicketActionType.findAll({ where: { id: actionTypeIds } })
      : [];
    const resolvedActionTypes = actionRecords.map(r => ({ id: r.id, name: r.name }));

    try {
      await this.pusher.trigger(publicTicketsChannel(), 'ticket.updated', { ticketId: id, event: 'ticket.updated', actorId: userId });
      await this.pusher.trigger(perTicketChannel(id), 'ticket.updated', { ticketId: id, changes: { action_types: resolvedActionTypes } });
    } catch (err) {
      this.logger.warn(`Failed to push ticket.updated for ${id}: ${err instanceof Error ? err.message : err}`);
    }

    return { ...serialized, action_types: resolvedActionTypes };
  }

  async findAllEnriched(
    startDate?: string,
    endDate?: string,
    status?: string,
    priority?: string,
    agentId?: number,
    deviceId?: number,
    locationId?: number,
    page?: number,
    limit?: number,
    actionType?: string,
    sortBy?: string,
    sortOrder?: string,
  ): Promise<any> {
    const { rows, count } = await this.ticketRepository.findAllEnriched(
      startDate,
      endDate,
      status,
      priority,
      agentId,
      deviceId,
      locationId,
      page,
      limit,
      actionType,
      sortBy,
      sortOrder,
    );
    const results: EnrichedTicketResponseDto[] = [];
    const locations = await InventoryItemLocation.findAll();
    const locMap = new Map(locations.map(l => [String(l.id), l.name]));

    for (const t of rows) {
      const res = await this.ticketResourceService.listForTicket(t.id);
      results.push(await this.transformToEnrichedResponse(t, res, locMap));
    }
    
    if (page && limit) {
      return {
        data: results,
        meta: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        }
      };
    }
    
    return results;
  }

  async findOneEnriched(id: number): Promise<EnrichedTicketResponseDto> {
    const ticket = await this.ticketRepository.findOneEnriched(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    const locations = await InventoryItemLocation.findAll();
    const locMap = new Map(locations.map(l => [String(l.id), l.name]));
    const resources = await this.ticketResourceService.listForTicket(ticket.id);
    return await this.transformToEnrichedResponse(ticket, resources, locMap);
  }

  private async transformToEnrichedResponse(ticket: any, resources?: ResourceWithUrls[], locMap?: Map<string, string | undefined>): Promise<EnrichedTicketResponseDto> {
    // Reporter is now an Agent - use Agent data for reporter fields
    const reporterName = ticket.reporter 
      ? `${ticket.reporter.first_name || ''} ${ticket.reporter.last_name || ''}`.trim() || ticket.reporter.nickname
      : undefined;

    // Parse location from data JSON string
    let locationIdFromData: string | undefined;
    if (ticket.data) {
      try {
        const data = typeof ticket.data === 'string' 
          ? JSON.parse(ticket.data) 
          : ticket.data;
        if (data && data.location) {
          locationIdFromData = String(data.location);
        }
      } catch (error) {
        this.logger.warn(`Failed to parse data for ticket ${ticket.id}: ${error.message}`);
      }
    }

    let locationName = ticket.device?.location?.name;
    if (locationIdFromData && locMap && locMap.has(locationIdFromData)) {
      locationName = locMap.get(locationIdFromData);
    }

    let rawActionTypes = ticket.action_types;
    if (typeof rawActionTypes === 'string') {
      try {
        rawActionTypes = JSON.parse(rawActionTypes);
      } catch (e) {
        rawActionTypes = [];
      }
    }

    let resolvedActionTypes: Array<{ id: number; name: string }> = [];
    if (rawActionTypes && Array.isArray(rawActionTypes) && rawActionTypes.length > 0) {
      try {
        const records = await TicketActionType.findAll({
          where: {
            id: rawActionTypes,
          },
        });
        resolvedActionTypes = records.map((r) => ({ id: r.id, name: r.name }));
      } catch (e) {
        this.logger.warn(`Failed to resolve action type names for ticket ${ticket.id}: ${e}`);
      }
    }

    return {
      id: ticket.id,
      title: ticket.title,
      body: ticket.body,
      priority: ticket.priority,
      status: ticket.status,
      additinal_data: ticket.additinal_data,
      hash: ticket.hash,
      serialNo: ticket.serialNo || ticket.device?.serialNo,
      createdAt: ticket.createdAt,
      ticket_template_id: ticket.ticket_template_id,
      agentFirst: ticket.agent?.first_name,
      agentLast: ticket.agent?.last_name,
      aplName: ticket.application?.name,
      organization: ticket.application?.organization ? {
        id: ticket.application.organization.id,
        name: ticket.application.organization.name,
      } : undefined,
      cusName: ticket.customer?.first_name,
      cusLast: ticket.customer?.last_name,
      mobile_number: ticket.customer?.mobile_number,
      temName: ticket.ticketTemplate?.name,
      locationName: locationName,
      deviceName: ticket.device?.name,
      deviceId: ticket.device?.id ?? ticket.device_id,
      // Use Agent data for reporter fields - reporter_id points to Agent
      reporterFname: ticket.reporter?.first_name,
      reporterLname: ticket.reporter?.last_name,
      reporterId: ticket.reporter_id ?? ticket.reporter?.id,
      reporterName: reporterName || undefined,
      multiple_assignees: ticket.multiple_assignees,
      attachments: ticket.attachments,
      resources,
      action_types: resolvedActionTypes,
      invoice: await this.enrichInvoiceWithSignedUrls(ticket.invoice),
    };
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
            attachment.url = await this.s3Service.getSignedUrlForKey(attachment.key);
          } catch (e) {
            this.logger.warn(`Failed to generate signed URL for invoice attachment ${attachment.key}`);
          }
        }
      }
      inv.attachments = isString ? JSON.stringify(attachments) : attachments;
    }
    return inv;
  }

  // Helpers
  private serializeTicket(ticket: any, locMap?: Map<string, string | undefined>, actionTypeMap?: Map<number, { id: number; name: string }>) {
    if (!ticket) return ticket;
    try {
      const serialized = typeof ticket.toJSON === 'function' ? ticket.toJSON() : ticket;
      
      let dataLocId: string | undefined;
      if (serialized.data) {
        try {
          const dataObj = typeof serialized.data === 'string' ? JSON.parse(serialized.data) : serialized.data;
          if (dataObj && dataObj.location) {
            dataLocId = String(dataObj.location);
          }
        } catch (e) {}
      }

      let resolvedLocationName: string | undefined;
      if (dataLocId && locMap && locMap.has(dataLocId)) {
        resolvedLocationName = locMap.get(dataLocId);
      }

      if (serialized && serialized.device) {
        serialized.deviceName = serialized.device.name;
        serialized.deviceId = serialized.device.id;
        if (!resolvedLocationName && serialized.device.location) {
          resolvedLocationName = serialized.device.location.name;
        }
      }

      if (resolvedLocationName) {
        serialized.locationName = resolvedLocationName;
      }

      let rawActionTypes = serialized.action_types;
      if (typeof rawActionTypes === 'string') {
        try {
          rawActionTypes = JSON.parse(rawActionTypes);
        } catch (e) {
          rawActionTypes = [];
        }
      }

      if (Array.isArray(rawActionTypes)) {
        const resolved: Array<{ id: number; name: string }> = [];
        for (const val of rawActionTypes) {
          const id = Number(val);
          if (!isNaN(id)) {
            if (actionTypeMap && actionTypeMap.has(id)) {
              resolved.push(actionTypeMap.get(id)!);
            } else {
              resolved.push({ id, name: `Action Type ${id}` });
            }
          }
        }
        serialized.action_types = resolved;
      } else {
        serialized.action_types = [];
      }

      if (serialized.createdAt) serialized.createdAt = this.formatPST(serialized.createdAt);
      if (serialized.updatedAt) serialized.updatedAt = this.formatPST(serialized.updatedAt);

      return serialized;
    } catch {
      return ticket;
    }
  }

  private formatPST(date: any): string {
    if (!date) return date;
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    // 'sv' locale produces "YYYY-MM-DD HH:MM:SS" — replace space with T for ISO-like output
    return d.toLocaleString('sv', { timeZone: 'America/Los_Angeles' }).replace(' ', 'T') + ' PST';
  }

  private normalizeMobile(input: string): string {
    if (!input) return input;
    // Basic normalization: trim and remove non-digits; keep leading + if present
    const trimmed = String(input).trim();
    if (trimmed.startsWith('+')) {
      return '+' + trimmed.replace(/\D/g, '');
    }
    return trimmed.replace(/\D/g, '');
  }

  private async sendTicketStatusSms(ticket: any, status: 'closed' = 'closed'): Promise<void> {
    try {
      const fullTicket = await this.ticketRepository.findOne(ticket.id);
      let mobile = (fullTicket as any)?.Customer?.mobile_number;
      if (!mobile && fullTicket?.customer_id) {
        const customer = await Customer.findByPk(fullTicket.customer_id);
        mobile = customer?.mobile_number;
      }

      if (!mobile) {
        this.logger.warn(`No customer mobile number found for ticket #${ticket.id}; skipping closed SMS.`);
        return;
      }

      const to = this.normalizeMobile(mobile);
      const msg = `Ticket #${ticket.id} has been resolved & closed. If you need help, text our support line at +1 (626) 263-4999 to open a new ticket. Thank you -Tech Support.`;

      const smsResult = await this.sms.sendSms({ to, message: msg }).catch((e) => ({ error: e }));

      if (smsResult && (smsResult as any).skipped) {
        this.logger.warn(`SMS skipped for ticket #${ticket.id} (Closed) to ${to}: ${(smsResult as any).reason}`);
      } else if ((smsResult as any).error) {
        this.logger.warn(`SMS error for ticket #${ticket.id} (Closed) to ${to}: ${(smsResult as any).error?.message || smsResult}`);
      } else {
        this.logger.log(`Sent ticket Closed SMS for ticket #${ticket.id} to ${to}`);
        await this.logOutboundSmsToMessagesTable({
          ticketId: ticket.id,
          to,
          message: msg,
          customerId: (fullTicket as any)?.customer_id,
          applicationId: (fullTicket as any)?.application_id,
          smsResult,
        });
      }
    } catch (err: any) {
      this.logger.warn(`Failed to send closed SMS for ticket #${ticket.id}: ${err?.message || err}`);
    }
  }

  private async logOutboundSmsToMessagesTable(opts: {
    ticketId: number;
    to: string;
    message: string;
    customerId?: number;
    applicationId?: number;
    smsResult?: any;
  }): Promise<void> {
    try {
      const fromEnv = (process.env.SMS_FROM_NUMBER || process.env.TWILIO_FROM_NUMBER || '').trim();
      const from = (opts.smsResult as any)?.from || fromEnv || 'system';
      await this.messageRepository.create({
        from,
        to: opts.to,
        message: opts.message,
        direction: 'outgoing',
        type: 'sms',
        customer_id: opts.customerId,
        application_id: opts.applicationId,
        ticket_id: opts.ticketId,
        message_data: opts.smsResult ? JSON.stringify(opts.smsResult) : undefined,
      } as any);
    } catch (err: any) {
      this.logger.warn(`Failed to log outbound SMS message to messages table for ticket ${opts.ticketId}: ${err?.message || err}`);
    }
  }

  private async findOrCreateCustomerByMobile(mobile: string): Promise<number> {
    // Try find existing
    const existing = await this.customerRepository.findByMobileNumber(mobile);
    if (existing) return existing.id as number;

    // Create minimal customer
    const email = `customer_${mobile}@tbt.com`;
    const newCustomer: BaseCustomerDto = {
      first_name: mobile,
      email,
      status: 'active',
      hash: this.generateCustomerHash(),
      mobile_number: mobile,
      phone_number: mobile,
    };
    const created = await this.customerRepository.create(newCustomer);
    return created.id as number;
  }

  private generateCustomerHash(): string {
    const rand = Math.random().toString(36).slice(2, 10);
    const ts = Date.now().toString(36);
    return `cus_${ts}_${rand}`;
  }

  async createPublicTicket(dto: CreatePublicTicketDto, files?: Express.Multer.File[]) {
    const mobile = this.normalizeMobile(dto.mobile_number);
    
    // Upload files to S3 if provided
    const uploadedKeys: string[] = [];
    if (files && files.length > 0) {
      this.logger.log(`Uploading ${files.length} public ticket attachments to S3`);
      for (const file of files) {
        const key = this.s3Service.generateObjectKey('tickets', file.originalname);
        await this.s3Service.uploadBuffer({
          buffer: file.buffer,
          contentType: file.mimetype,
          key: key,
        });
        uploadedKeys.push(key);
      }
      this.logger.log(`Public ticket uploaded files: ${uploadedKeys.join(', ')}`);
    }

    // Find or create customer with full contact details
    const customerId = await this.findOrCreateCustomerWithDetails({
      first_name: dto.customer_first_name,
      last_name: dto.customer_last_name,
      email: dto.customer_email,
      mobile_number: mobile,
    });

    // Auto-assign agent based on Application's Team Leader
    let assignedAgentId: number | undefined = undefined;
    const appId = Number(dto.application_id);

    try {
      let team: any = null;
      if (!isNaN(appId) && appId > 0) {
        // 1. Try finding team directly by application_id column on Team model
        team = await Team.findOne({
          where: { application_id: appId },
          include: [
            {
              model: Agent,
              as: 'agents',
              through: { attributes: ['role_id', 'data', 'remarks'] },
            },
          ],
        });

        // 2. Fallback: Find team via TeamApplication join table
        if (!team) {
          const teamApp = await TeamApplication.findOne({
            where: { application_id: appId },
          });
          if (teamApp) {
            team = await Team.findByPk(teamApp.team_id, {
              include: [
                {
                  model: Agent,
                  as: 'agents',
                  through: { attributes: ['role_id', 'data', 'remarks'] },
                },
              ],
            });
          }
        }
      }

      // 3. Fallback to any active team with agents
      if (!team) {
        team = await Team.findOne({
          include: [
            {
              model: Agent,
              as: 'agents',
              through: { attributes: ['role_id', 'data', 'remarks'] },
            },
          ],
        });
      }

      if (team) {
        const teamLeader = extractTeamLeader(team);
        if (teamLeader.leader_id) {
          assignedAgentId = teamLeader.leader_id;
          this.logger.log(`Public ticket auto-assigned to team leader agent_id: ${assignedAgentId} for application ${appId}`);
        } else if (team.agents && team.agents.length > 0) {
          assignedAgentId = team.agents[0].id;
          this.logger.log(`Public ticket auto-assigned to team agent_id: ${assignedAgentId} for application ${appId}`);
        }
      }

      // 4. Ultimate fallback: assign to first active agent in system
      if (!assignedAgentId) {
        const firstAgent = await Agent.findOne({ order: [['id', 'ASC']] });
        if (firstAgent) {
          assignedAgentId = firstAgent.id;
          this.logger.log(`Public ticket assigned to default fallback agent_id: ${assignedAgentId}`);
        }
      }
    } catch (err) {
      this.logger.warn(`Could not resolve assigned agent for public ticket (application ${appId}): ${err instanceof Error ? err.message : err}`);
    }

    const hash = `TBT-TICK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const createTicketDto: BaseTicketDto = {
      title: dto.title,
      body: dto.body,
      priority: dto.priority || 'Medium',
      application_id: dto.application_id,
      customer_id: customerId,
      agent_id: assignedAgentId,
      status: assignedAgentId ? 'Assigned' : 'Open',
      hash,
      ticketType: 'Help Desk',
      serialNo: dto.serialNo,
      additinal_data: dto.additional_data,
      attachments: uploadedKeys,
    };

    const ticket = await this.create(createTicketDto);

    // Save uploaded files as TicketResource records
    if (uploadedKeys.length > 0) {
      for (let i = 0; i < uploadedKeys.length; i++) {
        const file = files![i];
        const record: TicketsResourceAttributes = {
          file_mime_type: file.mimetype,
          file_path: uploadedKeys[i],
          thumb_path: uploadedKeys[i],
          hash: uploadedKeys[i],
          ticket_id: ticket.id as number,
        } as any;
        await this.ticketResourceRepository.create(record);
      }
    }
    const referenceNumber = `TBT-${ticket.id}`;

    return {
      success: true,
      message: 'Support ticket submitted successfully',
      referenceNumber,
      ticket: {
        id: ticket.id,
        referenceNumber,
        hash: ticket.hash,
        title: ticket.title,
        status: ticket.status || 'Open',
        priority: ticket.priority,
        createdAt: (ticket as any).createdAt || new Date(),
      },
    };
  }

  private async findOrCreateCustomerWithDetails(details: {
    first_name: string;
    last_name?: string;
    email: string;
    mobile_number: string;
  }): Promise<number> {
    // Try finding existing customer by mobile number
    let existing = await this.customerRepository.findByMobileNumber(details.mobile_number);
    if (!existing && details.email) {
      existing = await Customer.findOne({ where: { email: details.email } }) as any;
    }
    if (existing) return existing.id as number;

    // Create new customer with supplied details
    const newCustomer: BaseCustomerDto = {
      first_name: details.first_name,
      last_name: details.last_name,
      email: details.email,
      status: 'active',
      hash: this.generateCustomerHash(),
      mobile_number: details.mobile_number,
      phone_number: details.mobile_number,
    };
    const created = await this.customerRepository.create(newCustomer);
    return created.id as number;
  }


    private serializePayload(payload: any) {
    try {
      return JSON.parse(JSON.stringify(payload));
    } catch {
      return payload;
    }
  }
  
  /**
   * Resolve the assigned agent's user id (from User table) for a ticket.
   * Uses ticket.agent_id -> Agent.user_id mapping. Returns undefined if not available.
   */
  private async resolveAssignedUserId(ticket: any): Promise<number | undefined> {
    try {
      const agentId = (ticket as any)?.agent_id;
      if (!agentId) return undefined;

      const agent = await Agent.findByPk(agentId as any);
      const rawUserId =
        agent?.get?.({ plain: true })?.user_id ??
        (agent as any)?.user_id;

      if (!rawUserId) return undefined;

      const userId = Number(rawUserId);
      return Number.isNaN(userId) ? undefined : userId;
    } catch (error) {
      this.logger.warn(
        `Failed to resolve assigned user id for ticket "${ticket?.id}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      return undefined;
    }
  }

  private async processActionTypes(ticketData: any): Promise<void> {
    const actionTypesSet = new Set<string>();

    const extractFromJSON = (fieldVal: any): any => {
      if (!fieldVal) return fieldVal;
      try {
        const parsed = typeof fieldVal === 'string' ? JSON.parse(fieldVal) : fieldVal;
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.indicatorType)) {
            parsed.indicatorType.forEach((t: any) => {
              if (t) actionTypesSet.add(String(t).trim());
            });
            delete parsed.indicatorType;
            return JSON.stringify(parsed);
          }
        }
      } catch (e) {}
      return fieldVal;
    };

    if (ticketData.data) {
      ticketData.data = extractFromJSON(ticketData.data);
    }
    if (ticketData.additional_data) {
      ticketData.additional_data = extractFromJSON(ticketData.additional_data);
    }
    if (ticketData.additinal_data) {
      ticketData.additinal_data = extractFromJSON(ticketData.additinal_data);
    }
    if (ticketData.serialNo) {
      ticketData.serialNo = extractFromJSON(ticketData.serialNo);
    }

    if (actionTypesSet.size > 0) {
      const uniqueTypes = Array.from(actionTypesSet);
      const actionTypeIds: number[] = [];
      const appId = ticketData.application_id || null;

      for (const name of uniqueTypes) {
        try {
          const [record] = await TicketActionType.findOrCreate({
            where: { name },
            defaults: { name, application_id: appId },
          });
          if (record && record.id) {
            actionTypeIds.push(record.id);
          }
        } catch (e) {
          this.logger.warn(`Failed to process action type "${name}": ${e}`);
        }
      }

      ticketData.action_types = actionTypeIds;
    }
  }

  async getTicketCounts(startDate?: string, endDate?: string, agentId?: number) {
    const rows = await this.ticketRepository.getStatusCounts(startDate, endDate, agentId);

    const statusKeyMap: Record<string, string> = {
      'Assigned': 'assigned',
      'In Progress': 'inProgress',
      'On Hold': 'onHold',
      'Resolved': 'resolved',
      'Closed': 'closed',
    };
    const PRIORITIES = ['low', 'medium', 'high', 'critical'];
    const empty = (): Record<string, number> => ({ low: 0, medium: 0, high: 0, critical: 0 });

    const counts: Record<string, number> = { assigned: 0, inProgress: 0, onHold: 0, resolved: 0, closed: 0, total: 0 };
    const priorityByStatus: Record<string, Record<string, number>> = {
      assigned: empty(), inProgress: empty(), onHold: empty(), resolved: empty(), closed: empty(),
    };
    const allPriorityCounts = empty();

    for (const row of rows) {
      const key = statusKeyMap[row.status];
      if (!key) continue;
      const p = (row.priority || 'low').toLowerCase();

      counts[key] = (counts[key] || 0) + row.count;
      counts.total += row.count;

      if (PRIORITIES.includes(p)) {
        priorityByStatus[key][p] = (priorityByStatus[key][p] || 0) + row.count;
        allPriorityCounts[p] = (allPriorityCounts[p] || 0) + row.count;
      }
    }

    return { ...counts, priorityByStatus, allPriorityCounts };
  }

  /**
   * Create a support ticket from the Renew Portal payload (user onboarding / access request)
   */
  async createRenewPortalTicket(dto: CreateRenewPortalTicketDto) {
    const cleanMobile = dto.phoneNumber ? this.normalizeMobile(dto.phoneNumber) : undefined;

    // Resolve facility names & primary location from facilityNames or facilityIds
    let facilityDisplayNames = 'None specified';
    let primaryLocationId: number | undefined = undefined;

    const facilityNames = Array.isArray(dto.facilityNames)
      ? dto.facilityNames
          .filter((n) => typeof n === 'string' && n.trim().length > 0)
          .map((n) => n.trim())
      : typeof (dto as any).facilityNames === 'string' && (dto as any).facilityNames.trim()
      ? [(dto as any).facilityNames.trim()]
      : [];

    const facilityIds = Array.isArray(dto.facilityIds) ? dto.facilityIds : [];

    if (facilityNames.length > 0) {
      facilityDisplayNames = facilityNames.join(', ');
      try {
        const locations = await InventoryItemLocation.findAll({
          where: {
            name: {
              [Op.in]: facilityNames,
            },
          },
        });
        if (locations.length > 0) {
          primaryLocationId = locations[0].id;
        }
      } catch (e: any) {
        this.logger.warn(`Failed to resolve facility locations by name: ${e?.message || e}`);
      }
    } else if (facilityIds.length > 0) {
      try {
        const locations = await InventoryItemLocation.findAll({
          where: { id: facilityIds },
        });
        const locMap = new Map(locations.map((l) => [l.id, l.name]));
        facilityDisplayNames = facilityIds
          .map((id) => (locMap.has(id) ? `${locMap.get(id)} (ID: ${id})` : `Facility #${id}`))
          .join(', ');

        const matched = locations.find((l) => facilityIds.includes(l.id));
        primaryLocationId = matched ? matched.id : facilityIds[0];
      } catch (e: any) {
        this.logger.warn(`Failed to resolve facility locations: ${e?.message || e}`);
        facilityDisplayNames = facilityIds.map((id) => `Facility #${id}`).join(', ');
        primaryLocationId = facilityIds[0];
      }
    }

    // Resolve or create Customer for the employee
    let customerId: number;
    let existingCustomer: any = null;

    if (cleanMobile) {
      existingCustomer = await this.customerRepository.findByMobileNumber(cleanMobile);
    }
    if (!existingCustomer && dto.email && dto.email.trim()) {
      existingCustomer = await Customer.findOne({ where: { email: dto.email.trim() } });
    }

    if (existingCustomer) {
      customerId = existingCustomer.id;
      this.logger.log(`Found existing customer ID: ${customerId} for ${dto.firstName} ${dto.lastName}`);
    } else {
      // Generate a collision-free safe email if email is empty or not provided (to satisfy DB unique & not-null constraints)
      let customerEmail = dto.email && dto.email.trim() ? dto.email.trim() : '';
      if (!customerEmail) {
        const phoneDigits = (cleanMobile || '').replace(/\D/g, '');
        const baseSafe = phoneDigits ? `customer_${phoneDigits}@tbt.com` : `user_${Date.now()}@renewportal.com`;
        customerEmail = baseSafe;
        let counter = 1;
        while (await Customer.findOne({ where: { email: customerEmail } })) {
          customerEmail = `user_${Date.now()}_${counter++}@renewportal.com`;
        }
      }

      const newCustomer: BaseCustomerDto = {
        first_name: dto.firstName,
        last_name: dto.lastName,
        email: customerEmail,
        status: 'active',
        hash: this.generateCustomerHash(),
        mobile_number: cleanMobile,
        phone_number: cleanMobile,
        tag: 'Renew Portal',
        data: JSON.stringify({
          adminFirstName: dto.adminFirstName,
          adminLastName: dto.adminLastName,
          adminEmail: dto.adminEmail,
          adminTitle: dto.adminTitle,
          department: dto.department,
          positionTitle: dto.positionTitle,
          employeeType: dto.employeeType,
          facilityIds: facilityIds.length > 0 ? facilityIds : undefined,
          facilityNames: facilityNames.length > 0 ? facilityNames : undefined,
          source: 'Renew Portal',
        }),
      };

      const created = await this.customerRepository.create(newCustomer);
      customerId = created.id as number;
      this.logger.log(`Created new customer ID: ${customerId} for ${dto.firstName} ${dto.lastName}`);
    }

    // Auto-assign agent based on Application's Team Leader
    let assignedAgentId: number | undefined = undefined;
    let applicationId = 1; // Default to 1 (Customer Portal)

    try {
      const renewApp = await Application.findOne({
        where: {
          name: {
            [Op.like as any]: '%Renew%',
          },
        },
      });
      if (renewApp) {
        applicationId = renewApp.id;
      }
    } catch {}

    try {
      let team: any = await Team.findOne({
        where: { application_id: applicationId },
        include: [
          {
            model: Agent,
            as: 'agents',
            through: { attributes: ['role_id', 'data', 'remarks'] },
          },
        ],
      });

      if (!team) {
        const teamApp = await TeamApplication.findOne({
          where: { application_id: applicationId },
        });
        if (teamApp) {
          team = await Team.findByPk(teamApp.team_id, {
            include: [
              {
                model: Agent,
                as: 'agents',
                through: { attributes: ['role_id', 'data', 'remarks'] },
              },
            ],
          });
        }
      }

      if (team) {
        const teamLeader = extractTeamLeader(team);
        if (teamLeader.leader_id) {
          assignedAgentId = teamLeader.leader_id;
        } else if (team.agents && team.agents.length > 0) {
          assignedAgentId = team.agents[0].id;
        }
      }

      if (!assignedAgentId) {
        const firstAgent = await Agent.findOne({ order: [['id', 'ASC']] });
        if (firstAgent) {
          assignedAgentId = firstAgent.id;
        }
      }
    } catch (err: any) {
      this.logger.warn(`Could not resolve assigned agent for renew portal ticket: ${err?.message || err}`);
    }

    const hash = `TBT-TICK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const title = `${dto.isNewUser ? 'New User' : 'User'} Access Request: ${dto.firstName} ${dto.lastName}${dto.accessType ? ` - ${dto.accessType}` : ''}`;

    const hasEmployeeEmail = Boolean(dto.email && dto.email.trim());
    const emailLine = hasEmployeeEmail
      ? `\n  <li><strong>Email:</strong> ${dto.email!.trim()}</li>`
      : '';

    const body = `
<h3>Renew Portal Access Request</h3>
<p><strong>Request Type:</strong> ${dto.isNewUser ? 'New User Onboarding' : 'Existing User Modification'}</p>

<h4>Employee Information:</h4>
<ul>
  <li><strong>Full Name:</strong> ${dto.firstName} ${dto.lastName}</li>${emailLine}
  <li><strong>Phone Number:</strong> ${dto.phoneNumber || 'N/A'}</li>
  <li><strong>Position / Title:</strong> ${dto.positionTitle || 'N/A'}</li>
  <li><strong>Department:</strong> ${dto.department || 'N/A'}</li>
  <li><strong>Employment Type:</strong> ${dto.employeeType || 'N/A'}</li>
  <li><strong>Access Type:</strong> ${dto.accessType || 'N/A'}</li>
  <li><strong>Facilities:</strong> ${facilityDisplayNames}</li>
</ul>

<h4>Submitted By (Administrator):</h4>
<ul>
  <li><strong>Admin Name:</strong> ${dto.adminFirstName} ${dto.adminLastName}</li>
  <li><strong>Admin Title:</strong> ${dto.adminTitle || 'N/A'}</li>
  <li><strong>Admin Email:</strong> ${dto.adminEmail}</li>
</ul>

${dto.note ? `<h4>Notes / Remarks:</h4><p>${dto.note}</p>` : ''}
`.trim();

    const portalMetadata = {
      adminFirstName: dto.adminFirstName,
      adminLastName: dto.adminLastName,
      adminTitle: dto.adminTitle,
      adminEmail: dto.adminEmail,
      facilityIds: facilityIds.length > 0 ? facilityIds : undefined,
      facilityNames: facilityNames.length > 0 ? facilityNames : undefined,
      facilities: facilityDisplayNames,
      firstName: dto.firstName,
      lastName: dto.lastName,
      isNewUser: dto.isNewUser,
      email: hasEmployeeEmail ? dto.email!.trim() : undefined,
      phoneNumber: dto.phoneNumber,
      accessType: dto.accessType,
      employeeType: dto.employeeType,
      department: dto.department,
      positionTitle: dto.positionTitle,
      note: dto.note,
      location: primaryLocationId ? String(primaryLocationId) : undefined,
      reporter: dto.phoneNumber || dto.adminEmail,
      source: 'Renew Portal',
      ticketType: 'Help Desk',
    };

    const createTicketDto: BaseTicketDto = {
      title,
      body,
      priority: 'Medium',
      application_id: applicationId,
      customer_id: customerId,
      agent_id: assignedAgentId,
      status: assignedAgentId ? 'Assigned' : 'Open',
      hash,
      ticketType: 'Help Desk',
      data: JSON.stringify(portalMetadata),
      additinal_data: JSON.stringify({
        source: 'Renew Portal',
        adminEmail: dto.adminEmail,
        accessType: dto.accessType,
        facilityIds: facilityIds.length > 0 ? facilityIds : undefined,
        facilityNames: facilityNames.length > 0 ? facilityNames : undefined,
        facilities: facilityDisplayNames,
        department: dto.department,
        positionTitle: dto.positionTitle,
      }),
    };

    const createdTicket = await this.create(createTicketDto);
    const referenceNumber = `TBT-${createdTicket.id}`;
    const baseUrl = process.env.PUBLIC_FRONTEND_URL || process.env.CORS_ORIGIN || process.env.BASE_URL || 'http://localhost:5173';
    const trackingUrl = `${baseUrl.replace(/\/$/, '')}/track-ticket/${createdTicket.hash}`;

    // Send confirmation email directly to the Admin who submitted the request
    if (dto.adminEmail) {
      try {
        await this.emailService.sendTicketCreatedEmail(createdTicket, dto.adminEmail);
        this.logger.log(`Confirmation email sent to admin: ${dto.adminEmail} for ticket #${createdTicket.id}`);
      } catch (err: any) {
        this.logger.warn(`Failed to send confirmation email to admin ${dto.adminEmail}: ${err?.message || err}`);
      }
    }

    return {
      success: true,
      message: 'Ticket created successfully from Renew Portal',
      referenceNumber,
      ticket: {
        id: createdTicket.id,
        referenceNumber,
        hash: createdTicket.hash,
        title: createdTicket.title,
        status: createdTicket.status || 'Open',
        priority: createdTicket.priority,
        trackingUrl,
        customer: {
          id: customerId,
          name: `${dto.firstName} ${dto.lastName}`,
          phoneNumber: dto.phoneNumber || null,
          email: hasEmployeeEmail ? dto.email!.trim() : null,
        },
        admin: {
          name: `${dto.adminFirstName} ${dto.adminLastName}`,
          email: dto.adminEmail,
          title: dto.adminTitle || null,
        },
        facilities: facilityDisplayNames,
        assignedAgentId,
        createdAt: (createdTicket as any).createdAt || new Date(),
      },
    };
  }

  /**
   * Create a support ticket from Zendesk webhook payload (Public / Unauthenticated)
   */
  async createZendeskTicket(dto: CreateZendeskTicketDto) {
    // 1. Resolve customer / requester
    const reqEmail = dto.requester?.email ? dto.requester.email.trim() : '';
    const reqName = dto.requester?.name ? dto.requester.name.trim() : '';

    // Always use a single shared Zendesk placeholder customer
    let customerId: number;
    const zendeskCustomer = await Customer.findOne({ where: { email: 'zendesk@tbt.com' } });
    if (zendeskCustomer) {
      customerId = zendeskCustomer.id as number;
      this.logger.log(`Reusing Zendesk placeholder customer ID: ${customerId}`);
    } else {
      const created = await this.customerRepository.create({
        first_name: 'Zendesk',
        last_name: 'User',
        email: 'zendesk@tbt.com',
        status: 'active',
        hash: this.generateCustomerHash(),
        tag: 'Zendesk',
        data: JSON.stringify({ source: 'Zendesk' }),
      } as BaseCustomerDto);
      customerId = created.id as number;
      this.logger.log(`Created Zendesk placeholder customer ID: ${customerId}`);
    }

    // 2. Map priority (urgent -> Critical, high -> High, normal/medium -> Medium, low -> Low)
    let priority = 'Medium';
    const rawPriority = (dto.priority || '').toLowerCase().trim();
    if (rawPriority === 'urgent') {
      priority = 'Critical';
    } else if (rawPriority === 'high') {
      priority = 'High';
    } else if (rawPriority === 'normal' || rawPriority === 'medium') {
      priority = 'Medium';
    } else if (rawPriority === 'low') {
      priority = 'Low';
    }

    // 3. Application resolution (find %Zendesk% application or fallback to 1)
    let applicationId = 1;
    try {
      const zendeskApp = await Application.findOne({
        where: {
          name: {
            [Op.like as any]: '%Zendesk%',
          },
        },
      });
      if (zendeskApp) {
        applicationId = zendeskApp.id;
      }
    } catch {}

    // 4. Assignee resolution (try matching Zendesk assignee name/email against Agent, or fallback to team leader/first agent)
    let assignedAgentId: number | undefined = undefined;
    if (dto.assignee && dto.assignee.trim()) {
      const assigneeName = dto.assignee.trim();
      try {
        const matchedAgent = await Agent.findOne({
          where: {
            [Op.or]: [
              { first_name: { [Op.like as any]: `%${assigneeName}%` } },
              { last_name: { [Op.like as any]: `%${assigneeName}%` } },
              { email: { [Op.like as any]: `%${assigneeName}%` } },
            ],
          },
        });
        if (matchedAgent) {
          assignedAgentId = matchedAgent.id;
          this.logger.log(`Matched Zendesk assignee "${assigneeName}" to agent ID ${assignedAgentId}`);
        }
      } catch (err: any) {
        this.logger.warn(`Could not match Zendesk assignee "${assigneeName}": ${err?.message || err}`);
      }
    }

    if (!assignedAgentId) {
      try {
        let team: any = await Team.findOne({
          where: { application_id: applicationId },
          include: [
            {
              model: Agent,
              as: 'agents',
              through: { attributes: ['role_id', 'data', 'remarks'] },
            },
          ],
        });

        if (!team) {
          const teamApp = await TeamApplication.findOne({
            where: { application_id: applicationId },
          });
          if (teamApp) {
            team = await Team.findByPk(teamApp.team_id, {
              include: [
                {
                  model: Agent,
                  as: 'agents',
                  through: { attributes: ['role_id', 'data', 'remarks'] },
                },
              ],
            });
          }
        }

        if (team) {
          const teamLeader = extractTeamLeader(team);
          if (teamLeader.leader_id) {
            assignedAgentId = teamLeader.leader_id;
          } else if (team.agents && team.agents.length > 0) {
            assignedAgentId = team.agents[0].id;
          }
        }

        if (!assignedAgentId) {
          const firstAgent = await Agent.findOne({ order: [['id', 'ASC']] });
          if (firstAgent) {
            assignedAgentId = firstAgent.id;
          }
        }
      } catch (err: any) {
        this.logger.warn(`Could not resolve default agent for Zendesk ticket: ${err?.message || err}`);
      }
    }

    // 5. Map status
    let status = assignedAgentId ? 'Assigned' : 'Open';
    const rawStatus = (dto.status || '').toLowerCase().trim();
    if (rawStatus === 'solved' || rawStatus === 'closed') {
      status = 'Closed';
    } else if (rawStatus === 'pending' || rawStatus === 'hold') {
      status = 'Pending';
    }

    // 6. Generate hash and title
    const hash = `TBT-TICK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const title = (dto.title && dto.title.trim()) || (dto.ticket_id ? `Zendesk Ticket #${dto.ticket_id}` : 'Zendesk Support Ticket');

    // 7. Format description / body
    const tagsDisplay = Array.isArray(dto.tags) ? dto.tags.join(', ') : (typeof dto.tags === 'string' ? dto.tags : '');
    const hasReqEmail = Boolean(reqEmail);

    const body = `
<h3>Zendesk Ticket ${dto.ticket_id ? `#${dto.ticket_id}` : ''}</h3>
<p><strong>Title:</strong> ${dto.title || 'N/A'}</p>
<p><strong>Status:</strong> ${dto.status || 'open'}</p>
<p><strong>Priority:</strong> ${dto.priority || 'normal'}</p>

<h4>Requester Details:</h4>
<ul>
  <li><strong>Name:</strong> ${reqName || 'N/A'}</li>${hasReqEmail ? `\n  <li><strong>Email:</strong> ${reqEmail}</li>` : ''}
</ul>

${dto.assignee ? `<p><strong>Zendesk Assignee:</strong> ${dto.assignee}</p>` : ''}
${tagsDisplay ? `<p><strong>Tags:</strong> ${tagsDisplay}</p>` : ''}
${dto.updated_at ? `<p><strong>Zendesk Updated At:</strong> ${dto.updated_at}</p>` : ''}

<h4>Description:</h4>
<div style="white-space: pre-wrap;">
${dto.description || 'No description provided.'}
</div>
`.trim();

    // 8. Prepare metadata (DO NOT set serialNo to prevent DB VARCHAR length issues)
    const zendeskMetadata = {
      source: 'Zendesk',
      ticket_id: dto.ticket_id,
      title: dto.title,
      description: dto.description,
      status: dto.status,
      priority: dto.priority,
      requester: dto.requester,
      assignee: dto.assignee,
      tags: dto.tags,
      updated_at: dto.updated_at,
      reporter: reqEmail || reqName || 'Zendesk',
      ticketType: 'Zendesk',
    };

    const createTicketDto: BaseTicketDto = {
      title,
      body,
      priority,
      application_id: applicationId,
      customer_id: customerId,
      agent_id: assignedAgentId,
      status,
      hash,
      ticketType: 'Help Desk',
      data: JSON.stringify(zendeskMetadata),
      additinal_data: JSON.stringify({
        source: 'Zendesk',
        zendesk_ticket_id: dto.ticket_id,
        requester: dto.requester,
        assignee: dto.assignee,
        tags: dto.tags,
        updated_at: dto.updated_at,
      }),
    };

    const createdTicket = await this.create(createTicketDto);
    const referenceNumber = `TBT-${createdTicket.id}`;
    const baseUrl = process.env.PUBLIC_FRONTEND_URL || process.env.CORS_ORIGIN || process.env.BASE_URL || 'http://localhost:5173';
    const trackingUrl = `${baseUrl.replace(/\/$/, '')}/track-ticket/${createdTicket.hash}`;

    // Send confirmation email to requester if email exists
    if (reqEmail) {
      try {
        await this.emailService.sendTicketCreatedEmail(createdTicket, reqEmail);
        this.logger.log(`Confirmation email sent to requester: ${reqEmail} for ticket #${createdTicket.id}`);
      } catch (err: any) {
        this.logger.warn(`Failed to send confirmation email to requester ${reqEmail}: ${err?.message || err}`);
      }
    }

    return {
      success: true,
      message: 'Ticket created successfully from Zendesk',
      referenceNumber,
      ticket: {
        id: createdTicket.id,
        referenceNumber,
        hash: createdTicket.hash,
        title: createdTicket.title,
        status: createdTicket.status || 'Open',
        priority: createdTicket.priority,
        trackingUrl,
        zendeskTicketId: dto.ticket_id || null,
        customer: {
          id: customerId,
          name: 'Zendesk User',
          email: hasReqEmail ? reqEmail : null,
        },
        assignee: dto.assignee || null,
        assignedAgentId,
        createdAt: (createdTicket as any).createdAt || new Date(),
      },
    };
  }
}
