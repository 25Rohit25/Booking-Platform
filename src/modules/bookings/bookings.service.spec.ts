import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ServicesService } from '../services/services.service';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

// Unit Test Strategy Demonstration
describe('BookingsService', () => {
  let service: BookingsService;

  const mockPrismaService: any = {
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation(async (arg) => {
      if (Array.isArray(arg)) return Promise.all(arg);
      return arg(mockPrismaService);
    }),
  };

  const mockServicesService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ServicesService, useValue: mockServicesService },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create booking business rules', () => {
    it('should throw ConflictException if service is inactive', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({ isActive: false });
      
      await expect(service.create({
        customerName: 'Test',
        customerEmail: 'test@example.com',
        bookingDate: '2026-08-15',
        bookingTime: '14:30:00',
        serviceId: 'uuid',
        ianaTimezone: 'UTC',
      })).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for past dates', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({ isActive: true });
      
      await expect(service.create({
        customerName: 'Test',
        customerEmail: 'test@example.com',
        bookingDate: '2000-01-01', // Past date
        bookingTime: '10:00:00',
        serviceId: 'uuid',
        ianaTimezone: 'UTC',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('FSM transitions', () => {
    it('should prevent CANCELLED to COMPLETED transitions via updateMany atomicity', async () => {
      // Mock ownership check
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({
        service: { createdById: 'user-id' }
      });
      // Mock result.count = 0 to simulate FSM rejection
      mockPrismaService.booking.updateMany.mockResolvedValue({ count: 0 });
      // Mock fallback query
      mockPrismaService.booking.findUnique.mockResolvedValueOnce({ status: BookingStatus.CANCELLED });

      await expect(service.updateStatus('uuid', BookingStatus.COMPLETED, 'user-id'))
        .rejects.toThrow(BadRequestException);
    });
  });
});
