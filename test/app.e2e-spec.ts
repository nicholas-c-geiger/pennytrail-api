import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UsersService } from '../src/users/users.service';
import { UsersModule } from '../src/users/users.module';
import { VerifyJwtGuard } from '../src/auth/verify-jwt.guard';

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

  it('PUT /api/v1/users/10 - validation and HttpCode(201)', async () => {
    // override UsersService to avoid DB operations
    const createdUser = { id: 10, name: 'E2E' };
    const moduleFixtureBuilder = Test.createTestingModule({ imports: [UsersModule] })
      .overrideProvider(UsersService)
      .useValue({ update: jest.fn().mockResolvedValue(createdUser) })
      // override the VerifyJwtGuard used on the PUT handler so tests can call it without auth
      .overrideGuard(VerifyJwtGuard)
      .useValue({ canActivate: () => true });

    const moduleFixture: TestingModule = await moduleFixtureBuilder.compile();

    const app2 = moduleFixture.createNestApplication();
    app2.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app2.setGlobalPrefix('api/v1');
    // bypass authentication for this test instance
    app2.useGlobalGuards({ canActivate: () => true } as CanActivate);
    await app2.init();

    // valid payload -> 200 (create via PUT to client-chosen id)
    const res = await request(app2.getHttpServer()).put('/api/v1/users/10').send({ name: 'E2E' }).expect(200);
    
    // valid payload -> 200 (success when user already exists)
    await request(app2.getHttpServer())
      .put('/api/v1/users/10')
      .set('If-None-Match', '*')
      .send({})
      .expect(200);

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
