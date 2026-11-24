import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { TeamAgentAttributes } from 'src/intertfaces/team-agent.interface';

export class BaseTeamAgentDto implements TeamAgentAttributes {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsNumber()
  role_id?: number;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsNumber()
  team_id?: number;

  @IsOptional()
  @IsNumber()
  agent_id?: number;
}

export class UpdateTeamAgentDto extends PartialType(
  PickType(BaseTeamAgentDto, ['role_id', 'data', 'remarks', 'team_id', 'agent_id'] as const),
) {}

export class AssignTeamToAgentDto {
  @IsNumber()
  team_id!: number;

  @IsOptional()
  @IsNumber()
  role_id?: number;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
