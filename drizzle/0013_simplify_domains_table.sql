-- Remove Cloudflare-specific columns from domains table
ALTER TABLE "domains" DROP COLUMN IF EXISTS "cloudflare_zone_id";
ALTER TABLE "domains" DROP COLUMN IF EXISTS "nameservers";

-- Update default status to active
ALTER TABLE "domains" ALTER COLUMN "status" SET DEFAULT 'active';