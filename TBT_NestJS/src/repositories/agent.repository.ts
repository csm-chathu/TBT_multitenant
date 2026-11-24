import { Injectable } from '@nestjs/common';
import { Agent, TeamAgent, Team, Role, User, UserRole, Country, State } from '../models';
import { BaseAgentDto, UpdateAgentDto } from '../dto/agent/agent.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AgentRepository {
  private generateUserHash(): string {
    const rand = Math.random().toString(36).slice(2, 10);
    const ts = Date.now().toString(36);
    return `usr_${ts}_${rand}`;
  }

  /**
   * Common query options for agent queries with relations
   * Extracted to avoid code duplication and improve maintainability
   */
  private getAgentQueryOptions() {
    return {
      attributes: {
        exclude: ['country_id', 'state_id'],
      },
      include: [
        {
          model: Country,
          attributes: ['id', 'name'],
        },
        {
          model: State,
          attributes: ['id', 'name'],
        },
        {
          model: TeamAgent,
          as: 'teamLinks',
          attributes: ['id', 'team_id', 'agent_id', 'role_id', 'data', 'remarks'],
          include: [
            {
              model: Team,
              attributes: ['id', 'name'],
            },
            {
              model: Role,
              attributes: ['id', 'name', 'label'],
            },
          ],
        },
      ],
    };
  }

  async findAll() {
    return await Agent.findAll(this.getAgentQueryOptions());
  }

  async findOne(id: number) {
    return await Agent.findByPk(id, this.getAgentQueryOptions());
  }

  async create(data: BaseAgentDto) {
    // Start a transaction to ensure data consistency
    const transaction = await Agent.sequelize!.transaction();

    try {
      let user: User | null = null;

      // If user_id is provided, use that user
      if (data.user_id) {
        user = await User.findByPk(data.user_id, { transaction });
        if (!user) {
          throw new Error(`User with id ${data.user_id} not found`);
        }
      } else {
        // Check if user already exists with this email
        user = await User.findOne({ 
          where: { email: data.email },
          transaction 
        });

        if (!user) {
          // Generate user hash
          const userHash = this.generateUserHash();
          
          // Create user name from agent first_name and last_name
          const userName = `${data.first_name}${data.last_name ? ' ' + data.last_name : ''}`;
          
          // Generate username from email if not provided
          const username = data.email.split('@')[0];

          // Hash a default password for the new user
          const plainPassword = process.env.DEFAULT_USER_PASSWORD || 'Mditbt345$';
          const hashedPassword = await bcrypt.hash(plainPassword, 12);

          // Create user with agent details
          user = await User.create(
            {
              name: userName,
              email: data.email,
              mobile_number: data.mobile_number,
              username: username,
              status: data.status || 'inactive',
              hash: userHash,
              password: hashedPassword,
              emailStatus: 'unverified',
              phoneStatus: 'unverified',
              isPasswordSet: false,
            },
            { transaction },
          );
        }
      }

      // Find Agent role (label = 'AGENT' based on seeder)
      const agentRole = await Role.findOne({ 
        where: { label: 'AGENT' },
        transaction 
      });

      if (!agentRole) {
        throw new Error('Agent role not found in database. Please ensure roles are seeded.');
      }

      // Check if user_role entry already exists
      const existingUserRole = await UserRole.findOne({
        where: {
          user_id: user.id,
          role_id: agentRole.id,
        },
        transaction
      });

      // Create user_role entry to assign agent role if it doesn't exist
      if (!existingUserRole) {
        await UserRole.create({
          user_id: user.id,
          role_id: agentRole.id,
        }, { transaction });
      }

      // Create agent and link to user
      const agent = await Agent.create({
        ...data,
        user_id: user.id,
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      return agent;
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  }

  async update(id: number, data: UpdateAgentDto): Promise<Agent> {
    // Use findByPk without relations for better performance
    const agent = await Agent.findByPk(id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    await agent.update(data);
    // Return updated agent with relations if needed
    const updatedAgent = await this.findOne(id);
    if (!updatedAgent) {
      throw new Error('Agent not found after update');
    }
    return updatedAgent;
  }

  async remove(id: number, reason?: string) {
    const agent = await this.findOne(id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    // Prevent deleting agent if assigned to any teams
    const { TeamAgent } = require('../models') as any;
    const teamLink = await TeamAgent.findOne({ where: { agent_id: id } });
    if (teamLink) {
      throw new Error('Agent is assigned to one or more teams and cannot be deleted');
    }
    // Persist deleted reason on agent if provided
    if (reason) {
      try {
        await (agent as any).update({ deletedReason: reason });
      } catch (err) {
        // ignore update error and proceed
      }
    }

    // Attempt to soft-delete associated user if present
    try {
      const userId = (agent as any).user_id;
      if (userId) {
        const user = await User.findByPk(userId);
        if (user) {
          if (reason) {
            try {
              await (user as any).update({ deletedReason: reason });
            } catch (err) {
              // ignore
            }
          }
          await (user as any).destroy();
        }
      }
    } catch (err) {
      // ignore user deletion errors and proceed with agent deletion
    }

    await (agent as any).destroy();
    return agent;
  }
}
