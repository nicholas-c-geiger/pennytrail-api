import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: createUserDto,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        // Unique constraint failed
        (err as any).code === 'P2002'
      ) {
        throw new ConflictException('A user with that email already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateUserDto,
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err as any).code === 'P2025'
      ) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err as any).code === 'P2002'
      ) {
        throw new ConflictException('Unique constraint violation');
      }
      throw new InternalServerErrorException();
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
      return;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err as any).code === 'P2025'
      ) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw new InternalServerErrorException();
    }
  }
}
