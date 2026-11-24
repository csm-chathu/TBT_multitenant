import { IsString, IsNotEmpty, IsOptional, IsInt } from "class-validator"
import { PartialType } from "@nestjs/mapped-types"

export class CreateCannedReplyDto {
  @IsString()
  @IsNotEmpty()
  text: string

  @IsOptional()
  @IsInt()
  application_id?: number
}

export class UpdateCannedReplyDto extends PartialType(CreateCannedReplyDto) {}
