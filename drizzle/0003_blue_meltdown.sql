ALTER TABLE "popups" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "popups" ALTER COLUMN "type" SET DEFAULT 'text';--> statement-breakpoint
ALTER TABLE "popups" ADD COLUMN "image_url" text;