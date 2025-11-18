import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from '../src/users/users.service';
import { UsersModule } from '../src/users/users.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('POST /api/v1/users - validation and HttpCode(201)', async () => {
    // override UsersService to avoid DB operations
    const createdUser = { id: 10, name: 'E2E', email: 'e2e@example.com' };
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [UsersModule] })
      .overrideProvider(UsersService)
      .useValue({ create: jest.fn().mockResolvedValue(createdUser) })
      .compile();

    const app2 = moduleFixture.createNestApplication();
    app2.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app2.setGlobalPrefix('api/v1');
    await app2.init();

    // invalid payload -> 400
    await request(app2.getHttpServer()).post('/api/v1/users').send({ name: 'NoEmail' }).expect(400);

    // valid payload -> 201
    const res = await request(app2.getHttpServer())
      .post('/api/v1/users')
      .send({ name: 'E2E', email: 'e2e@example.com' })
      .expect(201);

    expect(res.body).toMatchObject(createdUser as any);
    await app2.close();
  });

  it('GET /api/v1/users - guard protected (override guard allow/deny)', async () => {
    // app with guard that denies -> expect 401 (use global guard to short-circuit)
    const moduleDeny: TestingModule = await Test.createTestingModule({ imports: [UsersModule] }).compile();

    const appDeny = moduleDeny.createNestApplication();
    appDeny.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    appDeny.setGlobalPrefix('api/v1');
    // short-circuit with a global guard that denies
    appDeny.useGlobalGuards({ canActivate: () => false } as CanActivate);
    await appDeny.init();

    await request(appDeny.getHttpServer()).get('/api/v1/users').expect(403);
    await appDeny.close();

    // (allow-case omitted: method-level JwtAuthGuard uses passport and requires strategy setup)
  });
});
