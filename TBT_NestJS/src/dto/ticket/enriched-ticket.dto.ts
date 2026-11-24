import { IsOptional, IsString, IsNumber, IsDateString, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketsResourceAttributes } from 'src/intertfaces/tickets-resource.interface';
import { TicketInvoiceAttributes } from 'src/intertfaces/ticket-invoice.interface';

export class OrganizationDto {
  @IsNumber()
  id: number;

  @IsString()
  name: string;
}

export class EnrichedTicketResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsString()
  priority: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  additinal_data?: string;

  @IsString()
  hash: string;

  @IsOptional()
  @IsString()
  serialNo?: string;

  @IsDateString()
  createdAt: string;

  @IsNumber()
  ticket_template_id: number;

  // Agent information
  @IsOptional()
  @IsString()
  agentFirst?: string;

  @IsOptional()
  @IsString()
  agentLast?: string;

  // Application information
  @IsOptional()
  @IsString()
  aplName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrganizationDto)
  organization?: OrganizationDto;

  // Customer information
  @IsOptional()
  @IsString()
  cusName?: string;

  @IsOptional()
  @IsString()
  cusLast?: string;

  @IsOptional()
  @IsString()
  mobile_number?: string;

  // Template information
  @IsOptional()
  @IsString()
  temName?: string;

  // Location information
  @IsOptional()
  @IsString()
  locationName?: string;

  // Device information
  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsNumber()
  deviceId?: number;

  // Reporter information
  @IsOptional()
  @IsString()
  reporterFname?: string;

  @IsOptional()
  @IsString()
  reporterLname?: string;

  @IsOptional()
  @IsNumber()
  reporterId?: number;

  @IsOptional()
  @IsString()
  reporterName?: string;

  // Attachments (file URLs)
  @IsOptional()
  attachments?: string[];

  // Resources uploaded and linked to the ticket
  @IsOptional()
  resources?: TicketsResourceAttributes[];

  // Action types
  @IsOptional()
  @IsArray()
  action_types?: Array<{ id: number; name: string } | string | number>;

  // Additional multiple assignees
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  multiple_assignees?: number[];

  // Invoice information
  @IsOptional()
  invoice?: TicketInvoiceAttributes;
}


