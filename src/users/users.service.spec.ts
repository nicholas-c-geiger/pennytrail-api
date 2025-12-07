import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

const mockPrisma = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

function prismaKnownError(code: string, message = ''): Error & { code?: string; message?: string } {
  // Create an object with the same prototype as Prisma's runtime error so
  // `instanceof` checks in the service behave similarly without importing
  // the non-exported Prisma type.
  const maybeCtor = (Prisma as unknown as Record<string, unknown>)['PrismaClientKnownRequestError'];
  const proto = (maybeCtor && (maybeCtor as { prototype?: unknown }).prototype) ?? Error.prototype;
  const err = Object.create(proto) as { code?: string; message?: string } & Error;
  err.message = message;
  err.code = code;
  return err;
}

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('findAll returns users', async () => {
    const users = [{ id: 1, name: 'A' }];
    mockPrisma.user.findMany.mockResolvedValue(users);
    await expect(service.findAll()).resolves.toEqual(users);
  });

  it('findOne returns user or throws NotFoundException', async () => {
    const user = { id: 1, name: 'A' };
    mockPrisma.user.findUnique.mockResolvedValue(user);
    await expect(service.findOne(1)).resolves.toEqual(user);

    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(service.findOne(2)).rejects.toThrow(NotFoundException);
  });

  it('create returns created user or throws ConflictException on unique violation', async () => {
    const created = { id: 10, name: 'E2E' };
    mockPrisma.user.create.mockResolvedValue(created);
    await expect(service.create({ name: 'E2E' } as CreateUserDto)).resolves.toEqual(created);

    mockPrisma.user.create.mockRejectedValue(prismaKnownError('P2002'));
    await expect(service.create({ name: 'E2E' } as CreateUserDto)).rejects.toThrow(
      ConflictException
    );

    mockPrisma.user.create.mockRejectedValue(new Error('boom'));
    await expect(service.create({ name: 'E2E' } as CreateUserDto)).rejects.toThrow(
      InternalServerErrorException
    );
  });

  it('update returns updated user or throws appropriate exceptions', async () => {
    const updated = { id: 1, name: 'B' };
    mockPrisma.user.update.mockResolvedValue(updated);
    await expect(service.update(1, { name: 'B' } as UpdateUserDto)).resolves.toEqual(updated);

    mockPrisma.user.update.mockRejectedValue(prismaKnownError('P2025'));
    await expect(service.update(2, { name: 'X' } as UpdateUserDto)).rejects.toThrow(
      NotFoundException
    );

    mockPrisma.user.update.mockRejectedValue(prismaKnownError('P2002'));
    await expect(service.update(1, { name: 'dup' } as UpdateUserDto)).rejects.toThrow(
      ConflictException
    );
  });

  it('remove deletes or throws NotFoundException', async () => {
    mockPrisma.user.delete.mockResolvedValue({} as User);
    await expect(service.remove(1)).resolves.toBeUndefined();

    mockPrisma.user.delete.mockRejectedValue(prismaKnownError('P2025'));
    await expect(service.remove(2)).rejects.toThrow(NotFoundException);
  });
});
