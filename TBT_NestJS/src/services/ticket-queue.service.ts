import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { TicketUpdateQueue, Ticket, User, Agent, Customer } from '../models';
import { PusherService } from './pusher.service';
import { publicTicketsChannel } from '../config/channel.constants';

export interface EnqueueUpdateOptions {
  ticketId?: number | null;
  eventType: string;
  payload?: any;
  userId?: number | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | string;
}

@Injectable()
export class TicketQueueService {
  private readonly logger = new Logger(TicketQueueService.name);
  private readonly dashboardChannel: string;

  constructor(private readonly pusher: PusherService) {
    this.dashboardChannel =
      (process.env.PUSHER_DASHBOARD_CHANNEL || '').trim() || 'private-dashboard';
  }

  /**
   * Enqueues a ticket lifecycle event to the DB queue and broadcasts via Pusher to the dashboard.
   * Status is saved as boolean: `false` (unprocessed / pending), `true` (processed / acknowledged).
   */
  async enqueueUpdate(options: EnqueueUpdateOptions): Promise<TicketUpdateQueue> {
    const { ticketId = null, eventType, payload = {}, userId = null, priority = 'medium' } = options;

    try {
      const queueItem = await TicketUpdateQueue.create({
        ticket_id: ticketId,
        event_type: eventType,
        status: false,
        priority,
        payload,
        created_by: userId,
      });

      const fullPayload = {
        queueId: queueItem.id,
        ticketId: queueItem.ticket_id,
        eventType: queueItem.event_type,
        status: queueItem.status,
        priority: queueItem.priority,
        payload: queueItem.payload,
        createdBy: queueItem.created_by,
        createdAt: queueItem.createdAt,
      };

      // Broadcast to private dashboard channel
      this.pusher
        .trigger(this.dashboardChannel, 'ticket.queue.updated', fullPayload)
        .catch((err) =>
          this.logger.warn(`Failed to push ticket.queue.updated event: ${err?.message || err}`),
        );

      // Broadcast dedicated new event for highlighting in queue components
      this.pusher
        .trigger(this.dashboardChannel, 'ticket.queue.new_event', fullPayload)
        .catch(() => null);

      this.pusher
        .trigger(publicTicketsChannel(), 'ticket.queue.new_event', fullPayload)
        .catch(() => null);

      // Map queue eventType to correct public channel event name
      let publicEvent = 'ticket.updated';
      if (eventType === 'TICKET_CREATED') {
        publicEvent = 'ticket.created';
      } else if (eventType === 'TICKET_DELETED') {
        publicEvent = 'ticket.deleted';
      }

      const publicPayload = {
        ticketId: queueItem.ticket_id,
        id: queueItem.ticket_id,
        event: publicEvent,
        eventType: queueItem.event_type,
        actorId: queueItem.created_by,
        ...(typeof queueItem.payload === 'object' && queueItem.payload !== null ? queueItem.payload : {}),
      };

      // Broadcast to public ticket channel for legacy/public listeners if ticket exists
      this.pusher
        .trigger(publicTicketsChannel(), publicEvent, publicPayload)
        .catch((err) =>
          this.logger.warn(`Failed to push ${publicEvent} event: ${err?.message || err}`),
        );

      return queueItem;
    } catch (err) {
      this.logger.error(`Error enqueueing ticket update for ticket ${ticketId}`, err as any);
      throw err;
    }
  }

  /**
   * Fetch active dashboard ticket queue items with pagination & boolean status filtering.
   * `status` can be `false` (pending/unread), `true` (completed/read), or `'all'`.
   * `onlyFollowUp` defaults to true so only ticket created and comment updates are fetched for Follow up texts.
   */
  async getDashboardQueue(
    status?: any,
    limit: number = 20,
    page: number = 1,
    startDate?: string,
    endDate?: string,
    onlyFollowUp: boolean = true,
    category?: string,
  ) {
    const offset = (page - 1) * limit;
    const whereClause: any = {};

    if (category === 'Ticket Created') {
      whereClause.event_type = 'TICKET_CREATED';
    } else if (category === 'Public Comment') {
      whereClause.event_type = 'COMMENT_ADDED';
      whereClause[Op.and] = [
        ...(whereClause[Op.and] || []),
        { payload: { [Op.notLike]: '%"isInternal":true%' } },
        { payload: { [Op.notLike]: '%"category":"Internal Comment"%' } },
        { payload: { [Op.notLike]: '%"category":"Customer Insights"%' } },
      ];
    } else if (onlyFollowUp) {
      whereClause.event_type = { [Op.in]: ['TICKET_CREATED', 'COMMENT_ADDED'] };
      whereClause[Op.and] = [
        ...(whereClause[Op.and] || []),
        {
          [Op.or]: [
            { event_type: 'TICKET_CREATED' },
            {
              [Op.and]: [
                { payload: { [Op.notLike]: '%"isInternal":true%' } },
                { payload: { [Op.notLike]: '%"category":"Internal Comment"%' } },
                { payload: { [Op.notLike]: '%"category":"Customer Insights"%' } },
              ],
            },
          ],
        },
      ];
    }

    if (status !== undefined && status !== null && String(status).toLowerCase() !== 'all') {
      const strVal = String(status).toLowerCase();
      if (strVal === 'false' || strVal === '0' || strVal === 'pending' || strVal === 'unread') {
        whereClause.status = false;
      } else if (strVal === 'true' || strVal === '1' || strVal === 'completed' || strVal === 'read') {
        whereClause.status = true;
      }
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (end) end.setHours(23, 59, 59, 999);
      if (start && end) whereClause.createdAt = { [Op.between]: [start, end] };
      else if (start) whereClause.createdAt = { [Op.gte]: start };
      else if (end) whereClause.createdAt = { [Op.lte]: end };
    }

    const { rows, count } = await TicketUpdateQueue.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      include: [
        {
          model: Ticket,
          required: false,
          attributes: ['id', 'hash', 'title', 'status', 'priority', 'agent_id', 'customer_id', 'reporter_id', 'createdAt'],
          include: [
            {
              model: Agent,
              as: 'reporter',
              required: false,
              attributes: ['id', 'first_name', 'last_name', 'email'],
            },
            {
              model: Customer,
              required: false,
              attributes: ['id', 'first_name', 'last_name', 'mobile_number', 'phone_number', 'email'],
            },
          ],
        },
        {
          model: User,
          as: 'creator',
          required: false,
          attributes: ['id', 'name', 'username', 'email'],
        },
      ],
    });

    return {
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Get total metrics for dashboard ticket queue (boolean status).
   */
  async getQueueStats(onlyFollowUp: boolean = true) {
    const baseWhere: any = onlyFollowUp
      ? {
          event_type: { [Op.in]: ['TICKET_CREATED', 'COMMENT_ADDED'] },
          [Op.or]: [
            { event_type: 'TICKET_CREATED' },
            {
              [Op.and]: [
                { payload: { [Op.notLike]: '%"isInternal":true%' } },
                { payload: { [Op.notLike]: '%"category":"Internal Comment"%' } },
                { payload: { [Op.notLike]: '%"category":"Customer Insights"%' } },
              ],
            },
          ],
        }
      : {};

    const [pendingCount, completedCount, totalCount] = await Promise.all([
      TicketUpdateQueue.count({ where: { ...baseWhere, status: false } }),
      TicketUpdateQueue.count({ where: { ...baseWhere, status: true } }),
      TicketUpdateQueue.count({ where: baseWhere }),
    ]);

    return {
      pending: pendingCount,
      completed: completedCount,
      total: totalCount,
    };
  }

  /**
   * Acknowledge/update status of a queue item to boolean `true` or specified boolean.
   */
  async updateQueueStatus(id: number, status: any = true, errorMessage?: string) {
    const item = await TicketUpdateQueue.findByPk(id);
    if (!item) {
      throw new NotFoundException(`Queue item #${id} not found`);
    }

    const boolStatus = status === 'false' || status === 0 || status === false ? false : true;
    item.status = boolStatus;

    if (boolStatus) {
      item.processed_at = new Date();
    }
    if (errorMessage) {
      item.error_message = errorMessage;
    }

    await item.save();

    // Broadcast status change to dashboard
    this.pusher
      .trigger(this.dashboardChannel, 'ticket.queue.status_changed', {
        queueId: item.id,
        status: item.status,
        processedAt: item.processed_at,
      })
      .catch(() => null);

    return item;
  }
}
