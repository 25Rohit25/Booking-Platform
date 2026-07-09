import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [ServicesModule],
  providers: [BookingsService],
  controllers: [BookingsController],
})
export class BookingsModule {}
