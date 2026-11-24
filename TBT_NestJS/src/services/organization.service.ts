import { Injectable } from '@nestjs/common'
import { OrganizationRepository } from '../repositories/organization.repository'
import { BaseOrganizationDto, UpdateOrganizationDto } from '../dto/organization/organization.dto'

@Injectable()
export class OrganizationService {
  constructor(private readonly organizationRepository: OrganizationRepository) {}

  async create(createOrganizationDto: BaseOrganizationDto) {
    return this.organizationRepository.create(createOrganizationDto)
  }

  async findAll() {
    return this.organizationRepository.findAll()
  }

  async findOne(id: number) {
    return this.organizationRepository.findOne(id)
  }

  async update(id: number, updateOrganizationDto: UpdateOrganizationDto) {
    return this.organizationRepository.update(id, updateOrganizationDto)
  }

  async remove(id: number) {
    return this.organizationRepository.remove(id)
  }
}



