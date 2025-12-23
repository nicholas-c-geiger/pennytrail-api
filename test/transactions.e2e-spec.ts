import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate } from '@nestjs/common';
import request from 'supertest';
import { TransactionsModule } from '../src/transactions/transactions.module';
import { TransactionsService } from '../src/transactions/transactions.service';
import { VerifyJwtGuard } from '../src/auth/verify-jwt.guard';
import { Prisma } from '@prisma/client';

describe('Transactions (e2e)', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
  });

  it('GET /api/v1/transactions - list', async () => {
    const sample = {
      id: 1,
      userId: 10,
      amountCents: 1234,
      description: 'coffee',
      createdAt: new Date(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [TransactionsModule] })
      .overrideProvider(TransactionsService)
      .useValue({ findAll: jest.fn().mockResolvedValue([sample]) })
      .overrideGuard(VerifyJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    app.useGlobalGuards({ canActivate: () => true } as CanActivate);
    await app.init();

    const res = await request(app.getHttpServer()).get('/api/v1/transactions').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: 1, userId: 10, description: 'coffee' });
  });

  it('POST /api/v1/transactions - create', async () => {
    const created = {
      id: 2,
      userId: 11,
      amountCents: 500,
      description: 'tea',
      createdAt: new Date(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [TransactionsModule] })
      .overrideProvider(TransactionsService)
      .useValue({ create: jest.fn().mockResolvedValue(created) })
      .overrideGuard(VerifyJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    app.useGlobalGuards({ canActivate: () => true } as CanActivate);
    await app.init();

    const payload = { userId: 11, amountCents: 500, description: 'tea' };
    const res = await request(app.getHttpServer()).post('/api/v1/transactions').send(payload).expect(201);
    expect(res.body).toMatchObject({ id: 2, userId: 11, description: 'tea' });
  });

  it('PUT /api/v1/transactions/:id - update and DELETE', async () => {
    const updated = {
      id: 3,
      userId: 12,
      amountCents: 999,
      description: 'sandwich',
      createdAt: new Date(),
    };

    const mockService = {
      update: jest.fn().mockResolvedValue(updated),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [TransactionsModule] })
      .overrideProvider(TransactionsService)
      .useValue(mockService)
      .overrideGuard(VerifyJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    app.useGlobalGuards({ canActivate: () => true } as CanActivate);
    await app.init();

    const res = await request(app.getHttpServer()).put('/api/v1/transactions/3').send({ amountCents: 999 }).expect(200);
    expect(res.body).toMatchObject({ id: 3, description: 'sandwich' });

    await request(app.getHttpServer()).delete('/api/v1/transactions/3').expect(204);
  });
});
