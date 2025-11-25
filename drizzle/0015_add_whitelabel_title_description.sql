-- Add title and description columns to whitelabels table
ALTER TABLE "whitelabels" ADD COLUMN "title" VARCHAR(255);
ALTER TABLE "whitelabels" ADD COLUMN "description" TEXT;
