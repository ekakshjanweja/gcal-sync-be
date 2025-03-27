import { account } from "../services/db/schema/auth";
import { db } from "../services/db";
import { eq } from "drizzle-orm";
import { google } from "googleapis";
import {
  calendarSyncs,
  CalendarSyncSelect,
} from "../services/db/schema/calender-sync";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../config";

export async function fetchCalenderEvent(accessToken: string) {
  try {
    const auth = new google.auth.OAuth2({
      clientId: GOOGLE_CLIENT_ID!,
      clientSecret: GOOGLE_CLIENT_SECRET!,
    });
    auth.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: "v3", auth });

    const response = await calendar.events.list({
      calendarId: "primary", // Fetches from the user's primary calendar
      singleEvents: true, // Expands recurring events into individual instances
      timeMin: new Date().toISOString(), // Start from now
      timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next 7 days
      orderBy: "startTime", // Sort events by start time
    });

    const events = response.data.items || [];

    return events;
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw new Error("Failed to fetch calendar events");
  }
}

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

  if (!sourceAccessToken || !targetAccessToken) {
    console.log("Access token not found");
    return;
  }

  const sourceEvents = await fetchCalenderEvent(sourceAccessToken);
  const targetEvents = await fetchCalenderEvent(targetAccessToken);

  for (const event of targetEvents) {
    await calendarSource.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
  }

  // await db
  //   .update(calendarSyncs)
  //   .set({ syncToken: res.data.nextSyncToken, lastSyncedAt: new Date() })
  //   .where(eq(calendarSyncs.id, id));
}
