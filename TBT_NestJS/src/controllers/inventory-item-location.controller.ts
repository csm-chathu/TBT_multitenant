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
  BaseInventoryItemLocationDto,
  UpdateInventoryItemLocationDto,
} from '../dto/inventory-item-location/inventory-item-location.dto';
import { InventoryItemLocationService } from 'src/services/inventory-item-location.service';
import { CountryService } from 'src/services/country.service';
import { OrganizationService } from 'src/services/organization.service';
import { InventoryItemLocationAttributes } from 'src/intertfaces/inventory-item-location.interface';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('inventory/locations')
export class InventoryItemLocationController {
  constructor(
    private readonly inventoryItemLocationService: InventoryItemLocationService,
    private readonly countryService: CountryService,
    private readonly organizationService: OrganizationService,
  ) {}

  // GET /inventory/locations/create - Get form data for inventory location creation
  @Get('create')
  async getCreateFormData() {
    const [countries, organizations] = await Promise.all([
      this.countryService.findAll(),
      this.organizationService.findAll(),
    ]);

    return {
      countries,
      organizations,
    };
  }

  // GET /inventory/locations/edit/:id - Get form data + selected location data for editing
  @Get('edit/:id')
  async getEditFormData(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const [countries, organizations, location] = await Promise.all([
      this.countryService.findAll(),
      this.organizationService.findAll(),
      this.inventoryItemLocationService.findOne(id),
    ]);

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return {
      countries,
      organizations,
      selectedLocation: location,
    };
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createInventoryItemLocationDto: BaseInventoryItemLocationDto,
  ): Promise<InventoryItemLocationAttributes> {
    return this.inventoryItemLocationService.create(
      createInventoryItemLocationDto,
    );
  }

  @Get()
  async findAll(): Promise<InventoryItemLocationAttributes[]> {
    return this.inventoryItemLocationService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<InventoryItemLocationAttributes> {
    const location = await this.inventoryItemLocationService.findOne(id);
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateInventoryItemLocationDto: UpdateInventoryItemLocationDto,
  ): Promise<InventoryItemLocationAttributes> {
    return this.inventoryItemLocationService.update(
      id,
      updateInventoryItemLocationDto,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    await this.inventoryItemLocationService.remove(id);
    return { deleted: true };
  }
}
