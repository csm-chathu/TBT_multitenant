import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { InventoryItemAttributes } from 'src/intertfaces/inventory-item.interface';

export class BaseInventoryItemDto implements InventoryItemAttributes {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  user?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  ownership?: string;

  @IsOptional()
  @IsString()
  serialNo?: string;

  @IsOptional()
  @IsString()
  hash?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  purchasedAt?: string;

  @IsOptional()
  @IsString()
  data?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsNumber()
  category_id?: number;

  @IsOptional()
  @IsNumber()
  brand_id?: number;

  @IsOptional()
  @IsNumber()
  location_id?: number;

  @IsOptional()
  @IsNumber()
  user_id?: number;
}

export class UpdateInventoryItemDto extends PartialType(
  PickType(BaseInventoryItemDto, [
    'user',
    'name',
    'description',
    'condition',
    'ownership',
    'serialNo',
    'hash',
    'ipAddress',
    'purchasedAt',
    'data',
    'remarks',
    'category_id',
    'brand_id',
    'location_id',
    'user_id',
  ] as const),
) {}
