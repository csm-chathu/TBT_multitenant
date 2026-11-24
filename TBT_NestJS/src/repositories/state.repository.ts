import { Injectable } from '@nestjs/common'
import { BaseStateDto, UpdateStateDto } from '../dto/state/state.dto'
import { State } from '../models/state'

@Injectable()
export class StateRepository {
  async create(createStateDto: BaseStateDto) {
    return await State.create(createStateDto)
  }

  async findAll(countryId?: number) {
    const where = countryId ? { country_id: countryId } : undefined
    return await State.findAll({ where })
  }

  async findOne(id: number) {
    return await State.findByPk(id)
  }

  async update(id: number, updateStateDto: UpdateStateDto) {
    const state = await this.findOne(id)
    if (!state) throw new Error('State not found')
    return await state.update(updateStateDto)
  }

  async remove(id: number) {
    const state = await this.findOne(id)
    if (!state) throw new Error('State not found')
    return await state.destroy()
  }
}





