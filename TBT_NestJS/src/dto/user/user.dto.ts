import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsBoolean, IsNumber } from 'class-validator';
import { UserAttributes } from 'src/intertfaces/user.interface';

export class BaseUserDto implements UserAttributes {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsOptional()
  @IsString()
  mobile_number?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: any;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsString()
  @IsNotEmpty()
  hash: string;

  @IsOptional()
  @IsString()
  remember_token?: string;

  @IsOptional()
  @IsString()
  emailStatus?: string;

  @IsOptional()
  @IsString()
  phoneStatus?: string;

  @IsOptional()
  @IsNumber()
  email_verified_at?: number;

  @IsOptional()
  @IsNumber()
  phone_verified_at?: number;

  @IsOptional()
  @IsString()
  passwordResetToken?: string;

  @IsOptional()
  @IsNumber()
  passwordResetTokenExpiresAt?: number;

  @IsOptional()
  @IsString()
  emailProofToken?: string;

  @IsOptional()
  @IsNumber()
  emailProofTokenExpiresAt?: number;

  @IsOptional()
  @IsString()
  phoneProofToken?: string;

  @IsOptional()
  @IsNumber()
  phoneProofTokenExpiresAt?: number;

  @IsOptional()
  @IsNumber()
  lastSeenAt?: number;

  @IsOptional()
  @IsBoolean()
  isPasswordSet?: boolean;

  @IsOptional()
  @IsString()
  tosAcceptedByIp?: string;
}

export class UpdateUserDto extends PartialType(
  OmitType(BaseUserDto, ['id'] as const),
) {}
