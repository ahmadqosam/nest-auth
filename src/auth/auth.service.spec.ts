import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('mock_hash'),
  verify: jest.fn().mockResolvedValue(true), // Default to true
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: '123',
    email: 'test@mail.com',
    passwordHash: 'passwordHash',
    refreshTokenHash: null,
  };

  const mockTokens = {
    access_token: 'access_token',
    refresh_token: 'refresh_token',
  }

  beforeEach(async () => {
    const argon2 = require('argon2');
    (argon2.verify as jest.Mock).mockResolvedValue(true);

    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as UsersService

    jwtService = {
      signAsync: jest.fn().mockResolvedValue(mockTokens.access_token),
    } as unknown as JwtService

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn((key: string) => {
              if (key === 'JWT_PRIVATE_KEY') {
                return Buffer.from('privateKey').toString('base64');
              }
              if (key === 'APP_ID') {
                return 'test-app-id';
              }
              if (key === 'ISSUER') {
                return 'test-issuer';
              }
              return 'mock-data';
            }),
          }
        }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('signup', () => {
    it('should throw ConflictException if user exists', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      await expect(service.signup(mockUser.email, 'password')).rejects.toThrow(ConflictException);
    });

    it('should create user and return tokens', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (usersService.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.signup(mockUser.email, 'password');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });
  });

  describe('signin', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      await expect(service.signin(mockUser.email, 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if invalid credentials', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      const argon2 = require('argon2');
      (argon2.verify as jest.Mock).mockResolvedValue(false);
      await expect(service.signin(mockUser.email, 'password')).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.signin(mockUser.email, 'password');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(usersService.update).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.logout('123')).rejects.toThrow(UnauthorizedException);
    });

    it('should update user', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      await service.logout('123');
      expect(usersService.update).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should throw ForbiddenException if user not found', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.refreshToken('123', 'refresh_token')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if invalid refresh token', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue(mockUser);
      await expect(service.refreshToken('123', 'refresh_token')).rejects.toThrow(ForbiddenException);
    });

    it('should return tokens', async () => {
      (usersService.findById as jest.Mock).mockResolvedValue({
        ...mockUser,
        refreshTokenHash: 'refresh_token_hash'
      });
      const result = await service.refreshToken('123', 'refresh_token_hash');
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(usersService.update).toHaveBeenCalled();
    });
  });
});
