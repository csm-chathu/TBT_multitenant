import { IsInt, IsOptional, IsString } from 'class-validator';

export class BaseIncidentDto {
  @IsOptional()
  @IsString()
  type?: string;
}

export class UpdateIncidentDto {
  @IsOptional()
  @IsString()
  type?: string;
}

export class IncidentResponseDto {
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  type?: string;

  createdAt?: Date | number;
  updatedAt?: Date | number;
}




