import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApplicationAttributes } from 'src/intertfaces/application.interface';

export class BaseApplicationDto implements ApplicationAttributes {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  service_email?: string;

  @IsOptional()
  @IsString()
  service_phone_number?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  hash?: string;

  @IsNumber()
  @IsNotEmpty()
  organization_id: number;
}

export class UpdateApplicationDto extends PartialType(
  PickType(BaseApplicationDto, ['organization_id'] as const),
) {}
