import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { VerifyJwtGuard } from '../auth/verify-jwt.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TransactionDto } from './dto/transaction.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Get()
  @UseGuards(VerifyJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List transactions' })
  @ApiResponse({
    status: 200,
    description: 'List of transactions',
    type: TransactionDto,
    isArray: true,
  })
  async findAll(): Promise<TransactionDto[]> {
    const rows = await this.txService.findAll();
    return plainToInstance(TransactionDto, rows, { excludeExtraneousValues: true });
  }

  @Get(':id')
  @UseGuards(VerifyJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction by id' })
  @ApiResponse({ status: 200, description: 'Transaction', type: TransactionDto })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<TransactionDto> {
    const tx = await this.txService.findOne(id);
    return plainToInstance(TransactionDto, tx, { excludeExtraneousValues: true });
  }

  @Post()
  @UseGuards(VerifyJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created', type: TransactionDto })
  async create(@Body() createDto: CreateTransactionDto): Promise<TransactionDto> {
    const tx = await this.txService.create(createDto);
    return plainToInstance(TransactionDto, tx, { excludeExtraneousValues: true });
  }

  @Put(':id')
  @UseGuards(VerifyJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction updated', type: TransactionDto })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTransactionDto
  ): Promise<TransactionDto> {
    const tx = await this.txService.update(id, updateDto);
    return plainToInstance(TransactionDto, tx, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @UseGuards(VerifyJwtGuard)
  @ApiOperation({ summary: 'Delete transaction' })
  @HttpCode(204)
  @ApiBearerAuth()
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.txService.remove(id);
  }
}
