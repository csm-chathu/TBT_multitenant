import { Injectable } from '@nestjs/common';
import { Message, Ticket, Application, Customer } from '../models';
import { MessageAttributes } from 'src/intertfaces/message.interface';

@Injectable()
export class MessageRepository {
	async create(data: MessageAttributes) {
		return await Message.create(data as any);
	}

	async findByTicketId(ticketId: number) {
		const records = await Message.findAll({ 
			where: { ticket_id: ticketId },
			include: [
				{
					model: Customer,
					attributes: ['id', 'hash', 'first_name', 'last_name', 'tag'],
					required: false,
				},
				{
					model: Application,
					attributes: ['id', 'name'],
					required: false,
				},
			],
			order: [['createdAt', 'DESC']]
		});
		return records.map((record: any) => {
			const json = record.toJSON ? record.toJSON() : record;
			// Flatten customer and application data for easier access
			if (json.Customer) {
				json.customer_name = `${json.Customer.first_name || ''} ${json.Customer.last_name || ''}`.trim();
				json.customer_id = json.Customer.id;
			}
			if (json.Application) {
				json.application_name = json.Application.name;
				json.application_id = json.Application.id;
			}
			return json;
		});
	}

	async findOne(id: number) {
		return await Message.findByPk(id);
	}

	async findAllForCustomer(customerId: number) {
		return await Message.findAll({ where: { customer_id: customerId } });
	}

	async findAll(ticketId?: number) {
		const where: any = {};
		if (ticketId) {
			where.ticket_id = ticketId;
		}
		const records = await Message.findAll({ 
			where,
			include: [
				{
					model: Customer,
					attributes: ['id', 'hash', 'first_name', 'last_name', 'tag'],
					required: false,
				},
				{
					model: Application,
					attributes: ['id', 'name'],
					required: false,
				},
			],
			order: [['createdAt', 'DESC']] 
		});
		return records.map((record: any) => {
			const json = record.toJSON ? record.toJSON() : record;
			// Flatten customer and application data for easier access
			if (json.Customer) {
				json.customer_name = `${json.Customer.first_name || ''} ${json.Customer.last_name || ''}`.trim();
				json.customer_id = json.Customer.id;
			}
			if (json.Application) {
				json.application_name = json.Application.name;
				json.application_id = json.Application.id;
			}
			return json;
		});
	}

	async enrichTicket(ticketId: number) {
		return await Ticket.findByPk(ticketId, {
			include: [Application, Customer],
		});
	}
}
