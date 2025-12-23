export class Transaction {
  id!: number;
  userId!: number;
  // amount in minor units (cents)
  amountCents!: number;
  description!: string | null;
  createdAt!: Date;
}
