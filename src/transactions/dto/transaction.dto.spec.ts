import { plainToInstance } from 'class-transformer';
import { TransactionDto } from './transaction.dto';

describe('TransactionDto', () => {
  it('converts amountCents (number) to amount (major units)', () => {
    const now = new Date().toISOString();
    const inst = plainToInstance(
      TransactionDto,
      { id: 1, userId: 2, amountCents: 750, description: 'coffee', createdAt: now },
      { excludeExtraneousValues: true }
    );

    expect(inst.id).toBe(1);
    expect(inst.userId).toBe(2);
    expect(inst.amountCents).toBe(750);
    expect(inst.description).toBe('coffee');
    expect(new Date(inst.createdAt).toISOString()).toBe(now);
  });

  it('accepts numeric amountCents and preserves null description', () => {
    const inst = plainToInstance(
      TransactionDto,
      { id: 2, userId: 3, amountCents: 825, description: null, createdAt: new Date() },
      { excludeExtraneousValues: true }
    );

    expect(inst.id).toBe(2);
    expect(inst.userId).toBe(3);
    expect(inst.amountCents).toBe(825);
    expect(inst.description).toBeNull();
  });
});
