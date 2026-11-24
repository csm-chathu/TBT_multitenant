import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { InventoryItemLocationAttributes } from 'src/intertfaces/inventory-item-location.interface';

export class BaseInventoryItemLocationDto
  implements InventoryItemLocationAttributes
{
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

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  hash?: string;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsNumber()
  country_id?: number;

  @IsOptional()
  @IsNumber()
  organization_id?: number;
}

export class UpdateInventoryItemLocationDto extends PartialType(
  PickType(BaseInventoryItemLocationDto, [
    'name',
    'label',
    'description',
    'remarks',
    'address',
    'hash',
    'data',
    'country_id',
    'organization_id',
  ] as const),
) {}
