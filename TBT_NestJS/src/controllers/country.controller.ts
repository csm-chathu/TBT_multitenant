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
import { CountryService } from 'src/services/country.service'
import { BaseCountryDto, UpdateCountryDto } from 'src/dto/country/country.dto'
import { CountryAttributes } from 'src/intertfaces/country.inter'

@UseGuards(JwtAuthGuard)
@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  async findAll(): Promise<CountryAttributes[]> {
    return this.countryService.findAll()
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CountryAttributes> {
    const country = await this.countryService.findOne(id)
    if (!country) throw new NotFoundException(`Country with ID ${id} not found`)
    return country
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async create(@Body() dto: BaseCountryDto): Promise<CountryAttributes> {
    return this.countryService.create(dto)
  }

  @Put(':id')
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCountryDto,
  ): Promise<CountryAttributes> {
    return this.countryService.update(id, dto)
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ deleted: boolean }> {
    await this.countryService.remove(id)
    return { deleted: true }
  }
}





