import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsInt()
  userId!: number;

  @IsInt()
  amountCents!: number;

  @IsOptional()
  @IsString()
  description?: string;
}
