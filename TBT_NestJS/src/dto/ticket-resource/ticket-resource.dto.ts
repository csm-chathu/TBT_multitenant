import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TicketsResourceAttributes } from 'src/intertfaces/tickets-resource.interface';

export class BaseTicketResourceDto implements TicketsResourceAttributes {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  @IsNotEmpty()
  file_mime_type: string;

  @IsString()
  @IsNotEmpty()
  file_path: string;

  @IsOptional()
  @IsString()
  thumb_path?: string;

  @IsOptional()
  @IsString()
  data?: string;

  @IsString()
  @IsNotEmpty()
  hash: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  deletedAt?: boolean;

  @IsNumber()
  @IsNotEmpty()
  ticket_id: number;
}

export class UpdateTicketResourceDto extends PartialType(
  PickType(BaseTicketResourceDto, [
    'file_mime_type',
    'file_path',
    'hash',
    'ticket_id',
  ] as const),
) {}
