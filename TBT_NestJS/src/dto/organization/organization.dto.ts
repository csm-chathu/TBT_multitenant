import { PartialType, PickType } from '@nestjs/mapped-types'
import { IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { OrganizationAttributes } from 'src/intertfaces/organization.interface'

export class BaseOrganizationDto implements OrganizationAttributes {
  @IsOptional()
  @IsNumber()
  id?: number

  @IsString()
  @IsNotEmpty()
  name: string

  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsOptional()
  @IsString()
  phone_number?: string

  @IsOptional()
  @IsString()
  address_line1?: string

  @IsOptional()
  @IsString()
  address_line2?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsString()
  @IsNotEmpty()
  status: string

  @IsString()
  @IsNotEmpty()
  hash: string

  @IsOptional()
  @IsNumber()
  country_id?: number

  @IsOptional()
  @IsNumber()
  state_id?: number

  @IsOptional()
  @IsNumber()
  user_id?: number
}

export class UpdateOrganizationDto extends PartialType(
  PickType(BaseOrganizationDto, ['name', 'email', 'status', 'hash'] as const),
) {}



