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
  NotFoundException,
  UseGuards,
} from '@nestjs/common'
import { BaseOrganizationDto, UpdateOrganizationDto } from '../dto/organization/organization.dto'
import { OrganizationAttributes } from 'src/intertfaces/organization.interface'
import { OrganizationService } from 'src/services/organization.service'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createOrganizationDto: BaseOrganizationDto,
  ): Promise<OrganizationAttributes> {
    return this.organizationService.create(createOrganizationDto)
  }

  @Get()
  async findAll(): Promise<OrganizationAttributes[]> {
    return this.organizationService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<OrganizationAttributes> {
    const organization = await this.organizationService.findOne(Number(id))
    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`)
    }
    return organization
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id') id: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<OrganizationAttributes> {
    return this.organizationService.update(Number(id), updateOrganizationDto)
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ deleted: boolean }> {
    await this.organizationService.remove(Number(id))
    return { deleted: true }
  }
}


