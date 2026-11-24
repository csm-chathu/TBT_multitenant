import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Req,
  Logger,
  UseGuards,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RealtimeService } from '../services/realtime.service';
import { TicketQueueService } from '../services/ticket-queue.service';

@Controller('realtime')
export class RealtimeController {
  private readonly logger = new Logger(RealtimeController.name);

  constructor(
    private readonly realtime: RealtimeService,
    private readonly ticketQueue: TicketQueueService,
  ) {}

  @Get('config')
  getConfig(@Req() req: Request) {
    try {
      const auth = String(req.headers?.authorization ?? '');
      this.logger.log(`Realtime config requested, authHeaderPresent=${Boolean(auth)}`);
    } catch (e) {
      // ignore logging errors
    }
    return this.realtime.getPusherConfig();
  }

  @UseGuards(JwtAuthGuard)
  @Post('auth')
  @HttpCode(200)
  authorize(@Req() req: Request, @Body() body: any) {
    const socketId = String(body.socket_id || body.socketId || '').trim();
    const channelName = String(body.channel_name || body.channelName || '').trim();

    if (!socketId || !channelName) {
      throw new BadRequestException('socket_id and channel_name are required for realtime auth');
    }

    try {
      // pass authenticated user to allow per-user channel authorization
      const user = (req as any).user;
      return this.realtime.authorizeChannel(socketId, channelName, body.presence_data || body.presenceData, user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Realtime auth failed';
      throw new BadRequestException(message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('queue')
  async getQueue(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('onlyFollowUp') onlyFollowUp?: string,
    @Query('excludeStatusUpdates') excludeStatusUpdates?: string,
    @Query('category') category?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const parsedPage = page ? parseInt(page, 10) : 1;
    const shouldFilterFollowUpOnly =
      onlyFollowUp === undefined ||
      onlyFollowUp === 'true' ||
      onlyFollowUp === '1';
    return this.ticketQueue.getDashboardQueue(
      status,
      parsedLimit,
      parsedPage,
      startDate,
      endDate,
      shouldFilterFollowUpOnly,
      category,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('queue/stats')
  async getQueueStats(
    @Query('onlyFollowUp') onlyFollowUp?: string,
    @Query('excludeStatusUpdates') excludeStatusUpdates?: string,
  ) {
    const shouldFilterFollowUpOnly =
      onlyFollowUp === undefined ||
      onlyFollowUp === 'true' ||
      onlyFollowUp === '1';
    return this.ticketQueue.getQueueStats(shouldFilterFollowUpOnly);
  }

  @UseGuards(JwtAuthGuard)
  @Post('queue/:id/ack')
  @HttpCode(200)
  async acknowledgeQueueItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status?: any; errorMessage?: string },
  ) {
    const targetStatus = body?.status !== undefined ? body.status : true;
    return this.ticketQueue.updateQueueStatus(id, targetStatus, body?.errorMessage);
  }
}



