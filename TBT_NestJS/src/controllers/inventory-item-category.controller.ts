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
  BaseInventoryItemCategoryDto,
  UpdateInventoryItemCategoryDto,
} from '../dto/inventory-item-category/inventory-item-category.dto';
import { InventoryItemCategoryService } from 'src/services/inventory-item-category.service';
import { InventoryItemCategoryAttributes } from 'src/intertfaces/inventory-item-category.interface';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inventory/categories')
export class InventoryItemCategoryController {
  constructor(
    private readonly inventoryItemCategoryService: InventoryItemCategoryService,
  ) {}

  @Get()
  async findAll(): Promise<InventoryItemCategoryAttributes[]> {
    return this.inventoryItemCategoryService.findAll();
  }

  // GET /inventory/categories/edit/:id - Get selected category data for editing
  @Get('edit/:id')
  async getEditFormData(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const category = await this.inventoryItemCategoryService.findOne(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return {
      selectedCategory: category,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InventoryItemCategoryAttributes> {
    const category = await this.inventoryItemCategoryService.findOne(id);
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createInventoryItemCategoryDto: BaseInventoryItemCategoryDto,
  ): Promise<InventoryItemCategoryAttributes> {
    return this.inventoryItemCategoryService.create(
      createInventoryItemCategoryDto,
    );
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInventoryItemCategoryDto: UpdateInventoryItemCategoryDto,
  ): Promise<InventoryItemCategoryAttributes> {
    return this.inventoryItemCategoryService.update(
      id,
      updateInventoryItemCategoryDto,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    await this.inventoryItemCategoryService.remove(id);
    return { deleted: true };
  }
}
