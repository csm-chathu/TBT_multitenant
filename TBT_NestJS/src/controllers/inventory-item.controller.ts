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
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  BaseInventoryItemDto,
  UpdateInventoryItemDto,
} from '../dto/inventory-item/inventory-item.dto';
import { CsvUploadResponseDto } from '../dto/inventory-item/csv-upload.dto';
import { InventoryItemService } from 'src/services/inventory-item.service';
import { InventoryCsvService } from 'src/services/inventory-csv.service';
import { InventoryItemCategoryService } from 'src/services/inventory-item-category.service';
import { InventoryItemBrandService } from 'src/services/inventory-item-brand.service';
import { InventoryItemLocationService } from 'src/services/inventory-item-location.service';
import { InventoryItemAttributes } from 'src/intertfaces/inventory-item.interface';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import {
  ensureDirSync,
  getUploadTempDir,
  isCsvFile,
  sanitizeFilename,
} from '../util/helper/upload.helper';
import { INVENTORY_CSV_TMP_SUBDIR } from '../util/constants/upload.constants';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryItemController {
  constructor(
    private readonly inventoryItemService: InventoryItemService,
    private readonly inventoryCsvService: InventoryCsvService,
    private readonly inventoryItemCategoryService: InventoryItemCategoryService,
    private readonly inventoryItemBrandService: InventoryItemBrandService,
    private readonly inventoryItemLocationService: InventoryItemLocationService,
  ) {}

  @Post('csv/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          try {
            const uploadDir = getUploadTempDir(INVENTORY_CSV_TMP_SUBDIR);
            ensureDirSync(uploadDir);
            cb(null, uploadDir);
          } catch (err) {
            // fallback to system tmp on error
            const fallback = getUploadTempDir();
            try {
              ensureDirSync(fallback);
            } catch (e) {
              // ignore secondary errors
            }
            cb(err as Error, fallback);
          }
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          const safeOriginal = sanitizeFilename(file.originalname || 'upload.csv');
          cb(null, `${unique}-${safeOriginal}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, cb) => {
        if (isCsvFile(file)) {
          cb(null, true);
        } else {
          cb(new Error('Only CSV files are allowed'), false);
        }
      },
    }),
  )
  async uploadCsv(
    @UploadedFile() file: Express.Multer.File,
    @Body('organization_id') organizationId?: number,
  ): Promise<CsvUploadResponseDto> {
    const orgId = organizationId ? Number(organizationId) : undefined;
    return this.inventoryCsvService.uploadCsv(file, orgId);
  }

  @Get('csv/sample')
  async downloadSample(@Res() res: Response) {
    const filePath = path.join(
      process.cwd(),
      'dist',
      'assets',
      'download',
      'inventory',
      'sample.csv',
    );

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Sample CSV not found');
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sample.csv"');
    return res.sendFile(filePath);
  }

  // GET /inventory/items/create - Get form data for inventory item creation
  @Get('items/create')
  async getCreateFormData() {
    const [categories, brands, locations] = await Promise.all([
      this.inventoryItemCategoryService.findAll(),
      this.inventoryItemBrandService.findAll(),
      this.inventoryItemLocationService.findAll(),
    ]);

    return {
      categories,
      ownership: [
        { value: 'owner', label: 'Owner' },
        { value: 'rent', label: 'Rent' },
      ],
      conditions: [
        { value: 'in use', label: 'In Use' },
        { value: 'Not in use', label: 'Not In Use' },
        { value: 'not working', label: 'Not Working' },
      ],
      brands,
      locations,
    };
  }

  // GET /inventory/items/edit/:id - Get form data + selected item data for editing
  @Get('items/edit/:id')
  async getEditFormData(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const [categories, brands, locations, item] = await Promise.all([
      this.inventoryItemCategoryService.findAll(),
      this.inventoryItemBrandService.findAll(),
      this.inventoryItemLocationService.findAll(),
      this.inventoryItemService.findOne(id),
    ]);

    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return {
      categories,
      ownership: [
        { value: 'owner', label: 'Owner' },
        { value: 'rent', label: 'Rent' },
      ],
      conditions: [
        { value: 'in use', label: 'In Use' },
        { value: 'Not in use', label: 'Not In Use' },
        { value: 'not working', label: 'Not Working' },
      ],
      brands,
      locations,
      selectedItem: item,
    };
  }

  @Post('items')
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createInventoryItemDto: BaseInventoryItemDto,
  ): Promise<InventoryItemAttributes> {
    return this.inventoryItemService.create(createInventoryItemDto);
  }

  @Get('items')
  async findAll(): Promise<InventoryItemAttributes[]> {
    return this.inventoryItemService.findAll();
  }

  @Get('items/:id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InventoryItemAttributes> {
    const item = await this.inventoryItemService.findOne(id);
    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }
    return item;
  }

  @Put('items/:id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInventoryItemDto: UpdateInventoryItemDto,
  ): Promise<InventoryItemAttributes> {
    return this.inventoryItemService.update(id, updateInventoryItemDto);
  }

  @Delete('items/:id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    await this.inventoryItemService.remove(id);
    return { deleted: true };
  }
}
