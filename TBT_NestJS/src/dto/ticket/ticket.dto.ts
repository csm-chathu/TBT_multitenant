import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TicketAttributes } from 'src/intertfaces/ticket.interface';

export class BaseTicketDto implements TicketAttributes {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsNumber()
  init_message?: number;

  @IsOptional()
  @IsNumber()
  ticket_template_id?: number;

  @IsOptional()
  @IsNumber()
  device_id?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsString()
  @IsNotEmpty()
  priority: string;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsString()
  additinal_data?: string;

  @IsString()
  @IsNotEmpty()
  hash: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  serialNo?: string;

  // Optional mobile number sent by frontend to link/create customer
  @IsOptional()
  @IsString()
  mobile_number?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @IsOptional()
  @IsNumber()
  agent_id?: number;

  @IsNumber()
  @IsNotEmpty()
  application_id: number;

  @IsOptional()
  @IsNumber()
  alert_id?: number;

  @IsOptional()
  @IsString()
  ticketType?: string;

  @IsOptional()
  attachments?: string[];

  @IsOptional()
  @IsNumber()
  reporter_id?: number;

  @IsOptional()
  multiple_assignees?: number[];

  @IsOptional()
  action_types?: number[] | string[];
}

export class UpdateTicketDto extends PartialType(
  PickType(BaseTicketDto, [
    'title',
    'hash',
    'priority',
    'application_id',
    'status',
    'remarks',
    'body',
    'agent_id',
    'customer_id',
    'device_id',
    'action_types',
  ] as const),
) {}
