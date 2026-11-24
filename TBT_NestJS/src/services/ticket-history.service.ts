import { Injectable } from '@nestjs/common';
import { TicketHistoryRepository } from '../repositories/ticket-history.repository';
import { BaseTicketHistoryDto, UpdateTicketHistoryDto } from '../dto/ticket-history/ticket-history.dto';

@Injectable()
export class TicketHistoryService {
  constructor(private readonly ticketHistoryRepository: TicketHistoryRepository) {}

  async findAll() {
    return this.ticketHistoryRepository.findAll();
  }

  async findByTicket(ticketId: number) {
    return this.ticketHistoryRepository.findByTicketId(ticketId);
  }

  async findOne(id: number) {
    return this.ticketHistoryRepository.findOne(id);
  }

  async create(createTicketHistoryDto: BaseTicketHistoryDto) {
    return this.ticketHistoryRepository.create(createTicketHistoryDto);
  }

  async update(id: number, updateTicketHistoryDto: UpdateTicketHistoryDto) {
    return this.ticketHistoryRepository.update(id, updateTicketHistoryDto);
  }

  async remove(id: number) {
    return this.ticketHistoryRepository.remove(id);
  }
}
