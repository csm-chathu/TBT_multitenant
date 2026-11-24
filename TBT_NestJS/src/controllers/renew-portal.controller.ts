import {
  Body,
  Controller,
  Logger,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { TicketService } from '../services/ticket.service';
import { CreateRenewPortalTicketDto } from '../dto/ticket/renew-portal-ticket.dto';
import { RenewPortalAuthGuard } from '../guards/renew-portal-auth.guard';

@ApiTags('Renew Portal')
@ApiHeader({
  name: 'x-api-key',
  description: 'Private API Key for Renew Portal integration',
  required: true,
})
@UseGuards(RenewPortalAuthGuard)
@Controller(['renew-portal', 'renew'])
export class RenewPortalController {
  private readonly logger = new Logger(RenewPortalController.name);

  constructor(private readonly ticketService: TicketService) {}

  @Post(['', 'tickets', 'ticket'])
  @ApiOperation({ summary: 'Create ticket from Renew Portal webhook/form' })
  @ApiResponse({ status: 201, description: 'Ticket created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Missing or invalid private key' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  async createTicket(@Body() dto: CreateRenewPortalTicketDto) {
    this.logger.log(
      `Direct renew-portal endpoint received request from ${dto.adminEmail} for ${dto.firstName} ${dto.lastName}`,
    );
    return this.ticketService.createRenewPortalTicket(dto);
  }
}
