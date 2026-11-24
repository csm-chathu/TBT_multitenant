import { Injectable } from '@nestjs/common';
import { BaseInventoryItemDto, UpdateInventoryItemDto } from '../dto/inventory-item/inventory-item.dto';
import { InventoryItem, InventoryItemBrand, InventoryItemCategory, InventoryItemLocation, Ticket } from '../models';
import { isForeignKeyConstraintError } from '../util/helper/error.helper';

@Injectable()
export class InventoryItemRepository {
  async create(createInventoryItemDto: BaseInventoryItemDto) {
    return await InventoryItem.create(createInventoryItemDto);
  }

  async findAll() {
    return await InventoryItem.findAll({
      include: [
        { 
          model: InventoryItemBrand, 
          attributes: ['id', 'name'],
          paranoid: false // Include soft-deleted brands so names remain visible
        },
        { 
          model: InventoryItemCategory, 
          attributes: ['id', 'name'],
          paranoid: false // Include soft-deleted categories so names remain visible
        },
        { 
          model: InventoryItemLocation, 
          as: 'location', 
          attributes: ['id', 'name'],
          paranoid: false // Include soft-deleted locations so names remain visible
        },
      ],
    });
  }

  async findOne(id: number) {
    return await InventoryItem.findByPk(id, {
      include: [
        { 
          model: InventoryItemBrand, 
          attributes: ['id', 'name'],
          paranoid: false // Include soft-deleted brands so names remain visible
        },
        { 
          model: InventoryItemCategory, 
          attributes: ['id', 'name'],
          paranoid: false // Include soft-deleted categories so names remain visible
        },
        { 
          model: InventoryItemLocation, 
          as: 'location', 
          attributes: ['id', 'name'],
          paranoid: false // Include soft-deleted locations so names remain visible
        },
      ],
    });
  }

  async update(id: number, updateInventoryItemDto: UpdateInventoryItemDto) {
    const item = await this.findOne(id);
    if (!item) throw new Error('InventoryItem not found');
    return await item.update(updateInventoryItemDto);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    if (!item) throw new Error('InventoryItem not found');
    
    // Check if item is referenced by tickets (via device_id)
    // Since FK constraints may not exist, we check manually first
    const ticketCount = await Ticket.count({ 
      where: { device_id: id },
      paranoid: false // Include soft-deleted tickets in count
    });
    
    if (ticketCount > 0) {
      // Item is referenced by tickets, use soft delete
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

  async findBySerialNo(serialNo: string) {
    return await InventoryItem.findAll({
      where: { serialNo },
    });
  }
}
