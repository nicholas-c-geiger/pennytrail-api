import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
// Prisma types not required in unit tests
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

describe('TransactionsService', () => {
  const sample = {
    id: 1,
    userId: 10,
    amountCents: 1234,
    description: 'coffee',
    createdAt: new Date(),
  };

  let mockPrisma: {
    transaction: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let service: TransactionsService;

  beforeEach(() => {
    mockPrisma = {
      transaction: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    // cast through unknown to avoid structural checks against full PrismaClient
    service = new TransactionsService(mockPrisma as unknown as PrismaService);
  });

  it('findAll returns records', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([sample]);
    const res = await service.findAll();
    expect(res).toEqual([sample]);
    expect(mockPrisma.transaction.findMany).toHaveBeenCalled();
  });

  it('findOne returns a record when found', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(sample);
    const res = await service.findOne(1);
    expect(res).toEqual(sample);
  });

  it('findOne throws NotFoundException when missing', async () => {
    mockPrisma.transaction.findUnique.mockResolvedValue(null);
    await expect(service.findOne(2)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create returns created record', async () => {
    const dto = {
      userId: 10,
      amountCents: 550,
      description: 'x',
    } as unknown as CreateTransactionDto;
    mockPrisma.transaction.create.mockResolvedValue(sample);
    const res = await service.create(dto);
    expect(res).toEqual(sample);
    expect(mockPrisma.transaction.create).toHaveBeenCalled();
  });

  it('create maps errors to InternalServerErrorException', async () => {
    mockPrisma.transaction.create.mockRejectedValue(new Error('boom'));
    await expect(
      service.create({ userId: 1, amount: 1 } as unknown as CreateTransactionDto)
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });

  it('update returns updated record', async () => {
    const updated = { ...sample, description: 'updated' };
    mockPrisma.transaction.update.mockResolvedValue(updated);
    const res = await service.update(1, {
      description: 'updated',
    } as unknown as UpdateTransactionDto);
    expect(res).toEqual(updated);
  });

  it('update throws NotFoundException on P2025', async () => {
    mockPrisma.transaction.update.mockRejectedValue({ code: 'P2025' });
    await expect(
      service.update(999, { description: 'x' } as unknown as UpdateTransactionDto)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove resolves on success', async () => {
    mockPrisma.transaction.delete.mockResolvedValue(undefined);
    await expect(service.remove(1)).resolves.toBeUndefined();
  });

  it('remove throws NotFoundException on P2025', async () => {
    mockPrisma.transaction.delete.mockRejectedValue({ code: 'P2025' });
    await expect(service.remove(999)).rejects.toBeInstanceOf(NotFoundException);
  });
});
