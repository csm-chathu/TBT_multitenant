import { Injectable } from '@nestjs/common';
import { TicketComment, User } from '../models';
import { BaseTicketCommentDto } from '../dto/ticket-comment/ticket-comment.dto';

@Injectable()
export class TicketCommentRepository {
  async findByTicketId(ticketId: number) {
    return await TicketComment.findAll({
      where: { ticket_id: ticketId },
      include: [
        { model: User, as: 'FromUser', attributes: ['id', 'name', 'email', 'username'] },
        { model: User, as: 'ToUser', attributes: ['id', 'name', 'email', 'username'] },
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  async findById(id: number) {
    return await TicketComment.findByPk(id, {
      include: [
        { model: User, as: 'FromUser', attributes: ['id', 'name', 'email', 'username'] },
        { model: User, as: 'ToUser', attributes: ['id', 'name', 'email', 'username'] },
      ],
    });
  }

  async create(data: BaseTicketCommentDto) {
    const created = await TicketComment.create(data as any);
    return (await this.findById(created.id)) || created;
  }
}
