ALTER TABLE "bets" ADD COLUMN "event_type_id" varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE "bets" ADD COLUMN "market_type" varchar(20) DEFAULT 'odds';--> statement-breakpoint
ALTER TABLE "bets" ADD COLUMN "result_checked_at" timestamp;