import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsUUID, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class QueryBookingDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page (max 100)', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filter by exact status', enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ description: 'Filter by specific booking date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  bookingDate?: string;

  @ApiPropertyOptional({ description: 'Filter by specific service ID' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({ description: 'Search term for customer name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Field to sort by', enum: ['bookingDate', 'createdAt', 'status'] })
  @IsOptional()
  @IsIn(['bookingDate', 'createdAt', 'status'])
  sortBy?: 'bookingDate' | 'createdAt' | 'status' = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
