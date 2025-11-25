ALTER TABLE "popups" ADD COLUMN "button_text" varchar(100);--> statement-breakpoint
ALTER TABLE "popups" ADD COLUMN "button_url" varchar(255);--> statement-breakpoint
ALTER TABLE "popups" ADD COLUMN "start_date" timestamp;--> statement-breakpoint
ALTER TABLE "popups" ADD COLUMN "end_date" timestamp;--> statement-breakpoint
ALTER TABLE "popups" ADD COLUMN "position" varchar(20) DEFAULT 'center';--> statement-breakpoint
ALTER TABLE "popups" ADD COLUMN "auto_close" integer DEFAULT 0;