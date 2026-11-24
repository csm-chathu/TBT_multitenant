import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePublicTicketDto {
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  customer_first_name: string;

  @IsOptional()
  @IsString()
  customer_last_name?: string;

  @IsEmail({}, { message: 'A valid email address is required' })
  @IsNotEmpty({ message: 'Email address is required' })
  customer_email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mobile number is required' })
  mobile_number: string;

  @IsString()
  @IsNotEmpty({ message: 'Ticket subject is required' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Issue description is required' })
  body: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Application selection is required' })
  @IsNotEmpty({ message: 'Application selection is required' })
  application_id: number;

  @IsOptional()
  @IsString()
  serialNo?: string;

  @IsOptional()
  @IsString()
  additional_data?: string;
}
