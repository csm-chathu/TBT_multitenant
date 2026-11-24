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
  BaseApplicationDto,
  UpdateApplicationDto,
} from '../dto/application/application.dto';
import { ApplicationService } from 'src/services/application.service';
import { OrganizationService } from 'src/services/organization.service';
// Removed ApplicationWithOrganizationAttributes; using ApplicationAttributes instead
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ApplicationAttributes } from '../intertfaces/application.interface';

@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly organizationService: OrganizationService,
  ) {}

  // GET /applications/create - Get form data for application creation
  @Get('create')
  async getCreateFormData() {
    const organizations = await this.organizationService.findAll();

    return {
      organizations,
    };
  }

  // GET /applications/edit/:id - Get form data + selected application data for editing
  @Get('edit/:id')
  async getEditFormData(
    @Param('id', ParseIntPipe) id: number,
  ) {
    const [organizations, application] = await Promise.all([
      this.organizationService.findAll(),
      this.applicationService.findOne(id),
    ]);

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return {
      organizations,
      selectedApplication: application,
    };
  }

  @Get()
  async findAll(): Promise<ApplicationAttributes[]> {
    return this.applicationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<ApplicationAttributes> {
    const application = await this.applicationService.findOne(id);
    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }
    return application;
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createApplicationDto: BaseApplicationDto,
  ): Promise<ApplicationAttributes> {
    return this.applicationService.create(createApplicationDto);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateApplicationDto: UpdateApplicationDto,
  ): Promise<ApplicationAttributes> {
    return this.applicationService.update(id, updateApplicationDto);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    await this.applicationService.remove(id);
    return { deleted: true };
  }
}
