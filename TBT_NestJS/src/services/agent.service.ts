import { Injectable, NotFoundException } from '@nestjs/common';
import { AgentRepository } from '../repositories/agent.repository';
import { BaseAgentDto, UpdateAgentDto } from 'src/dto/agent/agent.dto';
import { TeamRepository } from 'src/repositories/team.repository';
import { TeamAgentRepository } from 'src/repositories/team-agent.repository';
import { AssignTeamToAgentDto } from 'src/dto/team-agent/team-agent.dto';

@Injectable()
export class AgentService {
  constructor(
    private readonly agentRepository: AgentRepository,
    private readonly teamRepository: TeamRepository,
    private readonly teamAgentRepository: TeamAgentRepository,
  ) {}

  async findAll() {
    return this.agentRepository.findAll();
  }

  async findOne(id: number) {
    return this.agentRepository.findOne(id);
  }

  async create(createAgentDto: BaseAgentDto) {
    return this.agentRepository.create(createAgentDto);
  }

  async update(id: number, updateAgentDto: UpdateAgentDto) {
    const agent = await this.agentRepository.findOne(id);
    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }
    const updatedAgent = await this.agentRepository.update(id, updateAgentDto);
    if (!updatedAgent) {
      throw new NotFoundException(`Agent with ID ${id} not found after update`);
    }
    return updatedAgent;
  }

  async remove(id: number, reason?: string) {
    const agent = await this.agentRepository.findOne(id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    return this.agentRepository.remove(id, reason);
  }

  async assignTeam(agentId: number, dto: AssignTeamToAgentDto) {
    const agent = await this.agentRepository.findOne(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    const team = await this.teamRepository.findOne(dto.team_id);
    if (!team) {
      throw new Error('Team not found');
    }

    // Upsert team-agent link (allow multiple teams per agent)
    const existing = await this.teamAgentRepository.findByAgentAndTeam(
      agentId,
      dto.team_id,
    );

    if (existing) {
      return this.teamAgentRepository.update(existing.id!, {
        role_id: dto.role_id || 2, // Default to AGENT role (id: 2) if not specified
        data: dto.data,
        remarks: dto.remarks,
      });
    }

    return this.teamAgentRepository.create({
      agent_id: agentId,
      team_id: dto.team_id,
      role_id: dto.role_id || 2, // Default to AGENT role (id: 2) if not specified
      data: dto.data,
      remarks: dto.remarks,
    });
  }
}
