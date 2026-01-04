import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async signup(email: string, password: string, role?: Role) {
    const userExists = await this.usersService.findByEmail(email);

    if (userExists) {
      throw new ConflictException('User already exists');
    }

    const newUser = await this.usersService.create(
      email,
      password,
      role || Role.User,
    );

    const tokens = await this.getTokens(
      newUser.id,
      newUser.email,
      newUser.roles,
    );
    await this.updateRefreshTokenHash(newUser.id, tokens.refresh_token);

    return tokens;
  }

  async signin(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.getTokens(user.id, user.email, user.roles);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async logout(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    await this.usersService.update(userId, {
      refreshTokenHash: null,
      refreshTokenGeneratedAt: null,
    });
  }

  async refreshToken(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);

    if (!user || !user.refreshTokenHash) {
      throw new ForbiddenException('Access Denied');
    }

    const expiresDays =
      parseInt(this.config.getOrThrow('JWT_RT_EXPIRES_IN_MS')) ||
      7 * 24 * 60 * 60 * 1000;
    const expirationDate = new Date(
      user.refreshTokenGeneratedAt!.getTime() + expiresDays,
    );

    if (expirationDate < new Date()) {
      throw new ForbiddenException('Access Denied');
    }

    const rtMatches = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!rtMatches) {
      throw new ForbiddenException('Access Denied');
    }

    const tokens = await this.getTokens(user.id, user.email, user.roles);
    await this.updateRefreshTokenHash(user.id, tokens.refresh_token);

    return tokens;
  }

  async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await argon2.hash(refreshToken);
    await this.usersService.update(userId, {
      refreshTokenHash: hash,
      refreshTokenGeneratedAt: new Date().toISOString(),
    });
  }

  async getTokens(userId: string, email: string, roles: string) {
    const privateKey = Buffer.from(
      this.config.getOrThrow<string>('JWT_PRIVATE_KEY'),
      'base64',
    );

    const at = await this.jwtService.signAsync(
      {
        sub: userId,
        email,
        roles,
        app_id: this.config.getOrThrow<string>('APP_ID'),
      },
      {
        algorithm: 'RS256',
        secret: privateKey,
        expiresIn: this.config.getOrThrow('JWT_EXPIRES_IN'),
        issuer: this.config.getOrThrow<string>('ISSUER'),
      },
    );

    const rt = crypto.randomBytes(32).toString('hex');

    return {
      access_token: at,
      refresh_token: rt,
    };
  }
}
