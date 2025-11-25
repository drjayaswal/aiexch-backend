CREATE TABLE "home_section_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"subcategory" varchar(100),
	"image" text NOT NULL,
	"link" varchar(255) NOT NULL,
	"popular" boolean DEFAULT false,
	"hot" boolean DEFAULT false,
	"order" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "home_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"subtitle" varchar(255),
	"type" varchar(50) DEFAULT 'games' NOT NULL,
	"order" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "home_section_games" ADD CONSTRAINT "home_section_games_section_id_home_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."home_sections"("id") ON DELETE cascade ON UPDATE no action;