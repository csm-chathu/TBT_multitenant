import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../repositories/notification.repository';
import { PusherService } from './pusher.service';

@Injectable()
export class NotificationService {
  private readonly notificationsChannelBase: string;

  constructor(private readonly notifications: NotificationRepository, private readonly pusher: PusherService) {
    this.notificationsChannelBase = (process.env.PUSHER_NOTIFICATIONS_CHANNEL || '').trim() || 'private-notifications';
  }

  async listRecent(userId: number, limit = 20, sinceId?: number) {
    return this.notifications.findRecentForUser(userId, limit, sinceId);
  }

  async markAsRead(notificationId: number, isRead: boolean, userId?: number) {
    return this.notifications.updateStatus(notificationId, isRead, userId);
  }

  async markAllAsRead(userId: number) {
    return this.notifications.markAllReadForUser(userId);
  }
  async createNotification(data: Record<string, any>) {
    const payload: Record<string, any> = { ...data };

    // Defaults
    if (!payload.message) payload.message = 'Notification';
    if (!payload.status) payload.status = 'active';
    if (!payload.level) payload.level = 'info';
    if (!payload.hash) payload.hash = this.generateNotificationHash();

    await this.notifications.create(payload as any);
  }

  private generateNotificationHash(): string {
    const rand = Math.random().toString(36).slice(2, 10);
    const ts = Date.now().toString(36);
    return `notif_${ts}_${rand}`;
  }
}


