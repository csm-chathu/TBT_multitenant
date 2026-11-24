import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// Nested detail object from the actual Zendesk webhook payload
export class ZendeskTicketDetailDto {
  @IsOptional() id?: string | number;
  @IsOptional() subject?: string;
  @IsOptional() description?: string;
  @IsOptional() status?: string;
  @IsOptional() priority?: string;
  @IsOptional() tags?: string[];
  @IsOptional() requester_id?: string | number;
  @IsOptional() assignee_id?: string | number;
  @IsOptional() group_id?: string | number;
  @IsOptional() organization_id?: string | number;
  @IsOptional() updated_at?: string;
  @IsOptional() created_at?: string;
  @IsOptional() via?: any;
}

// Actual Zendesk webhook envelope
export class ZendeskWebhookPayloadDto {
  @IsOptional() account_id?: number;
  @IsOptional() detail?: ZendeskTicketDetailDto;
  @IsOptional() id?: string;
  @IsOptional() subject?: string;
  @IsOptional() time?: string;
  @IsOptional() type?: string;
  @IsOptional() event?: any;
  @IsOptional() zendesk_event_version?: string;
}

// Internal DTO used by TicketService.createZendeskTicket()
export class ZendeskRequesterDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
}

export class CreateZendeskTicketDto {
  @IsOptional() ticket_id?: string | number;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() priority?: string;
  @IsOptional() requester?: ZendeskRequesterDto;
  @IsOptional() @IsString() assignee?: string;
  @IsOptional() tags?: any;
  @IsOptional() @IsString() updated_at?: string;
}
