import { Injectable } from '@nestjs/common';
import { BaseInventoryItemCategoryDto, UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/inventory-item-category.dto';
import { InventoryItemCategoryRepository } from 'src/repositories/inventory-item-category.repository';

@Injectable()
export class InventoryItemCategoryService {
  constructor(private readonly inventoryItemCategoryRepository: InventoryItemCategoryRepository) {}

  async findAll() {
    return this.inventoryItemCategoryRepository.findAll();
  }

  async findOne(id: number) {
    return this.inventoryItemCategoryRepository.findOne(id);
  }

  async create(createInventoryItemCategoryDto: BaseInventoryItemCategoryDto) {
    return this.inventoryItemCategoryRepository.create(createInventoryItemCategoryDto);
  }

  async update(id: number, updateInventoryItemCategoryDto: UpdateInventoryItemCategoryDto) {
    const item = await this.inventoryItemCategoryRepository.findOne(id);
    if (!item) {
      throw new Error('InventoryItemCategory not found');
    }
    return this.inventoryItemCategoryRepository.update(id, updateInventoryItemCategoryDto);
  }

  async remove(id: number) {
    const item = await this.inventoryItemCategoryRepository.findOne(id);
    if (!item) {
      throw new Error('InventoryItemCategory not found');
    }
    return this.inventoryItemCategoryRepository.remove(id);
  }
}
