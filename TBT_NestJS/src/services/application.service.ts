import { Injectable } from '@nestjs/common';
import { ApplicationRepository } from '../repositories/application.repository';
import { BaseApplicationDto, UpdateApplicationDto } from '../dto/application/application.dto';
import { ApplicationAttributes } from '../intertfaces/application.interface';

@Injectable()
export class ApplicationService {
  constructor(private readonly applicationRepository: ApplicationRepository) {}

  async findAll(): Promise<ApplicationAttributes[]> {
    return this.applicationRepository.findAll();
  }

  async findOne(id: number): Promise<ApplicationAttributes | null> {
    return this.applicationRepository.findOne(id);
  }

  async create(createApplicationDto: BaseApplicationDto): Promise<ApplicationAttributes> {
    return this.applicationRepository.create(createApplicationDto);
  }

  async update(id: number, updateApplicationDto: UpdateApplicationDto): Promise<ApplicationAttributes> {
    const application = await this.applicationRepository.findOne(id);
    if (!application) {
      throw new Error('Application not found');
    }
    return this.applicationRepository.update(id, updateApplicationDto);
  }

  async remove(id: number) {
    const application = await this.applicationRepository.findOne(id);
    if (!application) {
      throw new Error('Application not found');
    }
    return this.applicationRepository.remove(id);
  }
}
