import { Test, TestingModule } from '@nestjs/testing';
import { JwksController } from './jwks.controller';
import { ConfigService } from '@nestjs/config';

describe('JwksController', () => {
  let controller: JwksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JwksController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue(
              Buffer.from('mock-public-key', 'base64')
            )
          }
        }
      ]
    }).compile();

    controller = module.get<JwksController>(JwksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
