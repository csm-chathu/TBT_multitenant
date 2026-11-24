import { Injectable } from '@nestjs/common'
import { Organization } from '../models/organization'
import { BaseOrganizationDto, UpdateOrganizationDto } from '../dto/organization/organization.dto'

@Injectable()
export class OrganizationRepository {
  async create(createOrganizationDto: BaseOrganizationDto) {
    return await Organization.create(createOrganizationDto)
  }

  async findAll() {
    return await Organization.findAll()
  }

  async findOne(id: number) {
    return await Organization.findByPk(id)
  }

  async update(id: number, updateOrganizationDto: UpdateOrganizationDto) {
    const organization = await this.findOne(id)
    if (!organization) throw new Error('Organization not found')
    return await organization.update(updateOrganizationDto)
  }

  async remove(id: number) {
    const organization = await this.findOne(id)
    if (!organization) throw new Error('Organization not found')
    return await organization.destroy()
  }
}



