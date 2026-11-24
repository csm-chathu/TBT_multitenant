import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseTicketDto, UpdateTicketDto } from '../dto/ticket/ticket.dto';
import { Ticket, Agent, Application, TicketTemplate, InventoryItem, Customer, InventoryItemLocation, Organization, TicketInvoice, sequelize } from '../models';
import { Op, WhereOptions } from 'sequelize';

@Injectable()
export class TicketRepository {
  /**
   * Builds where clause for ticket filtering
   * Extracted to avoid code duplication
   * 
   * Note: Status and priority values are validated by FilterTicketDto
   * before reaching this method, ensuring data integrity
   */
  private buildWhereClause(
    startDate?: string,
    endDate?: string,
    status?: string,
    priority?: string,
    agentId?: number,
    deviceId?: number,
    locationId?: number,
    actionType?: string,
    search?: string,
    customerId?: number,
  ): WhereOptions {
    const where: any = {};

    // Filter by date range if provided
    if (startDate || endDate) {
      where.createdAt = {};
      
      if (startDate) {
        // Start of the day for startDate
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          throw new Error(`Invalid startDate format: ${startDate}`);
        }
        start.setHours(0, 0, 0, 0);
        where.createdAt[Op.gte] = start;
      }
      
      if (endDate) {
        // End of the day for endDate
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          throw new Error(`Invalid endDate format: ${endDate}`);
        }
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    // Filter by exact status match (values are validated by DTO)
    if (status) {
      where.status = status;
    }

    // Filter by exact priority match (values are validated by DTO)
    if (priority) {
      where.priority = priority;
    }

    // Filter by assigned agent
    if (agentId) {
      where.agent_id = agentId;
    }

    // Filter by exact device ID
    if (deviceId) {
      where.device_id = deviceId;
    }

    // Filter by location ID
    if (locationId) {
      where[Op.or] = [
        { '$device.location_id$': locationId },
        { data: { [Op.like]: `%"location":"${locationId}"%` } },
        { data: { [Op.like]: `%"location":${locationId}%` } }
      ];
    }

    // Filter by action type ID (stored inside JSON array)
    if (actionType) {
      const actionTypeId = Number(actionType);
      if (!isNaN(actionTypeId)) {
        where.action_types_filter = sequelize.literal(`JSON_CONTAINS(action_types, '${actionTypeId}')`);
      }
    }

    // Full-text LIKE search — supports multiple space-separated keywords (AND logic)
    if (search && search.trim().length >= 2) {
      const keywords = search.trim().split(/\s+/).filter(w => w.length >= 2);
      const keywordConditions = keywords.map(word => {
        const q = `%${word}%`;
        const numericId = Number(word);
        const idCondition = !isNaN(numericId) ? [{ id: numericId }] : [];
        return {
          [Op.or]: [
            { title: { [Op.like]: q } },
            { body: { [Op.like]: q } },
            { '$Customer.first_name$': { [Op.like]: q } },
            { '$Customer.last_name$': { [Op.like]: q } },
            { '$Customer.mobile_number$': { [Op.like]: q } },
            { '$Customer.phone_number$': { [Op.like]: q } },
            { '$reporter.mobile_number$': { [Op.like]: q } },
            { '$reporter.phone_number$': { [Op.like]: q } },
            { '$device.location.name$': { [Op.like]: q } },
            sequelize.literal(`\`Ticket\`.\`id\` IN (SELECT \`ticket_id\` FROM \`ticket_comments\` WHERE \`comment\` LIKE ${sequelize.escape(q)})`),
            ...idCondition,
          ],
        };
      });
      where[Op.and] = [...(where[Op.and] ?? []), ...keywordConditions];
    }

    if (customerId) {
      where.customer_id = customerId;
    }

    return where;
  }

  private buildOrderClause(sortBy?: string, sortOrder?: string): any {
    const defaultOrder = [['createdAt', 'DESC']];
    if (!sortBy) {
      return defaultOrder;
    }

    const direction = (sortOrder?.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

    // Support nested sorting (e.g., 'device.name', 'agent.first_name')
    if (sortBy.includes('.')) {
      const parts = sortBy.split('.');
      if (parts.length === 2) {
        const [relation, field] = parts;
        let modelAlias: any = relation;

        if (relation.toLowerCase() === 'agent') {
          modelAlias = Agent;
        } else if (relation.toLowerCase() === 'device') {
          modelAlias = { model: InventoryItem, as: 'device' };
        } else if (relation.toLowerCase() === 'customer') {
          modelAlias = Customer;
        } else if (relation.toLowerCase() === 'reporter') {
          modelAlias = { model: Agent, as: 'reporter' };
        } else if (relation.toLowerCase() === 'application') {
          modelAlias = Application;
        } else if (relation.toLowerCase() === 'tickettemplate') {
          modelAlias = TicketTemplate;
        } else if (relation.toLowerCase() === 'organization') {
          modelAlias = [Application, { model: Organization, as: 'organization' }];
        }

        if (Array.isArray(modelAlias)) {
          return [[...modelAlias, field, direction]];
        }
        return [[modelAlias, field, direction]];
      }
    }

    // Direct attributes on Ticket
    if (Object.keys(Ticket.rawAttributes).includes(sortBy)) {
      return [[sortBy, direction]];
    }

    return defaultOrder;
  }

  async findAll(
    startDate?: string,
    endDate?: string,
    status?: string,
    priority?: string,
    agentId?: number,
    deviceId?: number,
    locationId?: number,
    page?: number,
    limit?: number,
    actionType?: string,
    sortBy?: string,
    sortOrder?: string,
    search?: string,
    userId?: number,
    isUnread?: boolean,
    customerId?: number,
  ) {
    const where = this.buildWhereClause(startDate, endDate, status, priority, agentId, deviceId, locationId, actionType, search, customerId);

    if (isUnread) {
      where[Op.and] = [
        ...(where[Op.and] ?? []),
        { read_at: { [Op.is]: null } },
      ];
    }

    const queryOptions: any = {
      where,
      subQuery: false,
      include: [
        { model: Agent, attributes: ['id', 'first_name', 'last_name', 'nickname'] },
        { 
          model: Application, 
          attributes: ['id', 'name'],
          include: [
            {
              model: Organization,
              as: 'organization',
              attributes: ['id', 'name']
            }
          ]
        },
        { model: TicketTemplate, attributes: ['id', 'name', 'label'] },
        { 
          model: InventoryItem, 
          as: 'device', 
          attributes: ['id', 'name', 'serialNo'],
          include: [
            {
              model: InventoryItemLocation,
              attributes: ['id', 'name'],
              as: 'location'
            }
          ]
        },
        { model: Customer, attributes: ['id', 'hash', 'first_name', 'last_name', 'mobile_number', 'phone_number', 'tag'] },
        { model: Agent, attributes: ['id', 'first_name', 'last_name', 'nickname', 'mobile_number', 'phone_number'], as: 'reporter' },
        { model: TicketInvoice, as: 'invoice' },
      ],
      order: this.buildOrderClause(sortBy, sortOrder),
    };

    if (page && limit) {
      queryOptions.limit = limit;
      queryOptions.offset = (page - 1) * limit;
      return await Ticket.findAndCountAll(queryOptions);
    }

    const tickets = await Ticket.findAll(queryOptions);
    return { rows: tickets, count: tickets.length };
  }

  async findAllEnriched(
    startDate?: string,
    endDate?: string,
    status?: string,
    priority?: string,
    agentId?: number,
    deviceId?: number,
    locationId?: number,
    page?: number,
    limit?: number,
    actionType?: string,
    sortBy?: string,
    sortOrder?: string,
  ) {
    const where = this.buildWhereClause(startDate, endDate, status, priority, agentId, deviceId, locationId, actionType);

    const queryOptions: any = {
      where,
      include: [
        { 
          model: Agent, 
          attributes: ['id', 'first_name', 'last_name', 'nickname']
        },
        { 
          model: Application, 
          attributes: ['id', 'name'],
          include: [
            {
              model: Organization,
              as: 'organization',
              attributes: ['id', 'name']
            }
          ]
        },
        { 
          model: TicketTemplate, 
          attributes: ['id', 'name', 'label']
        },
        { 
          model: InventoryItem, 
          as: 'device', 
          attributes: ['id', 'name', 'serialNo'],
          include: [
            {
              model: InventoryItemLocation,
              attributes: ['id', 'name'],
              as: 'location'
            }
          ]
        },
        {
          model: Customer,
          attributes: ['id', 'hash', 'first_name', 'last_name', 'mobile_number']
        },
        {
          model: Agent,
          attributes: ['id', 'first_name', 'last_name', 'nickname'],
          as: 'reporter'
        },
        { model: TicketInvoice, as: 'invoice' },
      ],
      order: this.buildOrderClause(sortBy, sortOrder),
    };

    if (page && limit) {
      queryOptions.limit = limit;
      queryOptions.offset = (page - 1) * limit;
      return await Ticket.findAndCountAll(queryOptions);
    }

    const tickets = await Ticket.findAll(queryOptions);
    return { rows: tickets, count: tickets.length };
  }

  async findOne(id: number) {
    return await Ticket.findByPk(id, {
      include: [
        { model: Agent, attributes: ['id', 'first_name', 'last_name', 'nickname'] },
        { 
          model: Application, 
          attributes: ['id', 'name'],
          include: [
            {
              model: Organization,
              as: 'organization',
              attributes: ['id', 'name']
            }
          ]
        },
        { model: TicketTemplate, attributes: ['id', 'name', 'label'] },
        { 
          model: InventoryItem, 
          as: 'device', 
          attributes: ['id', 'name', 'serialNo'],
          include: [
            {
              model: InventoryItemLocation,
              attributes: ['id', 'name'],
              as: 'location'
            }
          ]
        },
        { model: Customer, attributes: ['id', 'hash', 'first_name', 'last_name', 'mobile_number', 'phone_number', 'tag'] },
        { model: Agent, attributes: ['id', 'first_name', 'last_name', 'nickname', 'mobile_number', 'phone_number'], as: 'reporter' },
        { model: TicketInvoice, as: 'invoice' },
      ],
    });
  }

  async findOneByHash(hashOrCode: string) {
    if (!hashOrCode) return null;
    const clean = String(hashOrCode).trim();
    const isNumeric = !isNaN(Number(clean)) && Number(clean) > 0;

    const whereCondition: any = isNumeric
      ? { [Op.or]: [{ id: Number(clean) }, { hash: clean }] }
      : {
          [Op.or]: [
            { hash: clean },
            { hash: { [Op.like]: `%-${clean}` } },
            { hash: { [Op.like]: `%${clean}` } },
          ],
        };

    return await Ticket.findOne({
      where: whereCondition,
      include: [
        { model: Agent, attributes: ['id', 'first_name', 'last_name', 'nickname'] },
        {
          model: Application,
          attributes: ['id', 'name'],
          include: [{ model: Organization, as: 'organization', attributes: ['id', 'name'] }],
        },
        { model: TicketTemplate, attributes: ['id', 'name', 'label'] },
        {
          model: InventoryItem,
          as: 'device',
          attributes: ['id', 'name', 'serialNo'],
          include: [{ model: InventoryItemLocation, attributes: ['id', 'name'], as: 'location' }],
        },
        { model: Customer, attributes: ['id', 'hash', 'first_name', 'last_name', 'mobile_number', 'phone_number', 'tag'] },
        { model: Agent, attributes: ['id', 'first_name', 'last_name', 'nickname', 'mobile_number', 'phone_number'], as: 'reporter' },
        { model: TicketInvoice, as: 'invoice' },
      ],
    });
  }

  async findOneEnriched(id: number) {
    return await Ticket.findByPk(id, {
      include: [
        { 
          model: Agent, 
          attributes: ['id', 'first_name', 'last_name', 'nickname']
        },
        { 
          model: Application, 
          attributes: ['id', 'name'],
          include: [
            {
              model: Organization,
              as: 'organization',
              attributes: ['id', 'name']
            }
          ]
        },
        { 
          model: TicketTemplate, 
          attributes: ['id', 'name', 'label']
        },
        { 
          model: InventoryItem, 
          as: 'device', 
          attributes: ['id', 'name', 'serialNo'],
          include: [
            {
              model: InventoryItemLocation,
              attributes: ['id', 'name'],
              as: 'location'
            }
          ]
        },
        {
          model: Customer,
          attributes: ['id', 'hash', 'first_name', 'last_name', 'mobile_number']
        },
        {
          model: Agent,
          attributes: ['id', 'first_name', 'last_name', 'nickname'],
          as: 'reporter'
        },
        { model: TicketInvoice, as: 'invoice' },
      ],
    });
  }

  async create(data: BaseTicketDto) {
    return await Ticket.create(data);
  }

  async update(id: number, data: UpdateTicketDto) {
    const ticket = await this.findOne(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return await ticket.update(data); 
  }

  async getStatusCounts(
    startDate?: string,
    endDate?: string,
    agentId?: number,
  ): Promise<Array<{ status: string; priority: string; count: number }>> {
    const where = this.buildWhereClause(startDate, endDate, undefined, undefined, agentId);
    const rows = await Ticket.findAll({
      attributes: [
        'status',
        'priority',
        [sequelize.fn('COUNT', sequelize.col('Ticket.id')), 'count'],
      ],
      where,
      group: ['status', 'priority'],
      raw: true,
    }) as any[];
    return rows.map(r => ({
      status: r.status as string,
      priority: (r.priority as string) || 'low',
      count: Number(r.count),
    }));
  }

  async remove(id: number) {
    const ticket = await this.findOne(id);
    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }
    return await ticket.destroy(); 
  }
}
