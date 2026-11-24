import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { InventoryItemCategoryAttributes } from 'src/intertfaces/inventory-item-category.interface';

export class BaseInventoryItemCategoryDto
  implements InventoryItemCategoryAttributes
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
  hash?: string;

  @IsOptional()
  @IsString()
  data?: string;
}

export class UpdateInventoryItemCategoryDto extends PartialType(
  PickType(BaseInventoryItemCategoryDto, [
    'name',
    'label',
    'description',
    'remarks',
    'hash',
    'data',
  ] as const),
) {}
