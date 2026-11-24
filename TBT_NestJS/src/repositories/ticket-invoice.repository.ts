import { Injectable } from '@nestjs/common';
import { TicketInvoice } from '../models';
import { CreateTicketInvoiceDto, UpdateTicketInvoiceDto } from '../dto/ticket-invoice/ticket-invoice.dto';

@Injectable()
export class TicketInvoiceRepository {
  async findByTicketId(ticketId: number) {
    return await TicketInvoice.findOne({ where: { ticket_id: ticketId } });
  }

  async create(data: CreateTicketInvoiceDto) {
    return await TicketInvoice.create(data as any);
  }

  async update(id: number, data: UpdateTicketInvoiceDto) {
    return await TicketInvoice.update(data as any, { where: { id } });
  }

  async delete(id: number) {
    return await TicketInvoice.destroy({ where: { id } });
  }
}
