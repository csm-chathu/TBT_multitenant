import { Injectable } from '@nestjs/common';
import { CustomerRepository } from '../repositories/customer.repository';
import { BaseCustomerDto, UpdateCustomerDto } from '../dto/customer/customer.dto';
import { Message } from '../models/message';
import { Ticket } from '../models';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  async create(createCustomerDto: BaseCustomerDto) {
    return this.customerRepository.create(createCustomerDto);
  }

  async findAll(page?: number, limit?: number, search?: string) {
    return this.customerRepository.findAll(page, limit, search);
  }

  async findOne(id: number) {
    const customer = await this.customerRepository.findOne(id);
    if (!customer) {
      return null;
    }

    // Transform the customer data to include country and state with names
    const customerData = customer.get({ plain: true }) as any;
    
    // Find first ticket for this customer
    const firstTicket = await Ticket.findOne({
      where: { customer_id: id },
      order: [['id', 'ASC']],
      attributes: ['id'],
    });

    const firstTicketId = firstTicket ? firstTicket.id : null;
    const custPadded = String(id).padStart(4, '0');
    const tktPadded = firstTicketId ? String(firstTicketId).padStart(5, '0') : '00000';
    const customerCode = `CUST-${custPadded}${tktPadded}`;

    // Extract country and state information
    const countryData = customerData.Country || null;
    const stateData = customerData.State || null;
    const { Country, State, country_id, state_id, ...restData } = customerData;
    
    return {
      ...restData,
      first_ticket_id: firstTicketId,
      customer_code: customerCode,
      country: countryData ? {
        id: countryData.id,
        name: countryData.name,
      } : country_id ? {
        id: country_id,
        name: null,
      } : null,
      state: stateData ? {
        id: stateData.id,
        name: stateData.name,
      } : state_id ? {
        id: state_id,
        name: null,
      } : null,
    };
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    return this.customerRepository.update(id, updateCustomerDto);
  }

  async remove(id: number, reason?: string) {
    return this.customerRepository.remove(id, reason);
  }

  async getSmsCount(customerId: number) {
    const [total, outbound, inbound] = await Promise.all([
      Message.count({ where: { customer_id: customerId } }),
      Message.count({ where: { customer_id: customerId, direction: 'outgoing' } }),
      Message.count({ where: { customer_id: customerId, direction: 'incoming' } }),
    ]);
    return { total, outbound, inbound };
  }
}
