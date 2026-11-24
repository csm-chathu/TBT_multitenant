import { IsString, IsOptional, IsNumber } from 'class-validator';

export class ReceiveMessageDto {
  @IsOptional()
  @IsString()
  Body?: string;

  @IsString()
  From: string;

  @IsString()
  To: string;

  @IsOptional()
  @IsNumber()
  NumMedia?: number;

  // Twilio metadata fields
  @IsOptional()
  @IsString()
  MessageSid?: string;

  @IsOptional()
  @IsString()
  AccountSid?: string;

  @IsOptional()
  @IsString()
  ApiVersion?: string;

  @IsOptional()
  @IsNumber()
  NumSegments?: number;

  @IsOptional()
  @IsString()
  DateCreated?: string;

  @IsOptional()
  @IsString()
  DateSent?: string;

  // Dynamic media fields (MediaUrl0, MediaUrl1, etc.)
  [key: string]: string | number | undefined;
}
