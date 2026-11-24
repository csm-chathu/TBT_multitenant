import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { TicketCommentAttributes } from 'src/intertfaces/ticket-comment.interface';

export class BaseTicketCommentDto implements TicketCommentAttributes {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  resources?: string;

  @IsOptional()
  @IsNumber()
  ticket_id?: number;

  @IsOptional()
  @IsNumber()
  parent_id?: number;

  @IsOptional()
  @IsNumber()
  from?: number;

  @IsOptional()
  @IsNumber()
  to?: number;
}

export class UpdateTicketCommentDto extends PartialType(
  PickType(BaseTicketCommentDto, [
    'comment',
    'data',
    'remarks',
    'type',
    'resources',
    'ticket_id',
    'parent_id',
    'from',
    'to',
  ] as const),
) {}
