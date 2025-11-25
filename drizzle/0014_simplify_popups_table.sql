-- Remove unnecessary columns from popups table
ALTER TABLE "popups" DROP COLUMN IF EXISTS "content";
ALTER TABLE "popups" DROP COLUMN IF EXISTS "type";
ALTER TABLE "popups" DROP COLUMN IF EXISTS "show_once";
ALTER TABLE "popups" DROP COLUMN IF EXISTS "button_text";
ALTER TABLE "popups" DROP COLUMN IF EXISTS "button_url";
ALTER TABLE "popups" DROP COLUMN IF EXISTS "start_date";
ALTER TABLE "popups" DROP COLUMN IF EXISTS "end_date";
ALTER TABLE "popups" DROP COLUMN IF EXISTS "position";
ALTER TABLE "popups" DROP COLUMN IF EXISTS "auto_close";

-- Make imageUrl and targetPage required
ALTER TABLE "popups" ALTER COLUMN "image_url" SET NOT NULL;
ALTER TABLE "popups" ALTER COLUMN "target_page" SET NOT NULL;
