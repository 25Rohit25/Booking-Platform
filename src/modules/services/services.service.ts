import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma, Service } from '@prisma/client';
import { CreateServiceDto } from './dto/create-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateServiceDto): Promise<Service> {
    return this.prisma.service.create({
      data: {
        ...dto,
        createdById: userId,
      },
    });
  }

  async findAll(query: QueryServiceDto) {
    const {
      page = 1,
      limit = 10,
      isActive,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    } else {
      // By default, maybe we show all, or only active? The prompt says "Deleted services should not appear in active listings",
      // but filtering by isActive=true/false is supported.
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {
        ...(minPrice !== undefined && { gte: minPrice }),
        ...(maxPrice !== undefined && { lte: maxPrice }),
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const select = {
      id: true,
      title: true,
      description: true,
      duration: true,
      price: true,
      isActive: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.service.count({ where }),
      this.prisma.service.findMany({
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

  async findById(id: string): Promise<Service> {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  async update(
    id: string,
    userId: string,
    updateData: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.findById(id);

    if (service.createdById !== userId) {
      throw new ForbiddenException(
        'You are not authorized to update this service',
      );
    }

    return this.prisma.service.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const service = await this.findById(id);

    if (service.createdById !== userId) {
      throw new ForbiddenException(
        'You are not authorized to delete this service',
      );
    }

    try {
      await this.prisma.service.delete({ where: { id } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new ConflictException(
          'Cannot delete a service that has existing bookings. Please mark it as inactive instead.',
        );
      }
      throw error;
    }
  }
}
