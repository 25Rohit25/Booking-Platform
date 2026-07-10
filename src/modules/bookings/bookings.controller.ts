import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Query,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking (Public endpoint)' })
  @ApiResponse({ status: 201, description: 'Booking confirmed successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Validation Error (e.g. Past date).',
  })
  @ApiResponse({ status: 404, description: 'Service Not Found.' })
  @ApiResponse({
    status: 409,
    description: 'Time slot conflict or inactive service.',
  })
  async create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'List all bookings with pagination, search, and filters (Authenticated)',
  })
  @ApiResponse({ status: 200, description: 'Successfully retrieved bookings.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(@Query() query: QueryBookingDto) {
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific booking by ID (Authenticated)' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved booking.' })
  @ApiResponse({ status: 400, description: 'Invalid UUID.' })
  @ApiResponse({ status: 404, description: 'Booking Not Found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status (Authenticated)' })
  @ApiResponse({ status: 200, description: 'Status updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid status transition.' })
  @ApiResponse({ status: 404, description: 'Booking Not Found.' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
    @Request() req: any,
  ) {
    return this.bookingsService.updateStatus(
      id,
      updateBookingStatusDto.status,
      req.user.userId,
    );
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a booking (Authenticated)' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel a completed booking.',
  })
  @ApiResponse({ status: 404, description: 'Booking Not Found.' })
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.bookingsService.cancel(id, req.user.userId);
  }
}
