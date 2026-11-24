import { Injectable } from '@nestjs/common';
import { InventoryItemRepository } from '../repositories/inventory-item.repository';
import { BaseInventoryItemDto, UpdateInventoryItemDto } from '../dto/inventory-item/inventory-item.dto';

@Injectable()
export class InventoryItemService {
  constructor(private readonly inventoryItemRepository: InventoryItemRepository) {}

  async create(createInventoryItemDto: BaseInventoryItemDto) {
    return this.inventoryItemRepository.create(createInventoryItemDto);
  }

  async findAll() {
    return this.inventoryItemRepository.findAll();
  }

  async findOne(id: number) {
    return this.inventoryItemRepository.findOne(id);
  }

  async update(id: number, updateInventoryItemDto: UpdateInventoryItemDto) {
    return this.inventoryItemRepository.update(id, updateInventoryItemDto);
  }

  async remove(id: number) {
    return this.inventoryItemRepository.remove(id);
  }
}
