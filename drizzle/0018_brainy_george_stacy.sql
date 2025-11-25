ALTER TABLE "notifications" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "withdrawl_address" text;--> statement-breakpoint
ALTER TABLE "user_read_notifications" ADD COLUMN "created_at" timestamp DEFAULT now();