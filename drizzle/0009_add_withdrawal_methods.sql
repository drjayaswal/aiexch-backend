CREATE TABLE IF NOT EXISTS "withdrawal_methods" (
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

-- Add withdrawal_address column to transactions table
ALTER TABLE "transactions" ADD COLUMN "withdrawal_address" text;

-- Insert default withdrawal methods
INSERT INTO "withdrawal_methods" ("name", "type", "currency", "min_amount", "max_amount", "processing_time", "fee_percentage", "fee_fixed", "instructions") VALUES
('Bank Transfer', 'bank', 'INR', '500', '500000', '1-3 business days', '0', '0', 'Provide your bank account details including account number, IFSC code, and account holder name.'),
('Bitcoin', 'crypto', 'BTC', '0.001', '10', 'Within 24 hours', '0', '0', 'Provide your Bitcoin wallet address. Ensure the address is correct as transactions cannot be reversed.'),
('Ethereum', 'crypto', 'ETH', '0.01', '100', 'Within 24 hours', '0', '0', 'Provide your Ethereum wallet address. Ensure the address is correct as transactions cannot be reversed.'),
('USDT (TRC20)', 'crypto', 'USDT', '10', '50000', 'Within 24 hours', '0', '0', 'Provide your USDT TRC20 wallet address. Ensure the address is correct as transactions cannot be reversed.'),
('UPI', 'ewallet', 'INR', '100', '100000', 'Instant', '0', '0', 'Provide your UPI ID for instant transfers.');