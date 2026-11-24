import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mailgun from 'mailgun-js';
import * as fs from 'fs';
import * as path from 'path';

interface PasswordResetParams {
  to: string;
  fullName?: string | null;
  token: string;
  baseUrl?: string;
}

interface EmailConfig {
  fromEmail: string;
  fromName: string;
  baseUrl: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private mailgunClient: mailgun.Mailgun | null = null;
  private readonly templatesBasePath: string;

  constructor(private readonly configService: ConfigService) {
    this.templatesBasePath = this.resolveTemplatesPath();
    this.initializeMailgun();
  }

  /**
   * Resolves the templates directory path (works in both dev and production)
   */
  private resolveTemplatesPath(): string {
    const possiblePaths = [
      path.join(process.cwd(), 'src', 'views', 'email'),
      path.join(process.cwd(), 'dist', 'views', 'email'),
      path.join(__dirname, '..', 'views', 'email'),
      path.join(__dirname, '..', '..', 'views', 'email'),
    ];

    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        this.logger.log(`Using email templates from: ${possiblePath}`);
        return possiblePath;
      }
    }

    // Fallback to src path
    const fallbackPath = path.join(process.cwd(), 'src', 'views', 'email');
    this.logger.warn(`Templates directory not found, using fallback: ${fallbackPath}`);
    return fallbackPath;
  }

  private initializeMailgun() {
    const apiKey =
      this.configService.get<string>('MAILGUN_API_KEY') ||
      this.configService.get<string>('MAIL_SMTP_DOMAIN_SECRET');
    const domain =
      this.configService.get<string>('MAIL_SMTP_DOMAIN') ||
      this.configService.get<string>('MAILGUN_DOMAIN');

    if (!apiKey || !domain) {
      this.logger.warn(
        `Mailgun not configured. Missing ${!apiKey ? 'MAILGUN_API_KEY/MAIL_SMTP_DOMAIN_SECRET' : ''} ${!domain ? 'MAIL_SMTP_DOMAIN/MAILGUN_DOMAIN' : ''}`,
      );
      return;
    }

    // Mask API key for logging (show first 8 chars)
    const maskedKey = apiKey.length > 8 ? `${apiKey.substring(0, 8)}...` : '***';

    try {
      this.mailgunClient = mailgun({
        apiKey,
        domain,
      });
      this.logger.log(`Mailgun initialized for domain: ${domain}, API key: ${maskedKey}`);
    } catch (error: any) {
      this.logger.error(`Failed to initialize Mailgun: ${error.message}`, error.stack);
    }
  }

  /**
   * Renders an email template by replacing placeholders with actual values
   * Simple string replacement approach - template can be edited freely as HTML
   */
  private renderTemplate(templateName: string, data: Record<string, string>): string {
    try {
      const templatePath = path.join(this.templatesBasePath, `${templateName}.html`);

      if (!fs.existsSync(templatePath)) {
        this.logger.error(`Email template not found: ${templatePath}`);
        throw new Error(`Email template not found: ${templateName}`);
      }

      let templateContent = fs.readFileSync(templatePath, 'utf-8');

      // Simple placeholder replacement: {{variableName}} -> value
      Object.keys(data).forEach((key) => {
        const placeholder = `{{${key}}}`;
        const value = data[key] || '';
        templateContent = templateContent.replace(new RegExp(placeholder, 'g'), value);
      });

      return templateContent;
    } catch (error: any) {
      this.logger.error(`Failed to render email template ${templateName}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Gets email configuration from environment variables
   */
  private getEmailConfig(baseUrl?: string): EmailConfig {
    const fromEmail =
      this.configService.get<string>('FROM_EMAIL') ||
      this.configService.get<string>('SMTP_FROM') ||
      `noreply@${this.configService.get<string>('MAIL_SMTP_DOMAIN') || this.configService.get<string>('MAILGUN_DOMAIN') || 'tbt.local'}`;
    
    const fromName = this.configService.get<string>('FROM_NAME') || 'TBT Team';
    
    const resetBase =
      baseUrl ||
      this.configService.get<string>('APP_BASE_URL') ||
      this.configService.get<string>('BASE_URL') ||
      this.configService.get<string>('CORS_ORIGIN') ||
      '';

    return {
      fromEmail,
      fromName,
      baseUrl: resetBase,
    };
  }

  private get mailTo(): string {
    return this.configService.get<string>('MAIL_TO') ?? '';
  }

  async sendTicketCreated(ticket: any): Promise<void> {
    if (!this.mailgunClient || !this.mailTo) {
      this.logger.warn('Mailgun not configured or MAIL_TO missing — skipping ticket created email');
      return;
    }
    const { fromEmail, fromName } = this.getEmailConfig();
    const subject = `New Ticket #${ticket.id} – ${ticket.title ?? 'No Title'}`;
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#2563eb;border-bottom:2px solid #2563eb;padding-bottom:8px">New Ticket Submitted</h2>
        <table cellpadding="8" style="border-collapse:collapse;font-size:14px;width:100%">
          <tr style="background:#f1f5f9"><td style="width:140px"><b>Ticket ID</b></td><td>#${ticket.id}</td></tr>
          <tr><td><b>Title</b></td><td>${ticket.title ?? '—'}</td></tr>
          <tr style="background:#f1f5f9"><td><b>Priority</b></td><td>${ticket.priority ?? '—'}</td></tr>
          <tr><td><b>Status</b></td><td>${ticket.status ?? '—'}</td></tr>
          <tr style="background:#f1f5f9"><td><b>Customer</b></td><td>${ticket.customer_name ?? ticket.Customer?.name ?? '—'}</td></tr>
          <tr><td><b>Created</b></td><td>${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PST</td></tr>
        </table>
      </div>`;
    try {
      await this.mailgunClient.messages().send({ from: `${fromName} <${fromEmail}>`, to: this.mailTo, subject, html });
      this.logger.log(`Ticket created email sent for #${ticket.id}`);
    } catch (err: any) {
      this.logger.error(`Failed to send ticket created email: ${err.message}`);
    }
  }

  async sendTicketCreatedEmail(ticket: any, recipientEmail?: string): Promise<void> {
    const targetRecipient = recipientEmail || this.mailTo;
    if (!this.mailgunClient || !targetRecipient) {
      this.logger.warn('Mailgun not configured or recipient missing — skipping ticket created email');
      return;
    }
    const { fromEmail, fromName, baseUrl } = this.getEmailConfig();
    const priority = ticket.priority ?? 'Low';
    const { bg, color } = this.priorityStyle(priority);
    const description = ticket.body ?? ticket.description ?? '';
    const descriptionBlock = description
      ? `<div style="margin-top:20px;padding:14px 16px;background:#f9fafb;border-left:3px solid #2563eb;border-radius:4px;font-size:14px;color:#374151;line-height:1.6;"><strong style="display:block;margin-bottom:4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Description</strong>${description}</div>`
      : '';
    const viewUrl = baseUrl
      ? `${baseUrl.replace(/\/$/, '')}/dashboard/tickets/details/${ticket.hash ?? ticket.id}`
      : '#';

    const html = this.renderTemplate('ticket-created', {
      ticketId: String(ticket.id ?? '—'),
      title: ticket.title ?? '—',
      priority,
      priorityBg: bg,
      priorityColor: color,
      status: ticket.status ?? 'Open',
      customerName: ticket.customer_name ?? ticket.Customer?.name ?? '—',
      phone: ticket.Customer?.mobile_number ?? ticket.Customer?.phone_number ?? '—',
      createdAt:
        new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' PST',
      descriptionBlock,
      viewUrl,
    });

    try {
      await this.mailgunClient.messages().send({
        from: `${fromName} <${fromEmail}>`,
        to: targetRecipient,
        subject: `New Ticket #${ticket.id} – ${ticket.title ?? 'No Title'}`,
        html,
      });
      this.logger.log(`Ticket created email sent for #${ticket.id} to ${targetRecipient}`);
    } catch (err: any) {
      this.logger.error(`Failed to send ticket created email: ${err.message}`);
    }
  }

  private priorityStyle(priority: string): { bg: string; color: string } {
    switch ((priority || '').toLowerCase()) {
      case 'critical':
        return { bg: '#fee2e2', color: '#991b1b' };
      case 'high':
        return { bg: '#fef3c7', color: '#92400e' };
      case 'medium':
        return { bg: '#dbeafe', color: '#1e40af' };
      default:
        return { bg: '#f0fdf4', color: '#166534' };
    }
  }

  async sendTicketClosed(ticket: any): Promise<void> {
    if (!this.mailgunClient || !this.mailTo) {
      this.logger.warn('Mailgun not configured or MAIL_TO missing — skipping ticket closed email');
      return;
    }
    const { fromEmail, fromName, baseUrl } = this.getEmailConfig();
    const priority = ticket.priority ?? 'Low';
    const { bg, color } = this.priorityStyle(priority);
    const agentName = ticket.Agent?.name ?? ticket.agent_name ?? '—';
    const viewUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/dashboard/tickets/details/${ticket.hash ?? ticket.id}` : '#';

    const html = this.renderTemplate('ticket-closed', {
      ticketId: String(ticket.id ?? '—'),
      title: ticket.title ?? '—',
      priority,
      priorityBg: bg,
      priorityColor: color,
      customerName: ticket.customer_name ?? ticket.Customer?.name ?? '—',
      agentName,
      closedAt: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' PST',
      viewUrl,
    });

    try {
      await this.mailgunClient.messages().send({
        from: `${fromName} <${fromEmail}>`,
        to: this.mailTo,
        subject: `Ticket #${ticket.id} Closed – ${ticket.title ?? 'No Title'}`,
        html,
      });
      this.logger.log(`Ticket closed email sent for #${ticket.id}`);
    } catch (err: any) {
      this.logger.error(`Failed to send ticket closed email: ${err.message}`);
    }
  }

  async sendTestEmail(opts: { to?: string; subject?: string; message?: string }): Promise<{ success: boolean; to: string; subject: string; detail?: string }> {
    const to = opts.to || this.mailTo;
    if (!to) throw new Error('No recipient: provide "to" or set MAIL_TO env var');

    if (!this.mailgunClient) {
      throw new Error('Mailgun not configured. Check MAILGUN_API_KEY and MAIL_SMTP_DOMAIN env vars.');
    }

    const { fromEmail, fromName, baseUrl } = this.getEmailConfig();
    const subject = opts.subject || 'TBT – New Ticket #42 (Template Test)';

    const priority = 'High';
    const { bg, color } = this.priorityStyle(priority);
    const description = opts.message || 'The customer reports the device screen goes blank immediately after the latest firmware update was applied. Issue started after the 2026-08-05 release.';
    const descriptionBlock = `<div style="margin-top:20px;padding:14px 16px;background:#f9fafb;border-left:3px solid #2563eb;border-radius:4px;font-size:14px;color:#374151;line-height:1.6;"><strong style="display:block;margin-bottom:4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Description</strong>${description}</div>`;
    const viewUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/dashboard/tickets/42` : '#';

    const html = this.renderTemplate('ticket-created', {
      ticketId: '42',
      title: 'Screen not turning on after update',
      priority,
      priorityBg: bg,
      priorityColor: color,
      status: 'Open',
      customerName: 'Jane Doe',
      phone: '+1 (555) 012-3456',
      createdAt: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) + ' PST',
      descriptionBlock,
      viewUrl,
    });

    try {
      const result = await this.mailgunClient.messages().send({ from: `${fromName} <${fromEmail}>`, to, subject, html });
      this.logger.log(`Test email sent to ${to} — ${result.id || result.message}`);
      return { success: true, to, subject, detail: result.id || result.message };
    } catch (err: any) {
      this.logger.error(`Test email failed: ${err.message}`);
      throw new Error(`Mailgun error: ${err.message}`);
    }
  }

  async sendPasswordResetEmail(params: PasswordResetParams): Promise<void> {
    if (!this.mailgunClient) {
      this.logger.warn('Mailgun client not initialized. Email will not be sent.');
      return;
    }

    const emailConfig = this.getEmailConfig(params.baseUrl);
    
    // Validate baseUrl is set
    if (!emailConfig.baseUrl || emailConfig.baseUrl.trim() === '') {
      this.logger.error(
        'APP_BASE_URL, BASE_URL, or CORS_ORIGIN environment variable is not set. Cannot generate reset password link.',
      );
      throw new Error('Base URL not configured. Please set APP_BASE_URL, BASE_URL, or CORS_ORIGIN environment variable.');
    }

    // Reset password URL format: /reset_password/{token}
    // Ensure baseUrl doesn't end with / and path doesn't start with /
    const baseUrl = emailConfig.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    const resetUrl = `${baseUrl}/reset_password/${params.token}`;
    const fullName = params.fullName || 'there';

    // Render email template with simple placeholder replacement
    const html = this.renderTemplate('forgot-password', {
      fullName,
      resetUrl,
    });

    const data = {
      from: `${emailConfig.fromName} <${emailConfig.fromEmail}>`,
      to: params.to,
      subject: 'Password reset instructions',
      html,
    };

    try {
      this.logger.log(`Attempting to send password reset email to: ${params.to} from: ${data.from}`);
      const result = await this.mailgunClient.messages().send(data);
      this.logger.log(`Password reset email sent successfully. MessageId: ${result.id || result.message}`);
    } catch (error: any) {
      const errorDetails = error?.response?.body || error?.message || 'Unknown error';
      this.logger.error(
        `Failed to send password reset email to ${params.to}: ${error.message}`,
      );
      this.logger.error(`Mailgun error details: ${JSON.stringify(errorDetails)}`);
      if (error.message === 'Forbidden') {
        this.logger.error(
          'Forbidden error usually means: 1) Invalid API key, 2) API key lacks domain permissions, or 3) Domain not verified. ' +
          'Note: MAIL_SMTP_DOMAIN_SECRET (SMTP password) is NOT the same as Mailgun API key. ' +
          'Get your API key from Mailgun Dashboard → Settings → API Keys → Private API key',
        );
      }
      throw error;
    }
  }
}
