import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { Prisma } from '@prisma/client';

type DbTransaction = {
  id: number;
  userId: number;
  amountCents?: number | null;
  description?: string | null;
  createdAt: Date;
};

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Transaction[]> {
    const rows = await this.prisma.transaction.findMany();
    // return stored cents directly
    return rows.map((r: DbTransaction) => ({
      id: r.id,
      userId: r.userId,
      amountCents: r.amountCents ?? 0,
      description: r.description ?? null,
      createdAt: r.createdAt,
    })) as Transaction[];
  }

  async findOne(id: number): Promise<Transaction> {
    const tx = await this.prisma.transaction.findUnique({ where: { id } });
    if (!tx) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    const txRow = tx as DbTransaction;
    return {
      id: txRow.id,
      userId: txRow.userId,
      amountCents: txRow.amountCents ?? 0,
      description: txRow.description ?? null,
      createdAt: txRow.createdAt,
    } as Transaction;
  }

  async create(createDto: CreateTransactionDto): Promise<Transaction> {
    try {
      const data: Prisma.TransactionCreateInput = {
        user: { connect: { id: createDto.userId } },
        amountCents: createDto.amountCents,
        description: createDto.description ?? null,
      } as unknown as Prisma.TransactionCreateInput;

      const created = await this.prisma.transaction.create({ data });
      const createdRow = created as DbTransaction;
      return {
        id: createdRow.id,
        userId: createdRow.userId,
        amountCents: createdRow.amountCents ?? 0,
        description: createdRow.description ?? null,
        createdAt: createdRow.createdAt,
      } as Transaction;
    } catch {
      throw new InternalServerErrorException();
    }
  }

  async update(id: number, updateDto: UpdateTransactionDto): Promise<Transaction> {
    try {
      const data: Prisma.TransactionUpdateInput = {} as Prisma.TransactionUpdateInput;
      if (typeof updateDto.userId === 'number') {
        data.user = { connect: { id: updateDto.userId } };
      }
      if (typeof updateDto.amountCents === 'number') {
        data.amountCents = updateDto.amountCents;
      }
      if ('description' in updateDto) {
        data.description = updateDto.description ?? null;
      }

      const updated = await this.prisma.transaction.update({ where: { id }, data });
      const updatedRow = updated as DbTransaction;
      return {
        id: updatedRow.id,
        userId: updatedRow.userId,
        amountCents: updatedRow.amountCents ?? 0,
        description: updatedRow.description ?? null,
        createdAt: updatedRow.createdAt,
      } as Transaction;
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'P2025') {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }
      throw new InternalServerErrorException();
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.transaction.delete({ where: { id } });
      return;
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === 'P2025') {
        throw new NotFoundException(`Transaction with ID ${id} not found`);
      }
      throw new InternalServerErrorException();
    }
  }
}
