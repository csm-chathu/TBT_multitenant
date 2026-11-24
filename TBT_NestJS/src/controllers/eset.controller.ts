import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EsetAlertDto } from '../dto/eset/eset-alert.dto';
import { TicketService } from '../services/ticket.service';
import { BaseTicketDto } from '../dto/ticket/ticket.dto';

// ESET severity → ticket priority mapping
const SEVERITY_TO_PRIORITY: Record<string, string> = {
  fatal: 'Critical',
  critical: 'Critical',
  error: 'High',
  warning: 'Medium',
  information: 'Low',
  info: 'Low',
};

function mapPriority(severity?: string): string {
  if (!severity) return 'High';
  return SEVERITY_TO_PRIORITY[severity.toLowerCase()] ?? 'High';
}

function generateHash(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `eset_${ts}_${rand}`;
}

/**
 * Public webhook endpoint — no JWT guard.
 * Secured via a shared secret token: set ESET_WEBHOOK_SECRET in .env
 * and configure ESET PROTECT to send the same value in the
 * X-ESET-Token header (or as ?token= query param).
 *
 * Endpoint: POST /api/v1/eset/alert
 *
 * Required env vars:
 *   ESET_WEBHOOK_SECRET      — shared secret to authenticate ESET requests
 *   ESET_DEFAULT_APPLICATION_ID — application_id to assign new tickets to
 *   ESET_DEFAULT_AGENT_ID    — (optional) agent_id to auto-assign tickets
 */
@Controller('eset')
export class EsetController {
  private readonly logger = new Logger(EsetController.name);

  constructor(private readonly ticketService: TicketService) {}

  @Post('alert')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false }))
  async receiveAlert(
    @Body() alert: EsetAlertDto,
    @Headers('x-eset-token') headerToken?: string,
    @Headers('authorization') authHeader?: string,
  ): Promise<object> {
    // ── Authentication ──────────────────────────────────────────────────────
    const secret = process.env.ESET_WEBHOOK_SECRET;
    if (secret) {
      const bearerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : undefined;
      const provided = headerToken || bearerToken;
      if (!provided || provided !== secret) {
        this.logger.warn('ESET webhook rejected — invalid or missing token');
        throw new UnauthorizedException('Invalid webhook token');
      }
    } else {
      this.logger.warn('ESET_WEBHOOK_SECRET is not set — webhook is unprotected');
    }

    // ── Only process critical/error-level alerts ────────────────────────────
    const severity = (alert.severity || '').toLowerCase();
    const applicationId = parseInt(process.env.ESET_DEFAULT_APPLICATION_ID || '0', 10);

    if (!applicationId) {
      this.logger.error('ESET_DEFAULT_APPLICATION_ID is not configured. Cannot create ticket.');
      return { received: true, ticketCreated: false, reason: 'No application configured' };
    }

    // Skip low-severity events (Information) unless configured otherwise
    const skipLow = process.env.ESET_SKIP_LOW_SEVERITY !== 'false';
    if (skipLow && (severity === 'information' || severity === 'info')) {
      this.logger.log(`ESET alert skipped (low severity: ${severity})`);
      return { received: true, ticketCreated: false, reason: 'Low severity skipped' };
    }

    // ── Build ticket ────────────────────────────────────────────────────────
    const threatName = alert.threat_name || alert.event_type || 'Unknown Threat';
    const hostname = alert.hostname || alert.ipv4 || 'Unknown Device';
    const title = `[ESET] ${threatName} detected on ${hostname}`.substring(0, 200);

    const bodyLines = [
      `Event Type  : ${alert.event_type || 'N/A'}`,
      `Severity    : ${alert.severity || 'N/A'}`,
      `Threat Name : ${alert.threat_name || 'N/A'}`,
      `Threat Type : ${alert.threat_type || 'N/A'}`,
      `Hostname    : ${alert.hostname || 'N/A'}`,
      `IP Address  : ${alert.ipv4 || 'N/A'}`,
      `OS          : ${alert.os_name || 'N/A'}`,
      `User        : ${alert.username || 'N/A'}`,
      `Object      : ${alert.object_url || 'N/A'}`,
      `Action Taken: ${alert.action_taken || 'N/A'}`,
      `Scanner     : ${alert.scanner_id || 'N/A'}`,
      `Occurred    : ${alert.occured || new Date().toISOString()}`,
      `Group       : ${alert.group_name || 'N/A'}`,
    ];

    const agentId = process.env.ESET_DEFAULT_AGENT_ID
      ? parseInt(process.env.ESET_DEFAULT_AGENT_ID, 10)
      : undefined;

    const ticketDto: BaseTicketDto = {
      title,
      body: bodyLines.join('\n'),
      priority: mapPriority(alert.severity),
      status: 'Open',
      hash: generateHash(),
      application_id: applicationId,
      ticketType: 'eset_alert',
      data: JSON.stringify(alert),
      ...(agentId ? { agent_id: agentId } : {}),
    } as BaseTicketDto;

    try {
      const ticket = await this.ticketService.create(ticketDto);
      this.logger.log(`ESET alert → Ticket #${ticket.id} created (${alert.severity}: ${threatName})`);
      return { received: true, ticketCreated: true, ticketId: ticket.id };
    } catch (err: any) {
      this.logger.error(`Failed to create ticket from ESET alert: ${err?.message}`);
      return { received: true, ticketCreated: false, reason: err?.message };
    }
  }
}
