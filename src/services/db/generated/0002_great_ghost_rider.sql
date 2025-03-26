CREATE TABLE "calendar_syncs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"sync_token" text,
	"last_synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"sync_id" integer NOT NULL,
	"source_event_id" text NOT NULL,
	"target_event_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "calendar_syncs" ADD CONSTRAINT "calendar_syncs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_mappings" ADD CONSTRAINT "event_mappings_sync_id_calendar_syncs_id_fk" FOREIGN KEY ("sync_id") REFERENCES "public"."calendar_syncs"("id") ON DELETE no action ON UPDATE no action;