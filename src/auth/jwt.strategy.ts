import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('NEXTAUTH_SECRET');

    if (!secret) {
      throw new Error(
        'Environment variable NEXTAUTH_SECRET is required for JWT verification. Set NEXTAUTH_SECRET and restart the application.'
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    // Whatever NextAuth put in the token, you get here.
    // Typically payload = { id, email, name, picture }
    return payload;
  }
}
