import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  BaseTicketHistoryDto,
  UpdateTicketHistoryDto,
} from '../dto/ticket-history/ticket-history.dto';
import { TicketHistoryService } from 'src/services/ticket-history.service';
import { TicketHistoryAttributes } from 'src/intertfaces/ticket-history.interface';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('ticket/history')
export class TicketHistoryController {
  constructor(private readonly ticketHistoryService: TicketHistoryService) {}

  @Get()
  async findAll(): Promise<TicketHistoryAttributes[]> {
    return this.ticketHistoryService.findAll();
  }

  // GET /ticket/history/by-ticket/:ticketId - Get all history entries for a specific ticket
  @Get('by-ticket/:ticketId')
  async findByTicket(
    @Param('ticketId', ParseIntPipe) ticketId: number,
  ): Promise<TicketHistoryAttributes[]> {
    return this.ticketHistoryService.findByTicket(ticketId);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TicketHistoryAttributes> {
    const ticketHistory = await this.ticketHistoryService.findOne(id);
    if (!ticketHistory) {
      throw new NotFoundException(`Ticket history with ID ${id} not found`);
    }
    return ticketHistory;
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createTicketHistoryDto: BaseTicketHistoryDto,
  ): Promise<TicketHistoryAttributes> {
    return this.ticketHistoryService.create(createTicketHistoryDto);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketHistoryDto: UpdateTicketHistoryDto,
  ): Promise<TicketHistoryAttributes> {
    return this.ticketHistoryService.update(id, updateTicketHistoryDto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    await this.ticketHistoryService.remove(id);
    return { deleted: true };
  }
}
