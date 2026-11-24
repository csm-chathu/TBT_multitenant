import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  BaseInventoryItemBrandDto,
  UpdateInventoryItemBrandDto,
} from '../dto/inventory-item-brand/inventory-item-brand.dto';
import { InventoryItemBrandService } from 'src/services/inventory-item-brand.service';
import { InventoryItemBrandAttributes } from 'src/intertfaces/inventory-item-brand.interface';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inventory/brands')
export class InventoryItemBrandController {
  constructor(
    private readonly inventoryItemBrandService: InventoryItemBrandService,
  ) {}

  @Get()
  async findAll(): Promise<InventoryItemBrandAttributes[]> {
    return this.inventoryItemBrandService.findAll();
  }

  // GET /inventory/brands/edit/:id - Get selected brand data for editing
  @Get('edit/:id')
  async getEditFormData(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const brand = await this.inventoryItemBrandService.findOne(id);
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return {
      selectedBrand: brand,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InventoryItemBrandAttributes> {
    const brand = await this.inventoryItemBrandService.findOne(id);
    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }
    return brand;
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createInventoryItemBrandDto: BaseInventoryItemBrandDto,
  ): Promise<InventoryItemBrandAttributes> {
    return this.inventoryItemBrandService.create(createInventoryItemBrandDto);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInventoryItemBrandDto: UpdateInventoryItemBrandDto,
  ): Promise<InventoryItemBrandAttributes> {
    return this.inventoryItemBrandService.update(
      id,
      updateInventoryItemBrandDto,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    await this.inventoryItemBrandService.remove(id);
    return { deleted: true };
  }
}
