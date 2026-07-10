import { Injectable, ConflictException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma, Booking, BookingStatus } from '@prisma/client';
import { ServicesService } from '../services/services.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly servicesService: ServicesService,
  ) {}

  async create(dto: CreateBookingDto): Promise<Booking> {
    // 1. Temporal Logic Validation (Timezone Aware)
    // Create an absolute formatter that outputs the exact date/time in the user's timezone.
    // Instead of doing complex Date math, we format the current absolute time in their timezone,
    // and compare lexicographically since YYYY-MM-DD HH:MM:SS is sortable.
    const formatter = new Intl.DateTimeFormat('en-CA', { // 'en-CA' forces YYYY-MM-DD
      timeZone: dto.ianaTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    // Output: YYYY-MM-DD, HH:MM:SS
    const parts = formatter.formatToParts(new Date());
    const year = parts.find(p => p.type === 'year')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const day = parts.find(p => p.type === 'day')?.value;
    const hour = parts.find(p => p.type === 'hour')?.value;
    const minute = parts.find(p => p.type === 'minute')?.value;
    const second = parts.find(p => p.type === 'second')?.value;

    const currentClientDateTime = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    const requestedClientDateTime = `${dto.bookingDate}T${dto.bookingTime}`;

    if (requestedClientDateTime < currentClientDateTime) {
      throw new BadRequestException(`Booking date and time cannot be in the past relative to ${dto.ianaTimezone}.`);
    }

    const bookingDate = new Date(`${dto.bookingDate}T00:00:00Z`);
    const bookingTime = new Date(`1970-01-01T${dto.bookingTime}Z`);

    try {
      // 2. Atomic Transaction: Check service status and insert booking atomically
      // This eliminates the TOC/TOU race condition where a service is disabled during insertion.
      return await this.prisma.$transaction(async (tx) => {
        const service = await tx.service.findUnique({
          where: { id: dto.serviceId },
          select: { isActive: true },
        });

        if (!service) {
          throw new NotFoundException(`Service with ID ${dto.serviceId} not found`);
        }

        if (!service.isActive) {
          throw new ConflictException('This service is currently not active and cannot be booked.');
        }

        // Enforce uniqueness for PENDING and CONFIRMED bookings explicitly in the transaction
        const existingBooking = await tx.booking.findFirst({
          where: {
            serviceId: dto.serviceId,
            bookingDate,
            bookingTime,
            status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
          },
        });

        if (existingBooking) {
          throw new ConflictException('This time slot is already booked for the selected service. Please choose a different date or time.');
        }

        return await tx.booking.create({
          data: {
            customerName: dto.customerName,
            customerEmail: dto.customerEmail,
            customerPhone: dto.customerPhone,
            bookingDate,
            bookingTime,
            notes: dto.notes,
            serviceId: dto.serviceId,
          },
        });
      }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('This time slot is already booked for the selected service. Please choose a different date or time.');
        }
        if (error.code === 'P2034') {
          throw new ConflictException('Due to high demand, this time slot was just booked by another user. Please choose a different date or time.');
        }
      }
      throw error;
    }
  }

  async findAll(query: QueryBookingDto) {
    const { page = 1, limit = 10, search, status, bookingDate, serviceId, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (bookingDate) {
      where.bookingDate = new Date(bookingDate);
    }

    if (serviceId) {
      where.serviceId = serviceId;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const select = {
      id: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      bookingDate: true,
      bookingTime: true,
      status: true,
      notes: true,
      createdAt: true,
      updatedAt: true,
      service: {
        select: {
          id: true,
          title: true,
          price: true,
          duration: true,
        },
      },
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        select,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: {
          select: { id: true, title: true, price: true, duration: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async updateStatus(id: string, newStatus: BookingStatus, userId: string) {
    // 1. Ownership Verification (Fixing IDOR)
    // We explicitly query the DB for the booking and its related service owner.
    const ownershipCheck = await this.prisma.booking.findUnique({
      where: { id },
      include: { service: { select: { createdById: true } } }
    });

    if (!ownershipCheck) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    if (ownershipCheck.service.createdById !== userId) {
      throw new ForbiddenException('You can only update bookings for services you created.');
    }

    let invalidStatuses: BookingStatus[] = [];

    // FSM Rule mappings: Which current statuses block this new status?
    if (newStatus === BookingStatus.COMPLETED) {
      // Cannot jump from CANCELLED to COMPLETED
      invalidStatuses = [BookingStatus.CANCELLED];
    } else if (newStatus === BookingStatus.PENDING || newStatus === BookingStatus.CONFIRMED || newStatus === BookingStatus.CANCELLED) {
      // Cannot revert from COMPLETED
      invalidStatuses = [BookingStatus.COMPLETED];
    }

    // Atomic update using updateMany to prevent TOC/TOU race conditions
    const result = await this.prisma.booking.updateMany({
      where: {
        id,
        ...(invalidStatuses.length > 0 && { status: { notIn: invalidStatuses } }),
      },
      data: { status: newStatus },
    });

    if (result.count === 0) {
      // Fallback query to determine WHY the update failed (404 vs 400)
      const exists = await this.prisma.booking.findUnique({ where: { id }, select: { status: true } });
      if (!exists) {
        throw new NotFoundException(`Booking with ID ${id} not found`);
      }
      throw new BadRequestException(`Invalid status transition: A ${exists.status} booking cannot be changed to ${newStatus}.`);
    }

    return this.findById(id); // Return the newly updated record
  }

  async cancel(id: string, userId: string) {
    return this.updateStatus(id, BookingStatus.CANCELLED, userId);
  }
}
