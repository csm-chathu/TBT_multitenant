import { Injectable, NotFoundException } from '@nestjs/common'
import { CountryRepository } from '../repositories/country.repository'
import { BaseCountryDto, UpdateCountryDto } from '../dto/country/country.dto'
import { CountryAttributes } from 'src/intertfaces/country.inter'

@Injectable()
export class CountryService {
  constructor(private readonly countryRepository: CountryRepository) {}

  async findAll(): Promise<CountryAttributes[]> {
    return this.countryRepository.findAll()
  }

  async findOne(id: number): Promise<CountryAttributes> {
    const country = await this.countryRepository.findOne(id)
    if (!country) throw new NotFoundException('Country not found')
    return country
  }

  async create(dto: BaseCountryDto): Promise<CountryAttributes> {
    return this.countryRepository.create(dto)
  }

  async update(id: number, dto: UpdateCountryDto): Promise<CountryAttributes> {
    return this.countryRepository.update(id, dto)
  }

  async remove(id: number): Promise<void> {
    await this.countryRepository.remove(id)
  }
}





