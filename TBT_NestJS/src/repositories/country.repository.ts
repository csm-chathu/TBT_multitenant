import { Injectable } from '@nestjs/common'
import { BaseCountryDto, UpdateCountryDto } from '../dto/country/country.dto'
import { Country } from '../models/country'

@Injectable()
export class CountryRepository {
  async create(createCountryDto: BaseCountryDto) {
    return await Country.create(createCountryDto)
  }

  async findAll() {
    return await Country.findAll()
  }

  async findOne(id: number) {
    return await Country.findByPk(id)
  }

  async update(id: number, updateCountryDto: UpdateCountryDto) {
    const country = await this.findOne(id)
    if (!country) throw new Error('Country not found')
    return await country.update(updateCountryDto)
  }

  async remove(id: number) {
    const country = await this.findOne(id)
    if (!country) throw new Error('Country not found')
    return await country.destroy()
  }

  async findByName(name: string) {
    return await Country.findOne({ where: { name } })
  }
}





