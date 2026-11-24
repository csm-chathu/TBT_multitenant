import { Injectable, Logger } from '@nestjs/common';
import Pusher = require('pusher');

export interface PusherPublicConfig {
  enabled: boolean;
  key?: string;
  cluster?: string;
  useTLS?: boolean;
  authEndpoint?: string;
}

@Injectable()
export class PusherService {
  private readonly logger = new Logger(PusherService.name);
  private client: Pusher | null = null;
  private publicConfig: PusherPublicConfig = { enabled: false };

  constructor() {
    const appId = (process.env.PUSHER_APP_ID || '').trim();
    const key = (process.env.PUSHER_KEY || '').trim();
    const secret = (process.env.PUSHER_SECRET || '').trim();
    const cluster = (process.env.PUSHER_CLUSTER || '').trim();
    const useTLS = (process.env.PUSHER_USE_TLS || 'true').trim().toLowerCase() !== 'false';

    this.publicConfig = {
      enabled: false,
      key: key || undefined,
      cluster: cluster || undefined,
      useTLS,
      authEndpoint: process.env.PUSHER_AUTH_ENDPOINT || '/realtime/auth',
    };

    if (!appId || !key || !secret) {
      this.logger.warn('Pusher credentials not set — realtime features disabled');
      return;
    }

    try {
      const opts: any = { appId, key, secret, useTLS };
      if (cluster) opts.cluster = cluster;
      this.client = new Pusher(opts);
      this.publicConfig.enabled = true;
      this.logger.log(`Pusher initialized (cluster=${cluster || 'default'})`);
    } catch (err) {
      this.client = null;
      this.publicConfig.enabled = false;
      this.logger.error('Failed to initialize Pusher client', err as any);
    }
  }

  isEnabled(): boolean {
    return !!this.client;
  }

  getPublicConfig(): PusherPublicConfig {
    return { ...this.publicConfig };
  }

  async trigger(channel: string, event: string, data: unknown): Promise<void> {
    if (!this.client) {
      this.logger.debug(`Pusher disabled — skipping trigger ${channel}:${event}`);
      return;
    }

    try {
      await (this.client as any).trigger(channel, event, data);
    } catch (err) {
      this.logger.error(`Pusher trigger error for ${channel}:${event}`, err as any);
      throw err;
    }
  }

  /**
   * Authenticate a socket for private or presence channels.
   * For presence channels pass `presenceData` (usually `{ user_id, user_info }`).
   */
  authenticate(socketId: string, channel: string, presenceData?: any): any {
    if (!this.client) {
      throw new Error('Realtime is disabled');
    }

    const authFn = (this.client as any).authenticate ?? (this.client as any).authorize ?? (this.client as any).authorizeChannel;
    if (!authFn) {
      throw new Error('Pusher authenticate API not available on client');
    }

    try {
      return authFn.call(this.client, socketId, channel, presenceData);
    } catch (err) {
      this.logger.error('Pusher authentication failed', err as any);
      throw err;
    }
  }

  close(): void {
    this.client = null;
    this.publicConfig.enabled = false;
    this.logger.log('Pusher client closed');
  }
}
