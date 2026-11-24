import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from '../services/email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * POST /email/test
   * Body (all optional):
   *   { "to": "you@example.com", "subject": "Hello", "message": "Custom body text" }
   * Omit "to" to fall back to the MAIL_TO env var.
   */
  @Post('test')
  async test(
    @Body() body: { to?: string; subject?: string; message?: string },
  ) {
    return this.emailService.sendTestEmail(body);
  }
}
