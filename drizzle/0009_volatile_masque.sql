CREATE TABLE "withdrawal_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"currency" varchar(10) DEFAULT 'INR',
	"min_amount" varchar(50) DEFAULT '100',
	"max_amount" varchar(50) DEFAULT '100000',
	"processing_time" varchar(100) DEFAULT '1-3 business days',
	"fee_percentage" varchar(10) DEFAULT '0',
	"fee_fixed" varchar(50) DEFAULT '0',
	"instructions" text,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "withdrawal_address" text;