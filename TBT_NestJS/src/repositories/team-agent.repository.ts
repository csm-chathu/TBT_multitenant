import { Injectable } from '@nestjs/common';
import { TeamAgent } from '../models/team_agent';
import { BaseTeamAgentDto, UpdateTeamAgentDto } from 'src/dto/team-agent/team-agent.dto';

@Injectable()
export class TeamAgentRepository {
  async findByAgentAndTeam(agentId: number, teamId: number) {
    return await TeamAgent.findOne({ where: { agent_id: agentId, team_id: teamId } });
  }

  async create(data: BaseTeamAgentDto) {
    return await TeamAgent.create(data as any);
  }

  async update(id: number, data: UpdateTeamAgentDto) {
    const record = await TeamAgent.findByPk(id);
    if (!record) {
      throw new Error('TeamAgent link not found');
    }
    return await record.update(data as any);
  }
}




