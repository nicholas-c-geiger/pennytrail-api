import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaClient, Prisma } from '@prisma/client';
import jwt from 'jsonwebtoken';

describe('Transactions real DB (e2e)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  const testUserId = 9999;

  beforeAll(async () => {
    // ensure test user exists
    await prisma.user.upsert({ where: { id: testUserId }, create: { id: testUserId, name: 'smoke' }, update: { name: 'smoke' } });

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  it('CRUD transactions against real DB', async () => {
    const secret = process.env.API_SECRET as string;
    if (!secret) throw new Error('API_SECRET not set');
    const token = jwt.sign({ sub: testUserId }, secret, { algorithm: 'HS256', expiresIn: '1h' });
    const auth = `Bearer ${token}`;

    // Create
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/transactions')
      .set('Authorization', auth)
      .send({ userId: testUserId, amountCents: 750, description: 'real-smoke' })
      .expect(201);

    const created = createRes.body;
    expect(created).toHaveProperty('id');

    const id = created.id;

    // Read
    const getRes = await request(app.getHttpServer()).get('/api/v1/transactions').set('Authorization', auth).expect(200);
    expect(Array.isArray(getRes.body)).toBe(true);

    // Update
    const updateRes = await request(app.getHttpServer())
      .put(`/api/v1/transactions/${id}`)
      .set('Authorization', auth)
      .send({ description: 'real-updated', amountCents: 825 })
      .expect(200);
    expect(updateRes.body.description).toBe('real-updated');

    // Delete
    await request(app.getHttpServer()).delete(`/api/v1/transactions/${id}`).set('Authorization', auth).expect(204);
  }, 20000);
});
