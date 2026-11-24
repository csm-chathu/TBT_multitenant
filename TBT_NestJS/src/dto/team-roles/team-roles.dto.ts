import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { TeamRolesAttributes } from 'src/intertfaces/team-roles.interface';

export class BaseTeamRoleDto implements TeamRolesAttributes {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateTeamRoleDto extends PartialType(
  PickType(BaseTeamRoleDto, ['name', 'label', 'data', 'remarks'] as const),
) {}
