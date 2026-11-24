import { Injectable } from '@nestjs/common';
import { BaseInventoryItemBrandDto, UpdateInventoryItemBrandDto } from '../dto/inventory-item-brand/inventory-item-brand.dto';
import { InventoryItemBrand, InventoryItem } from '../models';
import { isForeignKeyConstraintError } from '../util/helper/error.helper';

@Injectable()
export class InventoryItemBrandRepository {
  async findAll() {
    return await InventoryItemBrand.findAll();
  }

  async findOne(id: number) {
    return await InventoryItemBrand.findByPk(id);
  }

  async create(data: BaseInventoryItemBrandDto) {
    return await InventoryItemBrand.create(data);
  }

  async update(id: number, data: UpdateInventoryItemBrandDto) {
    const item = await this.findOne(id);
    if (!item) {
      throw new Error('InventoryItemBrand not found');
    }
    return await item.update(data);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) {
      throw new Error('InventoryItemBrand not found');
    }
    
    // Check if brand is referenced by inventory items (via brand_id)
    // Since FK constraints may not exist, we check manually first
    const inventoryItemCount = await InventoryItem.count({ 
      where: { brand_id: id },
      paranoid: false // Include soft-deleted items in count
    });
    
    if (inventoryItemCount > 0) {
      // Brand is referenced by inventory items, use soft delete
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
    return await InventoryItemBrand.findAll({
      where: { name },
    });
  }

  async findByNameIncludingDeleted(name: string) {
    return await InventoryItemBrand.findAll({
      where: { name },
      paranoid: false, // Include soft-deleted records
    });
  }
}
