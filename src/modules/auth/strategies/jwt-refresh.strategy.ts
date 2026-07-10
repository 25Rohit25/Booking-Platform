import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey:
        configService.get<string>('jwt.refreshSecret') ||
        'defaultRefreshSecret',
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: any) {
    const refreshToken = request
      .get('Authorization')
      ?.replace('Bearer', '')
      .trim();
    if (!refreshToken) {
      throw new UnauthorizedException();
    }
    const user = await this.usersService.getUserIfRefreshTokenMatches(
      refreshToken,
      payload.sub,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    // Return user with refreshToken attached if needed, or just user
    return { ...user, refreshToken };
  }
}
