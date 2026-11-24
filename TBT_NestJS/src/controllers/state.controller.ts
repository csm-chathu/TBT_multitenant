import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { StateService } from 'src/services/state.service'
import { BaseStateDto, UpdateStateDto } from 'src/dto/state/state.dto'
import { StateAttributes } from 'src/intertfaces/state.interface'
import { Query } from '@nestjs/common'

@UseGuards(JwtAuthGuard)
@Controller('states')
export class StateController {
  constructor(private readonly stateService: StateService) {}

  @Get()
  async findAll(@Query() query?: { countryId?: string; country_id?: string }): Promise<StateAttributes[]> {
    const raw = query?.country_id ?? query?.countryId
    const cId = raw ? parseInt(String(raw), 10) : undefined
    return this.stateService.findAll(cId)
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<StateAttributes> {
    const state = await this.stateService.findOne(id)
    if (!state) throw new NotFoundException(`State with ID ${id} not found`)
    return state
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() dto: BaseStateDto): Promise<StateAttributes> {
    return this.stateService.create(dto)
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStateDto,
  ): Promise<StateAttributes> {
    return this.stateService.update(id, dto)
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ deleted: boolean }> {
    await this.stateService.remove(id)
    return { deleted: true }
  }
}





