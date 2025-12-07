import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
    create: jest.fn().mockImplementation(async (dto: CreateUserDto) => ({ ...dto })),
    update: jest.fn().mockImplementation(async (id: number, dto) => {
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

  // POST creation removed — creation should be done via PUT /:id. Controller tests focus on existing endpoints.

  describe('update', () => {
    it('should update a user when exists', async () => {
      const dto: UpdateUserDto = { name: 'Alice Updated' } as UpdateUserDto;
      const updated = await usersController.update(1, dto);
      expect(updated).toEqual({ id: 1, ...dto });
      expect(mockUsersService.update).toHaveBeenCalledWith(1, dto, false);
    });

    it('should create the user when it does not exist (upsert behavior)', async () => {
      const dto: UpdateUserDto = { name: 'x' } as UpdateUserDto;
      await expect(usersController.update(99, dto)).resolves.toEqual({ id: 99, ...dto });
    });
  });

  describe('remove', () => {
    it('should remove a user when exists', async () => {
      await expect(usersController.remove(1)).resolves.toBeUndefined();
      expect(mockUsersService.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when removing non-existent user', async () => {
      await expect(usersController.remove(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
