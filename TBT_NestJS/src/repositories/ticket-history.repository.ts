import { Injectable } from '@nestjs/common';
import { BaseTicketHistoryDto, UpdateTicketHistoryDto } from '../dto/ticket-history/ticket-history.dto';
import { TicketHistory, User } from '../models';
import { TICKET_HISTORY_CONSTANTS } from '../util/constants/ticket-history.constants';

@Injectable()
export class TicketHistoryRepository {
  /**
   * Builds common query options for ticket history queries
   * Includes user information and excludes user_id field
   */
  private buildQueryOptions(additionalOptions: any = {}) {
    return {
      attributes: { exclude: [...TICKET_HISTORY_CONSTANTS.EXCLUDED_ATTRIBUTES] },
      include: [
        {
          model: User,
          as: 'user',
          attributes: [...TICKET_HISTORY_CONSTANTS.USER_ATTRIBUTES],
        },
      ],
      ...additionalOptions,
    };
  }

  async findAll() {
    return await TicketHistory.findAll(
      this.buildQueryOptions({
        order: [...TICKET_HISTORY_CONSTANTS.DEFAULT_ORDER],
      }),
    );
  }

  async findByTicketId(ticketId: number) {
    return await TicketHistory.findAll(
      this.buildQueryOptions({
        where: { ticket_id: ticketId },
        order: [...TICKET_HISTORY_CONSTANTS.DEFAULT_ORDER],
      }),
    );
  }

  async findOne(id: number) {
    return await TicketHistory.findByPk(id, this.buildQueryOptions());
  }

  async create(data: BaseTicketHistoryDto) {
    return await TicketHistory.create(data);
  }

  async update(id: number, data: UpdateTicketHistoryDto) {
    const ticketHistory = await this.findOne(id);
    if (!ticketHistory) {
      throw new Error(TICKET_HISTORY_CONSTANTS.ERRORS.NOT_FOUND);
    }
    return await ticketHistory.update(data);
  }

  async remove(id: number) {
    const ticketHistory = await this.findOne(id);
    if (!ticketHistory) {
      throw new Error(TICKET_HISTORY_CONSTANTS.ERRORS.NOT_FOUND);
    }
    return await ticketHistory.destroy();
  }
}
