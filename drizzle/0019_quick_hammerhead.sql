ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE numeric(16, 2) USING amount::numeric(16, 2);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "balance" SET NOT NULL;