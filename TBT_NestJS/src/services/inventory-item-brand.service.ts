import { Injectable } from '@nestjs/common';
import { BaseInventoryItemBrandDto, UpdateInventoryItemBrandDto } from '../dto/inventory-item-brand/inventory-item-brand.dto';
import { InventoryItemBrandRepository } from 'src/repositories/inventory-item-brand.repository';

@Injectable()
export class InventoryItemBrandService {
  constructor(private readonly inventoryItemBrandRepository: InventoryItemBrandRepository) {}

  async findAll() {
    return this.inventoryItemBrandRepository.findAll();
  }

  async findOne(id: number) {
    return this.inventoryItemBrandRepository.findOne(id);
  }

  async create(createInventoryItemBrandDto: BaseInventoryItemBrandDto) {
    return this.inventoryItemBrandRepository.create(createInventoryItemBrandDto);
  }

  async update(id: number, updateInventoryItemBrandDto: UpdateInventoryItemBrandDto) {
    const item = await this.inventoryItemBrandRepository.findOne(id);
    if (!item) {
      throw new Error('InventoryItemBrand not found');
    }
    return this.inventoryItemBrandRepository.update(id, updateInventoryItemBrandDto);
  }

  async remove(id: number) {
    const item = await this.inventoryItemBrandRepository.findOne(id);
    if (!item) {
      throw new Error('InventoryItemBrand not found');
    }
    return this.inventoryItemBrandRepository.remove(id);
  }
}
