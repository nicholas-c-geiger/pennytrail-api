import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt-payload.interface';

describe('JwtStrategy', () => {
  let service: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'), // return a fake secret
          },
        },
      ],
    }).compile();

    service = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the payload on validate', async () => {
    const payload: JwtPayload = { id: '1', name: 'Test User' };
    expect(await service.validate(payload)).toEqual(payload);
  });
});
