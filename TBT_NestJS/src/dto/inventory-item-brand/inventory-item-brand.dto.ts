import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { InventoryItemBrandAttributes } from 'src/intertfaces/inventory-item-brand.interface';

export class BaseInventoryItemBrandDto implements InventoryItemBrandAttributes {
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
  hash?: string;

  @IsOptional()
  @IsString()
  data?: string;
}

export class UpdateInventoryItemBrandDto extends PartialType(
  PickType(BaseInventoryItemBrandDto, [
    'name',
    'label',
    'description',
    'remarks',
    'hash',
    'data',
  ] as const),
) {}
