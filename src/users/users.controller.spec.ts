import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersController', () => {
  let usersController: UsersController;

  const mockPrismaService = {
    user: {
      findMany: jest.fn().mockResolvedValue([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]),
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id === 1) {
          return Promise.resolve({ id: 1, name: 'Alice' });
        }
        return Promise.resolve(null);
      }),
    },
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    usersController = app.get<UsersController>(UsersController);
  });

  describe('getUsers', () => {
    it('should return users from PrismaService', async () => {
      const users = await usersController.findAll();
      expect(users).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
      expect(mockPrismaService.user.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by ID', async () => {
      const user = await usersController.findOne(1);
      expect(user).toEqual({ id: 1, name: 'Alice' });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when user not found', async () => {
        await expect(usersController.findOne(3))
            .rejects
            .toBeInstanceOf(NotFoundException);
    });
  });
});
