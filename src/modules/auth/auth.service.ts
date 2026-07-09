import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService, UserWithoutPassword } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserWithoutPassword> {
    // Inject salt rounds from config or default to 10
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    return this.usersService.create({
      fullName: registerDto.fullName,
      email: registerDto.email,
      password: hashedPassword,
    });
  }

  async validateUser(email: string, pass: string): Promise<UserWithoutPassword | null> {
    const user = await this.usersService.getUserWithPassword(email);
    
    // Anti-timing attack protection: always run the bcrypt algorithm
    if (!user) {
      const dummyHash = await bcrypt.hash('dummy', 10);
      await bcrypt.compare(pass, dummyHash);
      return null;
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async login(user: UserWithoutPassword) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
