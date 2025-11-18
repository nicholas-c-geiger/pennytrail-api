import { NotFoundException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let usersController: UsersController;

  const mockUsersService = {
    findAll: jest.fn().mockResolvedValue([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ]),
    findOne: jest.fn().mockImplementation(async (id: number) => {
      if (id === 1) return { id: 1, name: 'Alice' };
      throw new NotFoundException(`User with ID ${id} not found`);
    }),
    create: jest.fn().mockImplementation(async (dto) => ({ id: 3, ...dto })),
    update: jest.fn().mockImplementation(async (id: number, dto) => {
      if (id !== 1) throw new NotFoundException(`User with ID ${id} not found`);
      return { id, ...dto };
    }),
    remove: jest.fn().mockImplementation(async (id: number) => {
      if (id !== 1) throw new NotFoundException(`User with ID ${id} not found`);
      return;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const app: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    usersController = app.get<UsersController>(UsersController);
  });

  describe('findAll', () => {
    it('should return users from UsersService', async () => {
      const users = await usersController.findAll();
      expect(users).toEqual([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne - success', () => {
    it('should return a user by ID', async () => {
      const user = await usersController.findOne(1);
      expect(user).toEqual({ id: 1, name: 'Alice' });
      expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('findOne - not found', () => {
    it('should throw NotFoundException when user not found', async () => {
      await expect(usersController.findOne(3)).rejects.toBeInstanceOf(NotFoundException);
      expect(mockUsersService.findOne).toHaveBeenCalledWith(3);
    });
  });

  describe('create', () => {
    it('should create a user', async () => {
      const dto = { name: 'Charlie', email: 'c@example.com' };
      const created = await usersController.create(dto as any);
      expect(created).toEqual({ id: 3, ...dto });
      expect(mockUsersService.create).toHaveBeenCalledWith(dto);
    });

    it('should surface conflict error from service', async () => {
      mockUsersService.create.mockRejectedValueOnce(new ConflictException('duplicate'));
      await expect(usersController.create({ name: 'X', email: 'x@x.com' } as any)).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('update', () => {
    it('should update a user when exists', async () => {
      const dto = { name: 'Alice Updated' };
      const updated = await usersController.update(1 as any, dto as any);
      expect(updated).toEqual({ id: 1, ...dto });
      expect(mockUsersService.update).toHaveBeenCalledWith(1, dto);
    });

    it('should throw NotFoundException when updating non-existent user', async () => {
      await expect(usersController.update(99 as any, { name: 'x' } as any)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a user when exists', async () => {
      await expect(usersController.remove(1 as any)).resolves.toBeUndefined();
      expect(mockUsersService.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when removing non-existent user', async () => {
      await expect(usersController.remove(99 as any)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
