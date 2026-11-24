import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateRenewPortalTicketDto {
  @ApiProperty({
    description: 'Admin/requester first name',
    example: 'D',
  })
  @IsString()
  @IsNotEmpty({ message: 'adminFirstName is required' })
  adminFirstName: string;

  @ApiProperty({
    description: 'Admin/requester last name',
    example: 'D',
  })
  @IsString()
  @IsNotEmpty({ message: 'adminLastName is required' })
  adminLastName: string;

  @ApiPropertyOptional({
    description: 'Admin/requester job title or position',
    example: 'F',
  })
  @IsOptional()
  @IsString()
  adminTitle?: string;

  @ApiProperty({
    description: 'Admin/requester email address',
    example: 'sunithkaushalya.pp@gmail.com',
  })
  @IsEmail({}, { message: 'A valid adminEmail is required' })
  @IsNotEmpty({ message: 'adminEmail is required' })
  adminEmail: string;

  @ApiPropertyOptional({
    description: 'Array of facility/location IDs requested',
    example: [6, 5],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsNumber({}, { each: true, message: 'Each facility ID must be a number' })
  facilityIds?: number[];

  @ApiPropertyOptional({
    description: 'Array of facility/location names requested',
    example: ['Brighton Care Center', 'Springfield Health Center'],
    type: [String],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.trim()) return [value.trim()];
    return value;
  })
  @IsArray()
  @IsString({ each: true, message: 'Each facility name must be a string' })
  facilityNames?: string[];

  @ApiProperty({
    description: 'Employee/user first name',
    example: 'F',
  })
  @IsString()
  @IsNotEmpty({ message: 'firstName is required' })
  firstName: string;

  @ApiProperty({
    description: 'Employee/user last name',
    example: 'Z',
  })
  @IsString()
  @IsNotEmpty({ message: 'lastName is required' })
  lastName: string;

  @ApiPropertyOptional({
    description: 'Flag indicating whether this is a new user onboarding request',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return value;
  })
  @IsBoolean()
  isNewUser?: boolean;

  @ApiPropertyOptional({
    description: 'Employee/user email (may be empty for new users)',
    example: '',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  email?: string;

  @ApiPropertyOptional({
    description: 'Employee/user phone or mobile number',
    example: '+1 (909) 973-1033',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Type of access requested (e.g., Network & Email Access)',
    example: 'Network & Email Access',
  })
  @IsOptional()
  @IsString()
  accessType?: string;

  @ApiPropertyOptional({
    description: 'Employment type (e.g., Full-Time Employee, Contractor)',
    example: 'Full-Time Employee',
  })
  @IsOptional()
  @IsString()
  employeeType?: string;

  @ApiPropertyOptional({
    description: 'Department name',
    example: 'IT',
  })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({
    description: 'Employee position or title',
    example: 'dfdf',
  })
  @IsOptional()
  @IsString()
  positionTitle?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or remarks',
    example: 'tt',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
