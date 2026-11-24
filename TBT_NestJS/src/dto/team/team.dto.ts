import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { TeamAttributes } from 'src/intertfaces/team.interface';

export class AgentAssignmentDto {
  @IsNumber()
  @IsNotEmpty()
  agent_id: number;

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

export class BaseTeamDto implements TeamAttributes {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  address_line1?: string;

  @IsOptional()
  @IsString()
  address_line2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  hash: string;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsNumber()
  application_id?: number;
}

export class CreateTeamWithAgentsDto extends BaseTeamDto {
  @IsOptional()
  @IsNumber()
  leader_agent_id?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentAssignmentDto)
  agents?: AgentAssignmentDto[];
}

export class UpdateTeamDto extends PartialType(
  PickType(BaseTeamDto, ['name', 'email', 'hash', 'status'] as const),
) {}

// Extend UpdateTeamDto to allow updating agents and leader when updating a team
export class UpdateTeamWithAgentsDto extends UpdateTeamDto {
  @IsOptional()
  @IsNumber()
  leader_agent_id?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentAssignmentDto)
  agents?: AgentAssignmentDto[];
}
