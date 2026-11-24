import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTicketWithFilesDto {
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
  @IsNumber()
  reporter_id?: number;

  @IsOptional()
  multiple_assignees?: number[];
}