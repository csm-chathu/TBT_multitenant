import { Injectable } from '@nestjs/common';
import { BaseApplicationDto, UpdateApplicationDto } from '../dto/application/application.dto';
import { Application } from '../models/application';
import { Organization } from '../models/organization';

@Injectable()
export class ApplicationRepository {
  async findAll() {
    return await Application.findAll({
      attributes: { exclude: ['organization_id'] },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'email', 'status']
        }
      ]
    });
  }

  async findOne(id: number) {
    return await Application.findByPk(id, {
      attributes: { exclude: ['organization_id'] },
      include: [
        {
          model: Organization,
          as: 'organization',
          attributes: ['id', 'name', 'email', 'status']
        }
      ]
    });
  }

  async create(data: BaseApplicationDto) {
    return await Application.create(data);
  }

  async update(id: number, data: UpdateApplicationDto) {
    const application = await this.findOne(id);
    if (!application) {
      throw new Error('Application not found');
    }
    return await application.update(data); // This updates the existing application
  }

  async remove(id: number) {
    const application = await this.findOne(id);
    if (!application) {
      throw new Error('Application not found');
    }
    return await application.destroy(); // This deletes the application
  }
}
