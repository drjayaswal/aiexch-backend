CREATE TABLE "account_statements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"statement_type" varchar(50) DEFAULT 'monthly',
	"period" varchar(50) NOT NULL,
	"opening_balance" numeric(10, 2) NOT NULL,
	"closing_balance" numeric(10, 2) NOT NULL,
	"total_deposits" numeric(10, 2) DEFAULT '0',
	"total_withdrawals" numeric(10, 2) DEFAULT '0',
	"total_bets" numeric(10, 2) DEFAULT '0',
	"total_winnings" numeric(10, 2) DEFAULT '0',
	"commission" numeric(10, 2) DEFAULT '0',
	"net_result" numeric(10, 2) DEFAULT '0',
	"status" varchar(20) DEFAULT 'available',
	"generated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"image_url" text NOT NULL,
	"link_url" text,
	"position" varchar(50) DEFAULT 'home',
	"order" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"match_id" varchar(100) NOT NULL,
	"market_id" varchar(100) NOT NULL,
	"selection_id" varchar(100) NOT NULL,
	"odds" numeric(10, 2) NOT NULL,
	"stake" numeric(10, 2) NOT NULL,
	"type" varchar(10) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"payout" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"matched_at" timestamp,
	"settled_at" timestamp,
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "kyc_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"document_type" varchar(50) NOT NULL,
	"document_url" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"review_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) DEFAULT 'info',
	"user_id" integer,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "otps" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"otp" varchar(6) NOT NULL,
	"type" varchar(20) DEFAULT 'email_verification',
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "popups" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"type" varchar(50) DEFAULT 'info',
	"target_page" varchar(100),
	"show_once" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"birth_date" date,
	"country" varchar(100),
	"city" varchar(100),
	"address" text,
	"phone" varchar(20),
	"avatar" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promocodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"type" varchar(50) NOT NULL,
	"value" varchar(100) NOT NULL,
	"usage_limit" integer DEFAULT 1,
	"used_count" integer DEFAULT 0,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "promocodes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(50) NOT NULL,
	"value" varchar(100),
	"min_deposit" varchar(50),
	"max_bonus" varchar(50),
	"valid_from" timestamp,
	"valid_to" timestamp,
	"image_url" text,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"payment_method" varchar(100) NOT NULL,
	"qr_code_url" text,
	"wallet_address" text,
	"instructions" text,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"site_name" varchar(255) DEFAULT 'AIEXCH',
	"logo" text,
	"favicon" text,
	"theme" text DEFAULT '{"primary":"#D4AF37","primaryLight":"#E6C866","primaryDark":"#B8941F","accent":"#FFD700","dark":"#1A1A2E","darkLight":"#16213E","darkLighter":"#0F3460","primaryText":"#F5F5F5","secondaryText":"#C0C0C0","inverseText":"#000000","background":"#1A1A2E"}',
	"maintenance_mode" boolean DEFAULT false,
	"maintenance_message" text DEFAULT 'We are currently performing scheduled maintenance. Please check back soon.',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sports_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"image_url" text,
	"link_path" varchar(255),
	"market_count" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"amount" varchar(50) NOT NULL,
	"currency" varchar(10) DEFAULT 'USD',
	"status" varchar(20) DEFAULT 'pending',
	"method" varchar(50),
	"reference" varchar(255),
	"txn_hash" varchar(255),
	"proof_image" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(20) DEFAULT 'user',
	"membership" varchar(20) DEFAULT 'bronze',
	"status" varchar(20) DEFAULT 'active',
	"balance" numeric(15, 2) DEFAULT '0',
	"email_verified" boolean DEFAULT false,
	"last_login_ip" varchar(45),
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "whitelabels" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"domain" varchar(255) NOT NULL,
	"logo" text,
	"contact_email" varchar(255),
	"status" varchar(20) DEFAULT 'active',
	"theme" text DEFAULT '{"primary":"#D4AF37","primaryLight":"#E6C866","primaryDark":"#B8941F","accent":"#FFD700","dark":"#1A1A2E","darkLight":"#16213E","darkLighter":"#0F3460","primaryText":"#F5F5F5","secondaryText":"#C0C0C0","inverseText":"#000000","background":"#1A1A2E"}',
	"preferences" text DEFAULT '{"language":"en","currency":"USD","timezone":"UTC","dateFormat":"MM/DD/YYYY","enableLiveChat":true,"enableNotifications":true,"maintenanceMode":false}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "whitelabels_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
ALTER TABLE "account_statements" ADD CONSTRAINT "account_statements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bets" ADD CONSTRAINT "bets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;