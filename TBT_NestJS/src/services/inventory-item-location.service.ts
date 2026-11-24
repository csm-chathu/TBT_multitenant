import { Injectable } from '@nestjs/common';
import { InventoryItemLocationRepository } from '../repositories/inventory-item-location.repository';
import { BaseInventoryItemLocationDto, UpdateInventoryItemLocationDto } from '../dto/inventory-item-location/inventory-item-location.dto';

@Injectable()
export class InventoryItemLocationService {
  constructor(private readonly inventoryItemLocationRepository: InventoryItemLocationRepository) {}

  async create(createInventoryItemLocationDto: BaseInventoryItemLocationDto) {
    return this.inventoryItemLocationRepository.create(createInventoryItemLocationDto);
  }

  async findAll() {
    return this.inventoryItemLocationRepository.findAll();
  }

  async findOne(id: number) {
    return this.inventoryItemLocationRepository.findOne(id);
  }

  async update(id: number, updateInventoryItemLocationDto: UpdateInventoryItemLocationDto) {
    return this.inventoryItemLocationRepository.update(id, updateInventoryItemLocationDto);
  }

  async remove(id: number) {
    return this.inventoryItemLocationRepository.remove(id);
  }
}
