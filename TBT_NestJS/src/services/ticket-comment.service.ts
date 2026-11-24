import { Injectable, Logger } from '@nestjs/common';
import { TicketCommentRepository } from '../repositories/ticket-comment.repository';
import { PusherService } from './pusher.service';
import { perTicketChannel, userChannel, publicTicketsChannel } from '../config/channel.constants';
import { Agent, TicketComment, User } from '../models';
import { BaseTicketCommentDto } from '../dto/ticket-comment/ticket-comment.dto';
import { TicketRepository } from '../repositories/ticket.repository';
import { NotificationService } from './notification.service';
import { S3Service } from './s3.service';
import { TicketQueueService } from './ticket-queue.service';
import type { Express } from 'express';

@Injectable()
export class TicketCommentService {
  private readonly logger = new Logger(TicketCommentService.name);

  constructor(
    private readonly repo: TicketCommentRepository,
    private readonly ticketRepo: TicketRepository,
    private readonly pusher: PusherService,
    private readonly notifications: NotificationService,
    private readonly s3Service: S3Service,
    private readonly ticketQueue: TicketQueueService,
  ) {}

  async listForTicket(ticketId: number) {
    const comments = await this.repo.findByTicketId(ticketId);
    return await Promise.all(comments.map((c) => this.enrichComment(c)));
  }

  async addForTicket(ticketId: number, dto: BaseTicketCommentDto, files?: Express.Multer.File[]) {
    let commentResources: { media_files: Array<{ file_mime_type: string; file_path: string; thumb_path: string }> } = {
      media_files: [],
    };

    if (files && files.length > 0) {
      this.logger.log(`Uploading ${files.length} comment files to S3`);
      for (const file of files) {
        const key = this.s3Service.generateObjectKey(`tickets/${ticketId}/comments`, file.originalname);
        await this.s3Service.uploadBuffer({
          buffer: file.buffer,
          contentType: file.mimetype,
          key,
        });
        commentResources.media_files.push({
          file_mime_type: file.mimetype,
          file_path: key,
          thumb_path: key,
        });
      }
    }

    let resolvedToUserId = dto.to;
    if ((dto.type || '').toLowerCase() === 'internal' && dto.to) {
      try {
        const agent = await Agent.findByPk(dto.to as any);
        const agentUserId = agent?.get?.({ plain: true })?.user_id || (agent as any)?.user_id;
        if (agentUserId) {
          resolvedToUserId = agentUserId;
        }
      } catch (e) {
        // ignore resolution errors
      }
    }

    const createDto: BaseTicketCommentDto = { 
      ...dto, 
      to: resolvedToUserId,
      ticket_id: ticketId,
      resources: commentResources.media_files.length > 0 ? JSON.stringify(commentResources) : dto.resources,
    };
    const comment = await this.repo.create(createDto);
    
    // Persist notification before emitting realtime events
    try {
      const isInternal = (createDto.type || '').toLowerCase() === 'internal';
      const eventName = isInternal ? 'ticket.comment.internal' : 'ticket.comment.public';
      let ticketData: Awaited<ReturnType<typeof this.ticketRepo.findOneEnriched>> = null;
      try {
        ticketData = await this.ticketRepo.findOneEnriched(ticketId);
      } catch (err) {
        this.logger.warn('Failed to load ticket data for notification payload', err as any);
      }

      // Resolve notifyUserId: if `comment.to` refers to an agent id, use agent.user_id
      let notifyUserId = (comment as any)?.to || (comment as any)?.from;
      if (notifyUserId) {
        try {
          const maybeAgent = await Agent.findByPk(notifyUserId as any);
          const agentUserId = maybeAgent?.get?.({ plain: true })?.user_id || (maybeAgent as any)?.user_id;
          if (agentUserId) notifyUserId = agentUserId;
        } catch (e) {
          // ignore resolution errors
        }
      }

      await this.notifications.createNotification({
        message: ticketId ? `Ticket #${ticketId} new comment` : 'Ticket comment',
        type: eventName,
        ticket_id: ticketId,
        user_id: notifyUserId,
        target_user_id: (comment as any)?.to || undefined,
        data: {
          event: eventName,
          ticketId,
          comment,
          ticket: ticketData,
        },
      });
    } catch (err) {
      this.logger.warn('Failed to persist ticket comment notification (pre-emit)', err as any);
    }
    // Do not send or log SMS on comment creation; SMS should only be sent via the /messages endpoints.
    // If this is an internal comment and a target agent is specified, create a notification
    let emitted = false;
    try {
      const isInternal = (createDto.type || '').toLowerCase() === 'internal';
      const targetAgentId = createDto.to;
      if (isInternal && targetAgentId) {
        const agent = await Agent.findByPk(targetAgentId as any);
        const targetUserId = agent?.get?.({ plain: true })?.user_id || (agent as any)?.user_id;
        if (targetUserId) {
          comment.to = targetUserId;
          // Fetch enriched ticket data to include in realtime payload
          let ticketData: Awaited<ReturnType<typeof this.ticketRepo.findOneEnriched>> = null;
          try {
            ticketData = await this.ticketRepo.findOneEnriched(ticketId);
          } catch (err) {
            this.logger.warn('Failed to load ticket data for realtime comment event', err as any);
          }
          // Emit to the targeted user's private channel and the per-ticket channel
          try {
            const uChan = userChannel(targetUserId);
            const tChan = perTicketChannel(ticketId);
            await this.pusher.trigger(uChan, 'ticket.comment.internal', { ticketId, comment, ticket: ticketData });
            await this.pusher.trigger(tChan, 'ticket.comment.internal', { ticketId, comment, ticket: ticketData });
          } catch (err) {
            this.logger.warn('Failed to emit pusher event for targeted internal comment', err as any);
          }
          emitted = true;
        }
      }
      if (!isInternal) {
        // Fetch enriched ticket data to include in the public realtime payload
        let ticketDataForPublic: Awaited<ReturnType<typeof this.ticketRepo.findOneEnriched>> = null;
        try {
          ticketDataForPublic = await this.ticketRepo.findOneEnriched(ticketId);
        } catch (err) {
          this.logger.warn('Failed to load ticket data for public realtime comment event', err as any);
        }

        const tChan = perTicketChannel(ticketId);
        const pubChan = publicTicketsChannel();
        try {
          // Emit to the per-ticket channel
          await this.pusher.trigger(tChan, 'ticket.comment.public', { ticketId, comment, ticket: ticketDataForPublic });
          await this.pusher.trigger(`public-ticket-${ticketId}`, 'ticket.comment.public', { ticketId, comment, ticket: ticketDataForPublic });
          if (ticketDataForPublic?.hash) {
            await this.pusher.trigger(`public-ticket-${ticketDataForPublic.hash}`, 'ticket.comment.public', { ticketId, comment, ticket: ticketDataForPublic });
          }
          // Also emit to the public tickets channel so frontends subscribed to public channel receive it
          await this.pusher.trigger(pubChan, 'ticket.comment.public', { ticketId, comment, ticket: ticketDataForPublic });
        } catch (err) {
          this.logger.warn('Failed to emit public ticket.comment event', err as any);
        }
      }
    } catch (err) {
      // Log and continue — notification failure should not block comment creation
      this.logger.warn('Failed to create internal comment notification', err as any);
    }

    // Always emit a ticket-level update to the per-ticket channel so viewers refresh
    try {
      let ticketData: Awaited<ReturnType<TicketRepository['findOneEnriched']>> | null = null;
      try {
        ticketData = await this.ticketRepo.findOneEnriched(ticketId);
      } catch (err) {
        this.logger.warn('Failed to load ticket data for realtime update emit', err as any);
      }

      const tChan = perTicketChannel(ticketId);
      // Emit a generic ticket.updated event so frontends mark the ticket as updated
      try {
        await this.pusher.trigger(tChan, 'ticket.updated', { ticketId, ticket: ticketData, comment });
      } catch (err) {
        this.logger.warn('Failed to emit ticket.updated for comment', err as any);
      }
      // Enqueue to realtime ticket update queue for dashboard activity
      const hasFiles = files && files.length > 0;
      const isInternal = (createDto.type || '').toLowerCase() === 'internal';
      const category = hasFiles
        ? 'Upload Attachment'
        : isInternal
        ? 'Internal Comment'
        : 'Public Comment';

      // Resolve author name for the comment (from User or Agent table)
      let fromUserStr = (createDto as any)?.from_name || (comment as any)?.from_name;
      const fromUserId = (createDto as any)?.from || (comment as any)?.from;

      if (!fromUserStr && fromUserId) {
        try {
          const userObj = await User.findByPk(fromUserId);
          if (userObj) {
            fromUserStr = userObj.name || userObj.username || userObj.email;
          } else {
            const agentObj = await Agent.findByPk(fromUserId);
            if (agentObj) {
              const linkedUser = agentObj.user_id ? await User.findByPk(agentObj.user_id) : null;
              fromUserStr = linkedUser?.name || linkedUser?.username || (agentObj as any)?.name || (agentObj as any)?.username;
            }
          }
        } catch (err) {
          this.logger.warn(`Failed to resolve comment user name for ID ${fromUserId}`, err as any);
        }
      }

      if (!fromUserStr) {
        fromUserStr = 'User';
      }

      const descText = comment.comment || (hasFiles ? `Uploaded ${files.length} document${files.length > 1 ? 's' : ''}` : 'Added a comment');

      this.ticketQueue
        .enqueueUpdate({
          ticketId,
          eventType: hasFiles ? 'FILE_UPLOADED' : 'COMMENT_ADDED',
          payload: {
            ticketId,
            category,
            title: `Ticket #${ticketId}`,
            description: descText,
            commentId: comment.id,
            authorName: fromUserStr,
            isInternal,
          },
          userId: fromUserId || null,
          priority: 'medium',
        })
        .catch((err) =>
          this.logger.warn(`Failed to enqueue comment update for ticket ${ticketId}: ${err?.message || err}`),
        );
    } catch (err) {
      // non-fatal
    }

    return await this.enrichComment(comment);
  }

  private async enrichComment(comment: TicketComment | null): Promise<any> {
    if (!comment) return comment;
    const plain: any = typeof comment.toJSON === 'function' ? comment.toJSON() : comment;

    if (plain.type === 'internal' && plain.to) {
      try {
        let agent = await Agent.findOne({ where: { user_id: plain.to } });
        if (!agent) {
          agent = await Agent.findByPk(plain.to as any);
        }
        if (agent) {
          plain.recipient_agent_id = agent.id;
          plain.to = agent.id;
        }
      } catch (err) {
        this.logger.warn(`Failed to resolve recipient agent for comment ${plain.id}`, err);
      }
    }

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
}
