import { PartialType } from '@nestjs/mapped-types'
import { IsNumber, IsOptional, IsString } from 'class-validator'
import { CountryAttributes } from 'src/intertfaces/country.inter'

export class BaseCountryDto implements CountryAttributes {
  @IsOptional()
  @IsNumber()
  id?: number

  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  label?: string
}

export class UpdateCountryDto extends PartialType(BaseCountryDto) {}





