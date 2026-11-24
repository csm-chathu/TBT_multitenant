import { IsNumber, IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CsvRowErrorDto {
  @IsNumber()
  index: number;

  @IsString()
  field: string;

  @IsString()
  message: string;
}

export class CsvUploadResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CsvRowErrorDto)
  errors: CsvRowErrorDto[];

  @IsNumber()
  totalRecords: number;

  @IsNumber()
  errorRecords: number;

  @IsNumber()
  successRecords: number;

  @IsOptional()
  @IsArray()
  errorRows?: any[];
}

