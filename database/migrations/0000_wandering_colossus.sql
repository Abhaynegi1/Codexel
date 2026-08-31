CREATE TYPE "public"."analysis_status" AS ENUM('pending', 'analyzing', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "repositories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" varchar(512) NOT NULL,
	"owner" varchar(256) NOT NULL,
	"name" varchar(256) NOT NULL,
	"default_branch" varchar(128) DEFAULT 'main' NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repositories_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "analyses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_id" uuid NOT NULL,
	"commit_sha" varchar(64) NOT NULL,
	"status" "analysis_status" DEFAULT 'pending' NOT NULL,
	"analyzer_version" varchar(32) NOT NULL,
	"summary" jsonb,
	"model_payload" jsonb,
	"stats" jsonb,
	"error_details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD CONSTRAINT "analyses_repository_id_repositories_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repositories"("id") ON DELETE cascade ON UPDATE no action;