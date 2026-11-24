import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { MessageAttributes } from 'src/intertfaces/message.interface';

export class BaseMessageDto implements Partial<MessageAttributes> {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  message!: string;

  @IsOptional()
  @IsString()
  type?: string; // e.g., 'sms'

  @IsOptional()
  @IsString()
  direction?: string; // 'outgoing' | 'incoming'

  @IsOptional()
  @IsNumber()
  ticket_id?: number;

  @IsOptional()
  @IsNumber()
  customer_id?: number;

  @IsOptional()
  @IsNumber()
  application_id?: number;

  // If false, do not send SMS; only save to messages table
  @IsOptional()
  @IsBoolean()
  send?: boolean;
}
