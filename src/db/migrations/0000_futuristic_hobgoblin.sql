CREATE TABLE "reports" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"idea" text NOT NULL,
	"industry" varchar(100),
	"region" varchar(100),
	"budget" varchar(100),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"current_stage_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stages" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"report_id" varchar(36) NOT NULL,
	"name" varchar(50) NOT NULL,
	"order_index" integer NOT NULL,
	"output" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"sources" jsonb,
	"error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;