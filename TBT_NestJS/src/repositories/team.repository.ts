import { Injectable } from '@nestjs/common';
import { BaseTeamDto } from '../dto/team/team.dto';
import { Team } from '../models/team';
import { UpdateTeamDto } from '../dto/team/team.dto';
import { Application } from '../models/application';
import { Agent } from '../models/agent';
import { Role } from '../models/role';
import { TeamAgent } from '../models/team_agent';
import { TeamApplication } from '../models/team_application';
import { TeamRoles } from '../models/team_roles';

@Injectable()
export class TeamRepository {
  async findAll() {
    return await Team.findAll({
      include: [
        {
          model: Application,
          attributes: ['id', 'name'],
        },
        {
          model: Agent,
          as: 'agents',
          attributes: ['id', 'first_name', 'last_name', 'nickname', 'email'],
          through: {
            attributes: ['role_id', 'data', 'remarks'], // Include through table attributes
          },
        },
        {
          model: Role,
          as: 'roles',
          through: {
            attributes: ['data', 'remarks'], // Include through table attributes
          },
        },
      ],
    });
  }

  async findOne(id: number) {
    return await Team.findByPk(id, {
      include: [
        {
          model: Application,
          attributes: ['id', 'name'],
        },
        {
          model: Agent,
          as: 'agents',
          through: {
            attributes: ['role_id', 'data', 'remarks'],
          },
        },
        {
          model: Role,
          as: 'roles',
          through: {
            attributes: ['data', 'remarks'],
          },
        },
      ],
    });
  }

  async create(data: BaseTeamDto) {
    return await Team.create(data);
  }

  async update(id: number, data: UpdateTeamDto) {
    const team = await this.findOne(id);
    if (!team) {
      throw new Error('Team not found');
    }
    return await team.update(data);
  }

  /**
   * Replace agents for a team. Removes existing assignments and adds the provided agents.
   * Keeps through table data (role_id, data, remarks) and updates user_role for team lead.
   */
  async updateAgentsForTeam(teamId: number, agents: Array<{ agent_id: number; role_id?: number; data?: string; remarks?: string }>, leaderAgentId?: number) {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Remove all existing team-agent associations for this team
    await TeamAgent.destroy({ where: { team_id: teamId } });

    // Re-add provided agents
    for (const a of agents || []) {
      const isLeader = leaderAgentId && a.agent_id === leaderAgentId;
      await this.addAgentToTeam(teamId, a.agent_id, {
        role_id: isLeader ? 1 : (a.role_id || 2),
        data: a.data,
        remarks: a.remarks,
      });
    }

    return await this.findOne(teamId);
  }

  async remove(id: number, reason?: string) {
    const team = await this.findOne(id);
    if (!team) {
      throw new Error('Team not found');
    }
    // Prevent deleting a team when it has agents assigned via TeamAgent
    const { TeamAgent } = require('../models') as any;
    const agentLink = await TeamAgent.findOne({ where: { team_id: id } });
    if (agentLink) {
      throw new Error('Team has assigned agents and cannot be deleted');
    }
    if (reason) {
      try {
        await (team as any).update({ deletedReason: reason });
      } catch (err) {
        // ignore update error and proceed to destroy
      }
    }
    await (team as any).destroy();
    return team;
  }

  // Advanced Many-to-Many methods based on Sequelize documentation

  /**
   * Add an agent to a team with additional through table data
   * Demonstrates the Super Many-to-Many relationship pattern
   */
  async addAgentToTeam(teamId: number, agentId: number, throughData: { role_id?: number; data?: string; remarks?: string }) {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    
    const agent = await Agent.findByPk(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    return await (team as any).addAgent(agent, { through: throughData });
  }

  /**
   * Add an application to a team with additional through table data
   */
  async addApplicationToTeam(teamId: number, applicationId: number, throughData: { data?: string; remarks?: string }) {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    
    const application = await Application.findByPk(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }

    return await (team as any).addApplication(application, { through: throughData });
  }

  /**
   * Add a role to a team with additional through table data
   */
  async addRoleToTeam(teamId: number, roleId: number, throughData: { data?: string; remarks?: string }) {
    const team = await Team.findByPk(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    
    const role = await Role.findByPk(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    return await (team as any).addRole(role, { through: throughData });
  }

  /**
   * Create a team with associated agents, applications, and roles in a single call
   * Demonstrates creating with associations as shown in the documentation
   */
  async createWithAssociations(teamData: BaseTeamDto, associations: {
    agents?: Array<{ agentId: number; through: { roles?: string; data?: string; remarks?: string } }>;
    applications?: Array<{ applicationId: number; through: { data?: string; remarks?: string } }>;
    roles?: Array<{ roleId: number; through: { data?: string; remarks?: string } }>;
  }) {
    const team = await Team.create(teamData);

    if (associations.agents) {
      for (const agentAssoc of associations.agents) {
        const agent = await Agent.findByPk(agentAssoc.agentId);
        if (agent) {
          await (team as any).addAgent(agent, { through: agentAssoc.through });
        }
      }
    }

    if (associations.applications) {
      for (const appAssoc of associations.applications) {
        const application = await Application.findByPk(appAssoc.applicationId);
        if (application) {
          await (team as any).addApplication(application, { through: appAssoc.through });
        }
      }
    }

    if (associations.roles) {
      for (const roleAssoc of associations.roles) {
        const role = await Role.findByPk(roleAssoc.roleId);
        if (role) {
          await (team as any).addRole(role, { through: roleAssoc.through });
        }
      }
    }

    return await this.findOne(team.id);
  }

  /**
   * Find teams by agent with through table filtering
   * Demonstrates advanced querying with through table conditions
   */
  async findTeamsByAgent(agentId: number, throughConditions?: { role_id?: number }) {
    const whereClause: any = { agent_id: agentId };
    if (throughConditions?.role_id) {
      whereClause.role_id = throughConditions.role_id;
    }

    return await Team.findAll({
      include: [
        {
          model: Agent,
          as: 'agents',
          where: { id: agentId },
          through: {
            where: throughConditions,
            attributes: ['role_id', 'data', 'remarks'],
          },
        },
      ],
    });
  }

  /**
   * Get team with nested associations (many-to-many-to-many pattern)
   * This demonstrates the advanced pattern from the documentation
   */
  async findTeamWithNestedAssociations(teamId: number) {
    return await Team.findByPk(teamId, {
      include: [
        {
          model: Agent,
          as: 'agents',
          through: {
            attributes: ['role_id', 'data', 'remarks'],
          },
          include: [
            {
              model: Role,
              as: 'roles', // Assuming Agent has roles relationship
              through: {
                attributes: [], // Hide unwanted nested object
              },
            },
          ],
        },
        {
          model: Application,
          as: 'applications',
          through: {
            attributes: ['data', 'remarks'],
          },
        },
        {
          model: Role,
          as: 'roles',
          through: {
            attributes: ['data', 'remarks'],
          },
        },
      ],
    });
  }
}
