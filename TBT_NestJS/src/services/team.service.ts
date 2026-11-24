import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { TeamRepository } from '../repositories/team.repository';
import { BaseTeamDto, UpdateTeamDto, CreateTeamWithAgentsDto } from '../dto/team/team.dto';
import type { ValidationErrorItem } from 'sequelize';
import { toPlainTeamWithLeader } from '../util/helper/team.helper';
import { TeamAttributes } from '../intertfaces/team.interface';

@Injectable()
export class TeamService {
  constructor(private readonly teamRepository: TeamRepository) {}

  async findAll(): Promise<TeamAttributes[]> {
    const teams = await this.teamRepository.findAll();
    // Repository should always return an array, but ensure it's an array
    const teamsArray = Array.isArray(teams) ? teams : (teams ? [teams] : []);
    return teamsArray.map(team => toPlainTeamWithLeader(team));
  }

  async findOne(id: number): Promise<TeamAttributes | null> {
    const team = await this.teamRepository.findOne(id);
    return team ? toPlainTeamWithLeader(team) : null;
  }

  async create(createTeamDto: BaseTeamDto): Promise<TeamAttributes> {
    try {
      const team = await this.teamRepository.create(createTeamDto);
      if (!team) {
        throw new Error('Failed to create team');
      }
      
      // If application_id is provided, create entry in team_application table
      if (createTeamDto.application_id) {
        await this.teamRepository.addApplicationToTeam(team.id, createTeamDto.application_id, {});
      }
      
      // Return the team with all its associations
      const result = await this.teamRepository.findOne(team.id);
      if (!result) {
        throw new Error('Failed to retrieve created team');
      }
      return toPlainTeamWithLeader(result);
    } catch (err: any) {
      // Map DB unique constraint errors to HTTP 409 with a clear message
      if (
        err?.name === 'SequelizeUniqueConstraintError' ||
        err?.original?.code === 'ER_DUP_ENTRY'
      ) {
        const field = (err?.errors?.[0] as ValidationErrorItem | undefined)?.path || Object.keys(err?.fields || {})[0] || 'unique field';
        throw new ConflictException(`Team with this ${field} already exists`);
      }
      throw err;
    }
  }

  async createWithAgents(createTeamDto: CreateTeamWithAgentsDto): Promise<TeamAttributes> {
    // Extract agents and leader from the DTO
    const { agents, leader_agent_id, application_id, ...teamData } = createTeamDto;
    
    // Create the team first
    let team;
    try {
      team = await this.teamRepository.create(createTeamDto);
    } catch (err: any) {
      if (
        err?.name === 'SequelizeUniqueConstraintError' ||
        err?.original?.code === 'ER_DUP_ENTRY'
      ) {
        const field = (err?.errors?.[0] as ValidationErrorItem | undefined)?.path || Object.keys(err?.fields || {})[0] || 'unique field';
        throw new ConflictException(`Team with this ${field} already exists`);
      }
      throw err;
    }
    
    if (!team) {
      throw new Error('Failed to create team');
    }
    
    // If application_id is provided, create entry in team_application table
    if (application_id) {
      await this.teamRepository.addApplicationToTeam(team.id, application_id, {});
    }
    
    // If agents are provided, assign them to the team
    if (agents && agents.length > 0) {
      for (const agentAssignment of agents) {
        const isLeader = leader_agent_id && agentAssignment.agent_id === leader_agent_id;
        await this.teamRepository.addAgentToTeam(
          team.id,
          agentAssignment.agent_id,
          {
            // Leader gets TEAM_LEAD (1), others default to AGENT (2) unless explicitly provided
            role_id: isLeader ? 1 : (agentAssignment.role_id || 2),
            data: agentAssignment.data,
            remarks: agentAssignment.remarks
          }
        );
      }
    }
    
    // Return the team with all its associations
    const result = await this.teamRepository.findOne(team.id);
    if (!result) {
      throw new Error('Failed to retrieve created team');
    }
    return toPlainTeamWithLeader(result);
  }

  async update(id: number, updateTeamDto: UpdateTeamDto | any): Promise<TeamAttributes> {
    // First update basic team fields
    const team = await this.teamRepository.update(id, updateTeamDto);
    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    // If agents array provided in DTO, replace team-agent associations
    const agents = updateTeamDto?.agents;
    const leaderAgentId = updateTeamDto?.leader_agent_id;
    if (Array.isArray(agents)) {
      await this.teamRepository.updateAgentsForTeam(id, agents, leaderAgentId);
    }

    // Return fresh team with associations
    const refreshed = await this.teamRepository.findOne(id);
    return toPlainTeamWithLeader(refreshed);
  }

  async remove(id: number, reason?: string) {
    return this.teamRepository.remove(id, reason);
  }
}
