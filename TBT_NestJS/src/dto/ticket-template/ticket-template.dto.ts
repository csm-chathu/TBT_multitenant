import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { TicketTemplateAttributes } from 'src/intertfaces/ticket-template.interface';

export class BaseTicketTemplateDto implements TicketTemplateAttributes {
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
  description?: string;
}

export class UpdateTicketTemplateDto extends PartialType(
  PickType(BaseTicketTemplateDto, ['name', 'label', 'description'] as const),
) {}
