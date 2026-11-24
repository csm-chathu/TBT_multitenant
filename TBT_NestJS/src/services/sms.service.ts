import { Injectable, Logger } from '@nestjs/common';
import { Twilio as TwilioClient } from 'twilio';

export interface SendSmsOptions {
  to: string;
  from?: string;
  message: string;
  prefix?: string;
  suffix?: string;
}

const BALANCE_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly accountSid?: string;
  private readonly authToken?: string;
  private readonly defaultFrom?: string;
  private readonly messagingServiceSid?: string;
  private readonly defaultPrefix?: string;
  private readonly defaultSuffix?: string;
  private client?: TwilioClient;

  private balanceCache: { balance: string; currency: string } | null = null;
  private balanceFetchedAt: number | null = null;

  constructor() {
    this.accountSid = process.env.SMS_GATEWAY_ACCESS_SID;
    this.authToken = process.env.SMS_GATEWAY_ACCESS_TOKEN;
  this.defaultFrom = process.env.SMS_FROM_NUMBER || process.env.TWILIO_FROM_NUMBER;
  this.messagingServiceSid = process.env.SMS_MESSAGING_SERVICE_SID;
  this.defaultPrefix = process.env.SMS_PREFIX;
  this.defaultSuffix = process.env.SMS_SUFFIX;

    if (this.accountSid && this.authToken) {
      this.client = new TwilioClient(this.accountSid, this.authToken);
      this.logger.log('Twilio client initialized');
    } else {
      this.logger.warn('Twilio credentials are not set. SMS sending is disabled.');
    }
  }

  private formatPhoneNumber(num: string): string {
    if (!num) return num;
    const digits = num.replace(/[+,' "()\-]/g, '');
    return `+${digits}`;
  }

  private buildMessage(message: string, prefix?: string, suffix?: string): string {
    const p = prefix ?? this.defaultPrefix;
    const s = suffix ?? this.defaultSuffix;
    // If no prefix/suffix configured, return the message as-is
    if (!p && !s) return message;
    return `${p ? p : ''}${message}${s ? s : ''}`;
  }

  async getBalance(): Promise<{ balance: string; currency: string; cachedAt?: number } | null> {
    if (!this.client) return null;

    const now = Date.now();
    if (this.balanceCache && this.balanceFetchedAt && now - this.balanceFetchedAt < BALANCE_TTL_MS) {
      return { ...this.balanceCache, cachedAt: this.balanceFetchedAt };
    }

    try {
      const bal = await this.client.balance.fetch();
      this.balanceCache = { balance: bal.balance, currency: bal.currency };
      this.balanceFetchedAt = now;
      this.logger.log('Twilio balance refreshed from API');
      return { ...this.balanceCache, cachedAt: this.balanceFetchedAt };
    } catch (err: any) {
      this.logger.error(`Failed to fetch Twilio balance: ${err?.message}`);
      // Return stale cache if available rather than nothing
      if (this.balanceCache) return { ...this.balanceCache, cachedAt: this.balanceFetchedAt! };
      return null;
    }
  }

  async sendSms(opts: SendSmsOptions): Promise<any> {
    if (!this.client) {
      this.logger.warn('SMS send attempted but Twilio client is not configured.');
      return { skipped: true, reason: 'Twilio not configured' };
    }

    const smsBody = this.buildMessage(opts.message, opts.prefix, opts.suffix);

    const to = this.formatPhoneNumber(opts.to);
    const from = (opts.from || this.defaultFrom || '').trim();
    const mssid = (this.messagingServiceSid || '').trim();

    if (!from && !mssid) {
      this.logger.error('No FROM number or Messaging Service SID configured. Set SMS_FROM_NUMBER or SMS_MESSAGING_SERVICE_SID.');
      return { skipped: true, reason: 'Missing FROM or Messaging Service SID' };
    }

    const createArgs: any = { body: smsBody, to };
    if (from) {
      createArgs.from = this.formatPhoneNumber(from);
    } else {
      createArgs.messagingServiceSid = mssid;
    }

    this.logger.log(`Sending SMS to ${to}`);
    this.logger.log(`SMS Message Content: ${smsBody}`);
    try {
      const res = await this.client!.messages.create(createArgs);

      // Build a safe, JSON-serializable subset (avoid circular refs from Twilio resource objects)
      const safeTwilio = {
        sid: (res as any)?.sid,
        status: (res as any)?.status,
        to: (res as any)?.to,
        from: (res as any)?.from,
        dateCreated: (res as any)?.dateCreated,
        dateUpdated: (res as any)?.dateUpdated,
        errorCode: (res as any)?.errorCode,
        errorMessage: (res as any)?.errorMessage,
        numSegments: (res as any)?.numSegments,
        price: (res as any)?.price,
        priceUnit: (res as any)?.priceUnit,
      };
      return { success: true, to, from, body: smsBody, twilio: safeTwilio };
    } catch (err: any) {
      this.logger.error(`Twilio send failed: ${err?.message || err}`);
      // propagate minimal error info
      throw err;
    }
  }
}
