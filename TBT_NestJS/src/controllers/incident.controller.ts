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
import { BaseIncidentDto, UpdateIncidentDto } from '../dto/incident/incident.dto';
import { IncidentService } from 'src/services/incident.service';
import { IncidentAttributes } from 'src/intertfaces/incident.interface';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller()
export class IncidentController {
  constructor(private readonly incidentService: IncidentService) {}

  @Get('incidents')
  async findAll(): Promise<IncidentAttributes[]> {
    return this.incidentService.findAll();
  }

  @Get('incidents/:id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IncidentAttributes> {
    const incident = await this.incidentService.findOne(id);
    if (!incident) {
      throw new NotFoundException(`Incident with ID ${id} not found`);
    }
    return incident;
  }

  @Post('api/v1/incidents')
  @UsePipes(new ValidationPipe())
  async create(
    @Body() createIncidentDto: BaseIncidentDto,
  ): Promise<IncidentAttributes> {
    return this.incidentService.create(createIncidentDto);
  }

  @Put('api/v1/incidents/:id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIncidentDto: UpdateIncidentDto,
  ): Promise<IncidentAttributes> {
    return this.incidentService.update(id, updateIncidentDto);
  }

  @Delete('api/v1/incidents/:id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ deleted: boolean }> {
    await this.incidentService.remove(id);
    return { deleted: true };
  }
}




