import { Injectable } from '@nestjs/common';
import { Notification, Ticket } from '../models';
import { Op } from 'sequelize';
import { NotificationAttributes } from '../intertfaces/notification.interface';

@Injectable()
export class NotificationRepository {
  async findRecentForUser(
    userId: number,
    limit = 10,
    sinceId?: number,
  ): Promise<NotificationAttributes[]> {
    const whereClause: any = { user_id: userId };
    if (sinceId && Number.isFinite(Number(sinceId))) {
      whereClause.id = { [Op.gt]: Number(sinceId) };
    }

    const records = await Notification.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit,
      include: [
        {
          model: Ticket,
          attributes: ['id', 'hash', 'title', 'priority', 'status'],
        },
      ],
    });

    return records.map((record) => {
      const json = record.toJSON() as any;
      if (json?.data && typeof json.data === 'string') {
        try {
          json.data = JSON.parse(json.data);
        } catch {
          /* ignore invalid JSON payloads */
        }
      }
      // Provide a convenience boolean for read status derived from `status` column
      json.isRead = (json.status === 'read') || false;
      return json;
    });
  }

  async create(
    notification: NotificationAttributes,
  ): Promise<NotificationAttributes> {
    const payload = { ...notification } as NotificationAttributes & {
      data?: string;
    };

    if (payload.data && typeof payload.data !== 'string') {
      payload.data = JSON.stringify(payload.data);
    }

    // Remove createdAt/updatedAt from payload to let Sequelize handle them automatically
    delete (payload as any).createdAt;
    delete (payload as any).updatedAt;

    const record = await Notification.create(payload as any);
    const json = record.toJSON() as NotificationAttributes;
    // derive read boolean
    (json as any).isRead = (json.status === 'read') || false;
    return json;
  }

  async updateStatus(notificationId: number, isRead: boolean, userId?: number): Promise<NotificationAttributes | null> {
    const where: any = { id: notificationId };
    if (userId) where.user_id = userId;

    // Perform a direct update to ensure the DB row is modified
    const [affected] = await Notification.update(
      { status: isRead ? 'read' : 'unread' },
      { where },
    );
    if (!affected || affected === 0) return null;

    // Re-fetch the updated notification and return
    const notification = await Notification.findOne({ where });
    if (!notification) return null;
    const json = notification.toJSON() as NotificationAttributes;
    (json as any).isRead = (json.status === 'read') || false;
    return json;
  }

  async markAllReadForUser(userId: number): Promise<{ affected: number; notifications: NotificationAttributes[] }> {
    const [affected] = await Notification.update(
      { status: 'read' },
      { where: { user_id: userId, status: { [Op.ne]: 'read' } } as any },
    );

    const records = await Notification.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
    });

    const notifications = records.map((record) => {
      const json = record.toJSON() as any;
      if (json?.data && typeof json.data === 'string') {
        try {
          json.data = JSON.parse(json.data);
        } catch {}
      }
      json.isRead = (json.status === 'read') || false;
      return json as NotificationAttributes;
    });

    return { affected: affected as number, notifications };
  }
}


