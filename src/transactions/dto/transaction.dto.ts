import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class TransactionDto {
  @Expose()
  @ApiProperty({ example: 1 })
  id!: number;

  @Expose()
  @ApiProperty({ example: 1 })
  userId!: number;

  @Expose()
  @ApiProperty({ example: 750, description: 'Amount in cents (integer)' })
  amountCents!: number;

  @Expose()
  @ApiProperty({ example: 'Coffee', nullable: true })
  description!: string | null;

  @Expose()
  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;
}
