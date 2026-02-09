CREATE TABLE "competitions" (
	"id" bigint PRIMARY KEY NOT NULL,
	"competition_id" varchar(50) NOT NULL,
	"sport_id" varchar(50) NOT NULL,
	"name" varchar(200) NOT NULL,
	"provider" varchar(50),
	"is_active" boolean DEFAULT false,
	"is_archived" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "competitions_competition_id_unique" UNIQUE("competition_id")
);
--> statement-breakpoint
CREATE TABLE "sports" (
	"id" bigint PRIMARY KEY NOT NULL,
	"sport_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sports_sport_id_unique" UNIQUE("sport_id")
);
