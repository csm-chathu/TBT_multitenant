import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TicketHistoryAttributes } from 'src/intertfaces/ticket-history.interface';

export class BaseTicketHistoryDto implements TicketHistoryAttributes {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsString()
  user_data?: string;

  @IsOptional()
  @IsString()
  previous_data?: string;

  @IsOptional()
  @IsString()
  new_data?: string;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsNumber()
  @IsNotEmpty()
  ticket_id: number;

  @IsOptional()
  @IsNumber()
  role_id?: number;
}

export class UpdateTicketHistoryDto extends PartialType(
  PickType(BaseTicketHistoryDto, ['message', 'type', 'status', 'ticket_id'] as const),
) {}
