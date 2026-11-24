import { PartialType } from '@nestjs/mapped-types'
import { IsNumber, IsOptional, IsString } from 'class-validator'
import { StateAttributes } from 'src/intertfaces/state.interface'

export class BaseStateDto implements StateAttributes {
  @IsOptional()
  @IsNumber()
  id?: number

  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  label?: string
}

export class UpdateStateDto extends PartialType(BaseStateDto) {}





