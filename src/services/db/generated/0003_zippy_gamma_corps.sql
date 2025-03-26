ALTER TABLE "event_mappings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "event_mappings" CASCADE;--> statement-breakpoint
ALTER TABLE "calendar_syncs" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "calendar_syncs" ALTER COLUMN "last_synced_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "calendar_syncs" ADD COLUMN "source_account_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_syncs" ADD COLUMN "target_account_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "calendar_syncs" ADD CONSTRAINT "calendar_syncs_source_account_id_account_id_fk" FOREIGN KEY ("source_account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_syncs" ADD CONSTRAINT "calendar_syncs_target_account_id_account_id_fk" FOREIGN KEY ("target_account_id") REFERENCES "public"."account"("id") ON DELETE no action ON UPDATE no action;