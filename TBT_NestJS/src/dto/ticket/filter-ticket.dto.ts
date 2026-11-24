import { IsOptional, IsString, IsDateString, IsIn, IsInt, Min, IsBoolean, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TICKET_STATUS_VALUES, TICKET_PRIORITY_VALUES } from '../../config/ticket.constants';

/**
 * Custom validator to ensure endDate is after startDate
 */
@ValidatorConstraint({ name: 'isAfterStartDate', async: false })
export class IsAfterStartDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments) {
    const startDate = (args.object as FilterTicketDto).startDate;
    if (!startDate || !endDate) {
      return true; // If either is missing, validation passes (handled by @IsOptional)
    }
    return new Date(endDate) >= new Date(startDate);
  }

  defaultMessage(args: ValidationArguments) {
    return 'endDate must be after or equal to startDate';
  }
}

/**
 * DTO for filtering tickets by date range, status, and/or priority
 */
export class FilterTicketDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @Validate(IsAfterStartDateConstraint)
  endDate?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const match = TICKET_STATUS_VALUES.find(s => s.toLowerCase() === value.toLowerCase());
      return match || value;
    }
    return value;
  })
  @IsIn(TICKET_STATUS_VALUES, {
    message: `Status must be one of: ${TICKET_STATUS_VALUES.join(', ')}`,
  })
  status?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const match = TICKET_PRIORITY_VALUES.find(s => s.toLowerCase() === value.toLowerCase());
      return match || value;
    }
    return value;
  })
  @IsIn(TICKET_PRIORITY_VALUES, {
    message: `Priority must be one of: ${TICKET_PRIORITY_VALUES.join(', ')}`,
  })
  priority?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  agentId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  deviceId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  locationId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  actionType?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isUnread?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  customerId?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'], {
    message: 'sortOrder must be one of: asc, desc, ASC, DESC',
  })
  sortOrder?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

