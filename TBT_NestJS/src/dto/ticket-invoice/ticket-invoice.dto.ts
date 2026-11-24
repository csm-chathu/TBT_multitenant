import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { TicketInvoiceItem } from '../../intertfaces/ticket-invoice.interface';

export class CreateTicketInvoiceDto {
  @IsNumber()
  ticket_id: number;

  @IsArray()
  @IsOptional()
  items?: TicketInvoiceItem[];

  @IsString()
  @IsOptional()
  extra_notes?: string;

  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @IsOptional()
  tax_rate?: number;

  @IsNumber()
  @IsOptional()
  tax_amount?: number;

  @IsNumber()
  @IsOptional()
  total?: number;

  @IsArray()
  @IsOptional()
  attachments?: any[];
}

export class UpdateTicketInvoiceDto {
  @IsArray()
  @IsOptional()
  items?: TicketInvoiceItem[];

  @IsString()
  @IsOptional()
  extra_notes?: string;

  @IsNumber()
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @IsOptional()
  tax_rate?: number;

  @IsNumber()
  @IsOptional()
  tax_amount?: number;

  @IsNumber()
  @IsOptional()
  total?: number;

  @IsArray()
  @IsOptional()
  attachments?: any[];
}
