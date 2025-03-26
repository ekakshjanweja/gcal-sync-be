import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { account, user } from "./auth";

export const calendarSyncs = pgTable("calendar_syncs", {
  id: serial("id").primaryKey().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  sourceAccountId: text("source_account_id")
    .notNull()
    .references(() => account.id),
  targetAccountId: text("target_account_id")
    .notNull()
    .references(() => account.id),
  syncToken: text("sync_token"),
  lastSyncedAt: timestamp("last_synced_at"),
});

export type CalendarSyncInsert = typeof calendarSyncs.$inferInsert;
export type CalendarSyncSelect = typeof calendarSyncs.$inferSelect;
