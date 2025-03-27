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

    return { events, nextPageToken: response.data.nextPageToken };
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    throw new Error("Failed to fetch calendar events");
  }
}

export async function createCalendarInstance(accessToken: string) {
  const source = new google.auth.OAuth2();
  source.setCredentials({ access_token: accessToken });

  const calendar = await google.calendar({ version: "v3", auth: source });

  return calendar;
}
