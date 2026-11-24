// agent.dto.ts
import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { AgentAttributes } from 'src/intertfaces/agent.interface';

// 1️⃣ Base DTO with validation
export class BaseAgentDto implements AgentAttributes {
  @IsOptional()
  id?: number;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  mobile_number?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  address_line1?: string;

  @IsOptional()
  @IsString()
  address_line2?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  hash: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsNumber()
  salutation_id?: number;

  @IsOptional()
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsNumber()
  country_id?: number;

  @IsOptional()
  @IsNumber()
  state_id?: number;
}

// 3️⃣ Update DTO (partial fields)
export class UpdateAgentDto extends PartialType(
  PickType(BaseAgentDto, ['first_name', 'email', 'hash', 'status'] as const),
) {}



// export class CreateCustomerDto {
//   first_name: string;
//   email: string;
//   hash: string;
//   status: string;
// }

// export class UpdateCustomerDto {
//   first_name?: string;
//   email?: string;
//   hash?: string;
//   status?: string;
// }
