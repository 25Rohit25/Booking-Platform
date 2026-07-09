import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ServicesService } from '../services/services.service';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';

// Unit Test Strategy Demonstration
describe('BookingsService', () => {
  let service: BookingsService;

  const mockPrismaService = {
    booking: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
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
      mockServicesService.findById.mockResolvedValue({ isActive: false });
      
      await expect(service.create({
        customerName: 'Test',
        customerEmail: 'test@example.com',
        bookingDate: '2026-08-15',
        bookingTime: '14:30:00',
        serviceId: 'uuid',
      })).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for past dates', async () => {
      mockServicesService.findById.mockResolvedValue({ isActive: true });
      
      await expect(service.create({
        customerName: 'Test',
        customerEmail: 'test@example.com',
        bookingDate: '2000-01-01', // Past date
        bookingTime: '10:00:00',
        serviceId: 'uuid',
      })).rejects.toThrow(BadRequestException);
    });
  });

  describe('FSM transitions', () => {
    it('should prevent CANCELLED to COMPLETED transitions via updateMany atomicity', async () => {
      // Mock result.count = 0 to simulate FSM rejection
      mockPrismaService.booking.updateMany.mockResolvedValue({ count: 0 });
      mockPrismaService.booking.findUnique.mockResolvedValue({ status: BookingStatus.CANCELLED });

      await expect(service.updateStatus('uuid', BookingStatus.COMPLETED))
        .rejects.toThrow(BadRequestException);
    });
  });
});
