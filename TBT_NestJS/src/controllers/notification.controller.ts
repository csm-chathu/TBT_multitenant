import { Controller, Get, Query, UseGuards, Req, Patch, Body, Param, Post, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { NotificationService } from '../services/notification.service';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(
    @Req() req: Request & { user?: any },
    @Query('userId') userIdParam?: string,
    @Query('limit') limitParam?: string,
    @Query('sinceId') sinceIdParam?: string,
  ) {
    // Prefer user id from authenticated token (req.user) when available.
    // Fall back to legacy `userId` query param only if token is not present.
    let userId: number | undefined = undefined;
    if (req.user && (req.user.userId || req.user.sub)) {
      userId = Number(req.user.userId ?? req.user.sub);
    } else if (userIdParam) {
      userId = Number(userIdParam);
    }

    const limit = limitParam ? Number(limitParam) : undefined;
    const sinceId = sinceIdParam ? Number(sinceIdParam) : undefined;

    // In legacy implementation the notifications endpoint always returned an empty list when user was missing.
    if (!userId || Number.isNaN(userId)) {
      return { notifications: [], errors: [], id: 1 };
    }

    const notifications = await this.notificationService.listRecent(userId, limit ?? 20, Number.isFinite(sinceId) ? sinceId : undefined as any);
    return { notifications, errors: [], id: 1 };
  }

  @Get(':id')
  async getAndMarkRead(
    @Req() req: Request & { user?: any },
    @Param('id') idParam: string,
  ) {
    const id = Number(idParam);
    const userId = req.user?.userId;
    if (!id || Number.isNaN(id)) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.notificationService.markAsRead(id, true, userId);
    if (!updated) throw new NotFoundException('Notification not found');
    return { success: true, notification: updated };
  }

  @Patch('mark-all-read')
  async markAllRead(@Req() req: Request & { user?: any }) {
    let userId: number | undefined = req.user?.userId as number | undefined;
    // Fallback: try to decode Bearer token from Authorization header if guard didn't populate req.user
    if (!userId) {
      const auth = (req.headers && (req.headers as any).authorization) || (req.headers && (req.headers as any).Authorization);
      if (auth && typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
        const token = auth.slice(7).trim();
        try {
          const payload: any = jwt.verify(token, JWT_SECRET);
          userId = payload?.sub ? Number(payload.sub) : undefined;
        } catch (err) {
          // ignore token errors here; we'll return user id not found below
        }
      }
    }

    if (!userId) return { success: false, message: 'User id not found' };

    const result = await this.notificationService.markAllAsRead(userId);
    // result contains { affected, notifications }
    return { success: true, affected: result.affected, notifications: result.notifications };
  }

  @Patch(':id')
  async updateStatus(
    @Req() req: Request & { user?: any },
    @Param('id') idParam: string,
  ) {
    const id = Number(idParam);
    const rawBody = (req as any).body;
    const hasIsRead = rawBody && Object.prototype.hasOwnProperty.call(rawBody, 'isRead');
    const isRead = hasIsRead ? Boolean(rawBody.isRead) : true;
    const userId = req.user?.userId;

    const updated = await this.notificationService.markAsRead(id, isRead, userId);
    if (!updated) {
      throw new NotFoundException('Notification not found');
    }
    return { success: true, notification: updated };
  }

  @Post('update-status')
  async updateStatusByBody(
    @Req() req: Request & { user?: any },
    @Body() body: { id?: number; isRead?: boolean },
  ) {
    const id = Number(body?.id);
    if (!id || Number.isNaN(id)) {
      return { success: false, message: 'Notification id is required' };
    }
    const isRead = Boolean(body?.isRead);
    const userId = req.user?.userId;

    const updated = await this.notificationService.markAsRead(id, isRead, userId);
    if (!updated) {
      throw new NotFoundException('Notification not found');
    }
    return { success: true, notification: updated };
  }
}


