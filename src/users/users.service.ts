import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  PreconditionFailedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

function isPrismaKnownRequestError(err: unknown): err is { code?: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}
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
      const data: Prisma.UserUncheckedCreateInput = {
        id: createUserDto.id,
        name: createUserDto.name,
      };

      return await this.prisma.user.create({ data });
    } catch (err: unknown) {
      if (isPrismaKnownRequestError(err) && err.code === 'P2002') {
        throw new ConflictException('Unique constraint violation');
      }
      throw new InternalServerErrorException();
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto, createOnly = false): Promise<User> {
    const name = (updateUserDto as { name?: string | null }).name ?? undefined;

    if (createOnly) {
      try {
        const data: Prisma.UserUncheckedCreateInput = {
          id,
          name,
        };
        return await this.prisma.user.create({ data });
      } catch (err: unknown) {
        if (isPrismaKnownRequestError(err) && err.code === 'P2002') {
          // Resource exists — map to 412 Precondition Failed for If-None-Match semantics
          throw new PreconditionFailedException('Resource already exists');
        }
        throw new InternalServerErrorException();
      }
    }

    try {
      return await this.prisma.user.upsert({
        where: { id },
        create: { id, name },
        update: { name },
      });
    } catch (err: unknown) {
      if (isPrismaKnownRequestError(err) && err.code === 'P2002') {
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
    } catch (err: unknown) {
      if (isPrismaKnownRequestError(err) && err.code === 'P2025') {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      throw new InternalServerErrorException();
    }
  }
}
