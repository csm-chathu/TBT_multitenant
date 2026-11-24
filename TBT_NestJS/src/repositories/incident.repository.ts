import { Injectable } from '@nestjs/common';
import { Incident } from '../models';
import { BaseIncidentDto, UpdateIncidentDto } from '../dto/incident/incident.dto';

@Injectable()
export class IncidentRepository {
  async findAll() {
    return await Incident.findAll();
  }

  async findOne(id: number) {
    return await Incident.findByPk(id);
  }

  async create(data: BaseIncidentDto) {
    return await Incident.create(data as any);
  }

  async update(id: number, data: UpdateIncidentDto) {
    const incident = await this.findOne(id);
    if (!incident) {
      throw new Error('Incident not found');
    }
    return await incident.update(data as any);
  }

  async remove(id: number) {
    const incident = await this.findOne(id);
    if (!incident) {
      throw new Error('Incident not found');
    }
    await incident.destroy();
    return { deleted: true };
  }
}




