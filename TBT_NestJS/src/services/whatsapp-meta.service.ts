import { Injectable, Logger } from '@nestjs/common';

export interface SendWhatsAppOptions {
  to: string;            // Recipient's WhatsApp number (e.g. 94703871464)
  phoneNumberId: string; // Your WhatsApp Business phone number ID
  message: string;
}

@Injectable()
export class WhatsAppMetaService {
  private readonly logger = new Logger(WhatsAppMetaService.name);
  private readonly accessToken?: string;
  private readonly apiVersion: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';

    if (!this.accessToken) {
      this.logger.warn('WHATSAPP_ACCESS_TOKEN is not set. WhatsApp reply sending is disabled.');
    }
  }

  async sendTextMessage(opts: SendWhatsAppOptions): Promise<any> {
    if (!this.accessToken) {
      this.logger.warn('WhatsApp send attempted but access token is not configured.');
      return { skipped: true, reason: 'WhatsApp not configured' };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${opts.phoneNumberId}/messages`;

    const payload = {
      messaging_product: 'whatsapp',
      to: opts.to,
      type: 'text',
      text: { preview_url: false, body: opts.message },
    };

    this.logger.log(`Sending WhatsApp message to ${opts.to}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;

      if (!response.ok) {
        this.logger.error(`WhatsApp API error: ${JSON.stringify(data)}`);
        throw new Error(data?.error?.message || `WhatsApp API responded with ${response.status}`);
      }

      this.logger.log(`WhatsApp message sent. Message ID: ${data?.messages?.[0]?.id}`);
      return { success: true, to: opts.to, messageId: data?.messages?.[0]?.id, raw: data };
    } catch (err: any) {
      this.logger.error(`WhatsApp send failed: ${err?.message || err}`);
      throw err;
    }
  }

  /**
   * Fetch a media file URL from Meta Graph API using a media_id.
   * Returns the direct download URL (valid for ~5 minutes).
   */
  async getMediaUrl(mediaId: string): Promise<{ url: string; mimeType: string } | null> {
    if (!this.accessToken) return null;

    try {
      const res = await fetch(`https://graph.facebook.com/${this.apiVersion}/${mediaId}`, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!res.ok) return null;

      const data = await res.json() as any;
      return { url: data.url, mimeType: data.mime_type };
    } catch (err) {
      this.logger.warn(`Failed to fetch media URL for ${mediaId}: ${err}`);
      return null;
    }
  }

  /**
   * Download media bytes from a Meta-signed URL (requires Authorization header).
   */
  async downloadMedia(mediaUrl: string): Promise<Buffer | null> {
    if (!this.accessToken) return null;

    try {
      const res = await fetch(mediaUrl, {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });

      if (!res.ok) return null;

      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      this.logger.warn(`Failed to download WhatsApp media: ${err}`);
      return null;
    }
  }
}
