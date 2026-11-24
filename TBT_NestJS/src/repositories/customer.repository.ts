import { Injectable } from '@nestjs/common';
import { BaseCustomerDto, UpdateCustomerDto } from '../dto/customer/customer.dto';
import { Customer, Country, State, Role, User, UserRole, Ticket, sequelize } from '../models';
import { Op } from 'sequelize';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CustomerRepository {
  private async attachCustomerCodes(rows: Customer[]) {
    if (!rows || rows.length === 0) return [];
    const customerIds = rows.map((c) => c.id).filter(Boolean);

    const firstTicketMap = new Map<number, number>();
    if (customerIds.length > 0) {
      try {
        const firstTickets = await Ticket.findAll({
          attributes: [
            'customer_id',
            [sequelize.fn('MIN', sequelize.col('id')), 'first_ticket_id'],
          ],
          where: { customer_id: { [Op.in]: customerIds } },
          group: ['customer_id'],
          raw: true,
        });

        firstTickets.forEach((t: any) => {
          if (t.customer_id && t.first_ticket_id) {
            firstTicketMap.set(Number(t.customer_id), Number(t.first_ticket_id));
          }
        });
      } catch (err) {
        // Fallback silently if grouping fails
      }
    }

    return rows.map((c) => {
      const plain = typeof (c as any).get === 'function' ? (c as any).get({ plain: true }) : c;
      const firstTicketId = firstTicketMap.get(plain.id) || null;
      const custPadded = String(plain.id).padStart(4, '0');
      const tktPadded = firstTicketId ? String(firstTicketId).padStart(5, '0') : '00000';
      return {
        ...plain,
        first_ticket_id: firstTicketId,
        customer_code: `CUST-${custPadded}${tktPadded}`,
      };
    });
  }

  async create(createCustomerDto: BaseCustomerDto) {
    // Start a transaction to keep User, UserRole, and Customer in sync
    const transaction = await Customer.sequelize!.transaction();

    try {
      let user: User | null = null;

      // 1) If user_id is provided, use that user
      if (createCustomerDto.user_id) {
        user = await User.findByPk(createCustomerDto.user_id, { transaction });
        if (!user) {
          throw new Error(`User with id ${createCustomerDto.user_id} not found`);
        }
      } else {
        // 2) Try to find existing user by email
        user = await User.findOne({
          where: { email: createCustomerDto.email },
          transaction,
        });

        // Optional: also check by mobile_number if you want that uniqueness
        if (!user && createCustomerDto.mobile_number) {
          user = await User.findOne({
            where: { mobile_number: createCustomerDto.mobile_number },
            transaction,
          });
        }

        // 3) If no user exists, create a new one
        if (!user) {
          const fullName = `${createCustomerDto.first_name}${
            createCustomerDto.last_name ? ' ' + createCustomerDto.last_name : ''
          }`;
          const username =
            createCustomerDto.email?.split('@')[0] ||
            `cus_${Date.now().toString(36)}`;

          // Hash a default password for the new customer user
          const plainPassword =
            process.env.DEFAULT_USER_PASSWORD || 'Mditbt345$';
          const hashedPassword = await bcrypt.hash(plainPassword, 12);

          user = await User.create(
            {
              name: fullName,
              email: createCustomerDto.email,
              mobile_number: createCustomerDto.mobile_number,
              username,
              status: createCustomerDto.status || 'inactive',
              hash: createCustomerDto.hash,
              password: hashedPassword,
              emailStatus: 'unverified',
              phoneStatus: 'unverified',
              isPasswordSet: false,
            },
            { transaction },
          );
        }
      }

      // 4) Ensure CUSTOMER role exists
      const customerRole = await Role.findOne({
        where: { label: 'CUSTOMER' },
        transaction,
      });
      if (!customerRole) {
        throw new Error('Customer role not found in database. Please ensure roles are seeded.');
      }

      // 5) Link user to CUSTOMER role via user_role
      const existingUserRole = await UserRole.findOne({
        where: {
          user_id: user.id,
          role_id: customerRole.id,
        },
        transaction,
      });

      if (!existingUserRole) {
        await UserRole.create(
          {
            user_id: user.id,
            role_id: customerRole.id,
          },
          { transaction },
        );
      }

      // 6) Create customer linked to that user
      const customer = await Customer.create(
        {
          ...createCustomerDto,
          user_id: user.id,
        },
        { transaction },
      );

      await transaction.commit();
      return customer;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(page?: number, limit?: number, search?: string) {
    const where: any = {};
    if (search && search.trim().length >= 2) {
      const q = `%${search.trim()}%`;
      where[Op.or] = [
        { first_name: { [Op.like]: q } },
        { last_name: { [Op.like]: q } },
        { email: { [Op.like]: q } },
        { mobile_number: { [Op.like]: q } },
        { phone_number: { [Op.like]: q } },
      ];
    }

    if (page && limit) {
      const offset = (page - 1) * limit;
      const { rows, count } = await Customer.findAndCountAll({
        where,
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        paranoid: true,
      });
      const enriched = await this.attachCustomerCodes(rows);
      return { data: enriched, total: count, page, limit, totalPages: Math.ceil(count / limit) };
    }

    const rows = await Customer.findAll({ where, order: [['createdAt', 'DESC']], paranoid: true });
    const enriched = await this.attachCustomerCodes(rows);
    return { data: enriched, total: rows.length, page: 1, limit: rows.length, totalPages: 1 };
  }

  async findOne(id: number) {
    return await Customer.findByPk(id, {
      include: [
        {
          model: Country,
          attributes: ['id', 'name'],
        },
        {
          model: State,
          attributes: ['id', 'name'],
        },
      ],
    });
  }

  async findByMobileNumber(mobile: string) {
    return await Customer.findOne({ where: { mobile_number: mobile } });
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    if (!customer) throw new Error('Customer not found');
    return await customer.update(updateCustomerDto);
  }

  async remove(id: number, reason?: string) {
    const customer = await this.findOne(id);
    if (!customer) throw new Error('Customer not found');
    // Prevent deleting customer if they have tickets
    const { Ticket } = require('../models') as any;
    const existingTicket = await Ticket.findOne({ where: { customer_id: id } });
    if (existingTicket) {
      throw new Error('Customer has tickets and cannot be deleted');
    }

    if (reason) {
      try {
        await (customer as any).update({ deletedReason: reason });
      } catch (err) {
        // ignore update error and proceed to destroy
      }
    }
    await (customer as any).destroy();
    return customer;
  }
}
