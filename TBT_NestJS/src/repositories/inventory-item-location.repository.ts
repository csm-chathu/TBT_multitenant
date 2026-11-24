import { Injectable } from '@nestjs/common';
import { BaseInventoryItemLocationDto, UpdateInventoryItemLocationDto } from '../dto/inventory-item-location/inventory-item-location.dto';
import { InventoryItemLocation, Country, Organization, InventoryItem } from '../models';
import { isForeignKeyConstraintError } from '../util/helper/error.helper';

@Injectable()
export class InventoryItemLocationRepository {
  async create(createInventoryItemLocationDto: BaseInventoryItemLocationDto) {
    return await InventoryItemLocation.create(createInventoryItemLocationDto);
  }

  async findAll() {
    return await InventoryItemLocation.findAll({
      include: [
        { model: Country, attributes: ['id', 'name'] },
        { model: Organization, attributes: ['id', 'name'] },
      ],
    });
  }

  async findOne(id: number) {
    return await InventoryItemLocation.findByPk(id, {
      include: [
        { model: Country, attributes: ['id', 'name'] },
        { model: Organization, attributes: ['id', 'name'] },
      ],
    });
  }

  async update(id: number, updateInventoryItemLocationDto: UpdateInventoryItemLocationDto) {
    const location = await this.findOne(id);
    if (!location) {
      throw new Error('InventoryItemLocation not found');
    }
    return await location.update(updateInventoryItemLocationDto);
  }

  async remove(id: number) {
    const location = await this.findOne(id);
    if (!location) {
      throw new Error('InventoryItemLocation not found');
    }
    
    // Check if location is referenced by inventory items (via location_id)
    // Since FK constraints may not exist, we check manually first
    const inventoryItemCount = await InventoryItem.count({ 
      where: { location_id: id },
      paranoid: false // Include soft-deleted items in count
    });
    
    if (inventoryItemCount > 0) {
      // Location is referenced by inventory items, use soft delete
      return await location.destroy(); // Soft delete (paranoid mode)
    }
    
    // No references found, try hard delete
    try {
      // Try hard delete (force: true bypasses paranoid mode)
      return await location.destroy({ force: true });
    } catch (error: any) {
      // If foreign key constraint error occurs (in case constraints exist),
      // fall back to soft delete
      if (isForeignKeyConstraintError(error)) {
        return await location.destroy(); // Soft delete (paranoid mode)
      }
      // Re-throw other errors
      throw error;
    }
  }

  async findByNameAndCountry(name: string, countryId: number) {
    return await InventoryItemLocation.findOne({
      where: {
        name,
        country_id: countryId,
      },
      include: [
        { model: Country, attributes: ['id', 'name'] },
      ],
    });
  }

  async findByNameAndCountryIncludingDeleted(name: string, countryId: number) {
    return await InventoryItemLocation.findOne({
      where: {
        name,
        country_id: countryId,
      },
      include: [
        { model: Country, attributes: ['id', 'name'] },
      ],
      paranoid: false, // Include soft-deleted records
    });
  }
}
