import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { TicketActionType } from '../models';

@Controller('action-types')
export class ActionTypeController {
  @Get()
  async getActionTypes() {
    return await TicketActionType.findAll({
      order: [['name', 'ASC']],
    });
  }

  @Post()
  async createActionType(@Body() body: { name: string; application_id?: number }) {
    const name = body?.name?.trim();
    if (!name) {
      throw new BadRequestException('Action type name is required');
    }
    const [actionType] = await TicketActionType.findOrCreate({
      where: { name },
      defaults: { name, application_id: body.application_id },
    });
    return actionType;
  }
}
