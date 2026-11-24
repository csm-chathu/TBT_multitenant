import { Injectable } from '@nestjs/common'
import { Op } from 'sequelize'
import { TicketsResource } from '../models'
import { TicketsResourceAttributes } from 'src/intertfaces/tickets-resource.interface'

@Injectable()
export class TicketResourceRepository {
  async create(attrs: TicketsResourceAttributes): Promise<TicketsResourceAttributes> {
    const created = await TicketsResource.create(attrs as any)
    return (created.toJSON ? (created.toJSON() as TicketsResourceAttributes) : (created as unknown as TicketsResourceAttributes))
  }

  async findByTicketId(ticketId: number): Promise<TicketsResourceAttributes[]> {
    // Match legacy behavior: only return records where deletedAt is null/false/0
    const records = await TicketsResource.findAll({
      where: {
        ticket_id: ticketId,
        [Op.or]: [
          { deletedAt: null },
          { deletedAt: false },
          { deletedAt: 0 },
        ],
      },
    })
    return records.map((record: any) => (record.toJSON ? record.toJSON() : record)) as TicketsResourceAttributes[]
  }

  async findById(id: number): Promise<TicketsResourceAttributes | null> {
    const record = await TicketsResource.findOne({ where: { id } })
    if (!record) {
      return null
    }
    return record.toJSON ? (record.toJSON() as TicketsResourceAttributes) : (record as unknown as TicketsResourceAttributes)
  }

  async remove(id: number) {
    const resource = await TicketsResource.findOne({ where: { id } })
    if (!resource) {
      return null
    }
    resource.set('deletedAt', true)
    await resource.save()
    return resource
  }
}
