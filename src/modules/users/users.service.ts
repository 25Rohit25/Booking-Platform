import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<UserWithoutPassword> {
    try {
      const user = await this.prisma.user.create({ data });
      const { password, ...result } = user;
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Email already exists');
        }
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserWithoutPassword | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const { password, ...result } = user;
    return result;
  }

  async getUserWithPassword(email: string): Promise<User | null> {
    // Internal method strictly for Auth module to verify credentials
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, ...result } = user;
    return result;
  }
}
