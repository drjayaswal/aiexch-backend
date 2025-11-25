ALTER TABLE "popups" ALTER COLUMN "image_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "popups" ALTER COLUMN "target_page" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "whitelabels" ADD COLUMN "title" varchar(255);--> statement-breakpoint
ALTER TABLE "whitelabels" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "popups" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "popups" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "popups" DROP COLUMN "show_once";--> statement-breakpoint
ALTER TABLE "popups" DROP COLUMN "button_text";--> statement-breakpoint
ALTER TABLE "popups" DROP COLUMN "button_url";--> statement-breakpoint
ALTER TABLE "popups" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "popups" DROP COLUMN "end_date";--> statement-breakpoint
ALTER TABLE "popups" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "popups" DROP COLUMN "auto_close";