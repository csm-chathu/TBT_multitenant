import { Injectable, NotFoundException } from '@nestjs/common'
import { StateRepository } from '../repositories/state.repository'
import { BaseStateDto, UpdateStateDto } from '../dto/state/state.dto'
import { StateAttributes } from 'src/intertfaces/state.interface'

@Injectable()
export class StateService {
  constructor(private readonly stateRepository: StateRepository) {}

  async findAll(countryId?: number): Promise<StateAttributes[]> {
    return this.stateRepository.findAll(countryId)
  }

  async findOne(id: number): Promise<StateAttributes> {
    const state = await this.stateRepository.findOne(id)
    if (!state) throw new NotFoundException('State not found')
    return state
  }

  async create(dto: BaseStateDto): Promise<StateAttributes> {
    return this.stateRepository.create(dto)
  }

  async update(id: number, dto: UpdateStateDto): Promise<StateAttributes> {
    return this.stateRepository.update(id, dto)
  }

  async remove(id: number): Promise<void> {
    await this.stateRepository.remove(id)
  }
}





