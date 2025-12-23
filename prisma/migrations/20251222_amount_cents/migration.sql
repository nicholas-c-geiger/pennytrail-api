-- Add amount_cents integer column and migrate existing decimal values to cents
ALTER TABLE "transaction" ADD COLUMN IF NOT EXISTS "amount_cents" INTEGER DEFAULT 0;

-- If there is an existing "amount" column (numeric/decimal), backfill it into amount_cents
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transaction' AND column_name='amount') THEN
    UPDATE "transaction" SET "amount_cents" = CAST(ROUND(COALESCE("amount", 0) * 100) AS INTEGER);
    ALTER TABLE "transaction" DROP COLUMN IF EXISTS "amount";
  END IF;
END$$;

-- Make sure we have an index for lookups by userId
CREATE INDEX IF NOT EXISTS "transaction_userId_idx" ON "transaction"("userId");
