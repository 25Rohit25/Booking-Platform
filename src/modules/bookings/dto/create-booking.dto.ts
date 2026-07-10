import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
  IsPhoneNumber,
  IsTimeZone,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateBookingDto {
  @ApiProperty({ example: 'Jane Doe', description: 'Name of the customer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  customerName: string;

  @ApiProperty({
    example: 'jane@example.com',
    description: 'Email of the customer',
  })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  customerEmail: string;

  @ApiPropertyOptional({
    example: '+1234567890',
    description: 'Phone number in E.164 format',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, {
    message:
      'customerPhone must be a valid international phone number starting with +',
  })
  customerPhone?: string;

  @ApiProperty({
    example: '2026-08-15',
    description: 'Date of the booking (YYYY-MM-DD)',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'bookingDate must be in YYYY-MM-DD format',
  })
  bookingDate: string;

  @ApiProperty({
    example: '14:30:00',
    description: 'Time of the booking (HH:MM:SS)',
  })
  @IsString()
  @Matches(/^\d{2}:\d{2}:\d{2}$/, {
    message: 'bookingTime must be in HH:MM:SS format',
  })
  bookingTime: string;

  @ApiPropertyOptional({
    example: 'Please prepare a vegan snack',
    description: 'Special notes',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({
    example: 'uuid-here',
    description: 'ID of the service to book',
  })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    example: 'America/New_York',
    description: 'IANA Timezone of the client',
  })
  @IsTimeZone()
  @IsNotEmpty()
  ianaTimezone: string;
}
