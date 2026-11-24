import { Injectable, Logger } from '@nestjs/common';
import { PusherService } from './pusher.service';
import { NotificationService } from './notification.service';

type TicketEventType = 'ticket.created' | 'ticket.updated' | 'ticket.deleted' | 'ticket.comment.internal' | 'ticket.comment.public' ;

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly dashboardChannel: string;
  private readonly legacyTicketChannel?: string;

  constructor(
    private readonly pusher: PusherService,
    private readonly notifications: NotificationService,
  ) {
    this.dashboardChannel =
      (process.env.PUSHER_DASHBOARD_CHANNEL || '').trim() ||
      'private-dashboard';
    // Keep notifications service injected for persistence; do not
    // create a per-user notifications channel in this service.
    const legacyRaw =
      (process.env.PUSHER_LEGACY_TICKET_CHANNEL ??
        'ticket-channel')?.trim() ?? 'ticket-channel';
    if (
      legacyRaw.length > 0 &&
      legacyRaw.toLowerCase() !== 'false' &&
      legacyRaw !== '-'
    ) {
      this.legacyTicketChannel = legacyRaw;
    }
  }

  getPusherConfig() {
    return {
      ...this.pusher.getPublicConfig(),
      channel: this.dashboardChannel,
    };
  }



  // per-user realtime emission removed — keep persistence only

  authorizeChannel(socketId: string, channelName: string, presenceData?: any, user?: any) {
    if (!this.pusher.isEnabled()) {
      throw new Error('Realtime is disabled');
    }

    // Allow dashboard channel as before
    if (channelName === this.dashboardChannel) {
      return this.pusher.authenticate(socketId, channelName, presenceData);
    }

    // Allow per-user private channels named `private-user-{id}` where the
    // authenticated requester matches the channel id.
    const userMatch = /^private-user-(\d+)$/.exec(channelName);
    if (userMatch) {
      const expectedId = Number(userMatch[1]);
      const requesterId = user && (user.id ?? user.userId ?? user.user_id);
      if (!requesterId || Number(requesterId) !== expectedId) {
        this.logger.warn(
          `Rejected realtime auth for user channel "${channelName}" (requester=${requesterId})`,
        );
        throw new Error('Channel not allowed');
      }
      return this.pusher.authenticate(socketId, channelName, presenceData);
    }

    // Allow private per-ticket channels `private-ticket-{id}` for authenticated users.
    // Viewing a single ticket may open a per-ticket channel from the frontend.
    const ticketMatch = /^private-ticket-(\d+)$/.exec(channelName);
    if (ticketMatch) {
      const ticketId = Number(ticketMatch[1]);
      const requesterId = user && (user.id ?? user.userId ?? user.user_id);
      if (!requesterId) {
        this.logger.warn(
          `Rejected realtime auth for ticket channel "${channelName}" (unauthenticated request)`,
        );
        throw new Error('Channel not allowed');
      }
      this.logger.log(`Authorizing ticket channel ${channelName} for requester=${requesterId}`);
      return this.pusher.authenticate(socketId, channelName, presenceData);
    }

    // All other channels are not allowed from the frontend
    this.logger.warn(
      `Rejected realtime auth for unexpected channel "${channelName}"`,
    );
    throw new Error('Channel not allowed');
  }

  private decoratePayload(
    event: string,
    payload: Record<string, unknown>,
  ): Record<string, unknown> {
    const meta = {
      event,
      emittedAt: new Date().toISOString(),
      channel: this.dashboardChannel,
    };
    return { ...payload, meta };
  }

  private extractTicketId(payload: Record<string, unknown>): number | undefined {
    const rawTicketId =
      (payload as any)?.ticketId ??
      (payload as any)?.ticket?.id ??
      (payload as any)?.id;

    if (typeof rawTicketId === 'number' && Number.isFinite(rawTicketId)) {
      return rawTicketId;
    }
    if (typeof rawTicketId === 'string') {
      const parsed = Number(rawTicketId);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return undefined;
  }

}


