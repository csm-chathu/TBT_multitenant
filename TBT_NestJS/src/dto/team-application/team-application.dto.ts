import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { TeamApplicationAttributes } from 'src/intertfaces/team-application.interface';

export class BaseTeamApplicationDto implements TeamApplicationAttributes {
  @IsOptional()
  @IsNumber()
  id?: number;

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
  application_id?: number;
}

export class UpdateTeamApplicationDto extends PartialType(
  PickType(BaseTeamApplicationDto, [
    'data',
    'remarks',
    'team_id',
    'application_id',
  ] as const),
) {}
