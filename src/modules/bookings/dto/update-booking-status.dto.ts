import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingStatusDto {
  @ApiProperty({
    example: 'CONFIRMED',
    enum: BookingStatus,
    description: 'The new status of the booking',
  })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: BookingStatus;
}
