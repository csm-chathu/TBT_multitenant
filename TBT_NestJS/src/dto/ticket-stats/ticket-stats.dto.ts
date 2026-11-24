import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { TicketStatsAttributes } from 'src/intertfaces/ticket-stats.interface';

export class BaseTicketStatsDto implements TicketStatsAttributes {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  role_user_id?: number;

  @IsOptional()
  @IsString()
  day_stats?: string;

  @IsOptional()
  @IsString()
  week_stats?: string;

  @IsOptional()
  @IsString()
  month_stats?: string;

  @IsOptional()
  @IsString()
  year_stats?: string;

  @IsOptional()
  @IsString()
  all_stats?: string;

  @IsOptional()
  @IsString()
  hash?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class UpdateTicketStatsDto extends PartialType(
  PickType(BaseTicketStatsDto, [
    'date',
    'type',
    'role_user_id',
    'day_stats',
    'week_stats',
    'month_stats',
    'year_stats',
    'all_stats',
    'hash',
    'remarks',
  ] as const),
) {}
