import { Injectable } from '@nestjs/common';
import { BaseInventoryItemCategoryDto, UpdateInventoryItemCategoryDto } from '../dto/inventory-item-category/inventory-item-category.dto';
import { InventoryItemCategory, InventoryItem } from '../models';
import { isForeignKeyConstraintError } from '../util/helper/error.helper';

@Injectable()
export class InventoryItemCategoryRepository {
  async findAll() {
    return await InventoryItemCategory.findAll();
  }

  async findOne(id: number) {
    return await InventoryItemCategory.findByPk(id);
  }

  async create(data: BaseInventoryItemCategoryDto) {
    return await InventoryItemCategory.create(data);
  }

  async update(id: number, data: UpdateInventoryItemCategoryDto) {
    const item = await this.findOne(id);
    if (!item) {
      throw new Error('InventoryItemCategory not found');
    }
    return await item.update(data);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) {
      throw new Error('InventoryItemCategory not found');
    }
    
    // Check if category is referenced by inventory items (via category_id)
    // Since FK constraints may not exist, we check manually first
    const inventoryItemCount = await InventoryItem.count({ 
      where: { category_id: id },
      paranoid: false // Include soft-deleted items in count
    });
    
    if (inventoryItemCount > 0) {
      // Category is referenced by inventory items, use soft delete
      return await item.destroy(); // Soft delete (paranoid mode)
    }
    
    // No references found, try hard delete
    try {
      // Try hard delete (force: true bypasses paranoid mode)
      return await item.destroy({ force: true });
    } catch (error: any) {
      // If foreign key constraint error occurs (in case constraints exist),
      // fall back to soft delete
      if (isForeignKeyConstraintError(error)) {
        return await item.destroy(); // Soft delete (paranoid mode)
      }
      // Re-throw other errors
      throw error;
    }
  }

  async findByName(name: string) {
    return await InventoryItemCategory.findAll({
      where: { name },
    });
  }

  async findByNameIncludingDeleted(name: string) {
    return await InventoryItemCategory.findAll({
      where: { name },
      paranoid: false, // Include soft-deleted records
    });
  }
}
