import { account } from "../services/db/schema/auth";
import { db } from "../services/db";
import { eq } from "drizzle-orm";
import { google } from "googleapis";
import {
  calendarSyncs,
  CalendarSyncSelect,
} from "../services/db/schema/calender-sync";

export async function syncCalendar(sync: CalendarSyncSelect) {
  const { id, sourceAccountId, targetAccountId, syncToken } = sync;

  const sourceAccount = await db
    .select()
    .from(account)
    .where(eq(account.id, sourceAccountId))
    .limit(1)
    .then((res) => res[0]);

  const targetAccount = await db
    .select()
    .from(account)
    .where(eq(account.id, targetAccountId))
    .limit(1)
    .then((res) => res[0]);

  const sourceAccessToken = sourceAccount.accessToken;
  const targetAccessToken = targetAccount.accessToken;

  const authSource = new google.auth.OAuth2();
  authSource.setCredentials({ access_token: sourceAccessToken });

  const authTarget = new google.auth.OAuth2();
  authTarget.setCredentials({ access_token: targetAccessToken });

  const calendarSource = google.calendar({ version: "v3", auth: authSource });
  const calendarTarget = google.calendar({ version: "v3", auth: authTarget });

  const listParams = {
    calendarId: "primary",
    singleEvents: true,
    syncToken: syncToken || undefined,
  };

  try {
    const res = await calendarSource.events.list(listParams);
    const events = res.data.items || [];

    for (const event of events) {
      await calendarTarget.events.insert({
        calendarId: "primary",
        requestBody: event,
      });
    }

    await db
      .update(calendarSyncs)
      .set({ syncToken: res.data.nextSyncToken, lastSyncedAt: new Date() })
      .where(eq(calendarSyncs.id, id));
  } catch (error) {}
}
