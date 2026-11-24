import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Current (old) password', minLength: 1 })
  @IsString()
  oldPassword: string;

  @ApiProperty({ description: 'New password (min 8 chars)', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword: string;
}
