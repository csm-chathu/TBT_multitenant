import { Injectable } from '@nestjs/common';
import { IncidentRepository } from '../repositories/incident.repository';
import { BaseIncidentDto, UpdateIncidentDto } from '../dto/incident/incident.dto';

@Injectable()
export class IncidentService {
  constructor(private readonly incidentRepository: IncidentRepository) {}

  async findAll() {
    return this.incidentRepository.findAll();
  }

  async findOne(id: number) {
    return this.incidentRepository.findOne(id);
  }

  async create(createIncidentDto: BaseIncidentDto) {
    return this.incidentRepository.create(createIncidentDto);
  }

  async update(id: number, updateIncidentDto: UpdateIncidentDto) {
    return this.incidentRepository.update(id, updateIncidentDto);
  }

  async remove(id: number) {
    return this.incidentRepository.remove(id);
  }
}




