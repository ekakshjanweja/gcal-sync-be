import { Hono } from "hono";
import { AppVariables } from "../types";
import { ERROR_TYPE, errorResponse, successResponse } from "../utils/api";
import { db } from "../services/db";
import { account, session } from "../services/db/schema/auth";
import { eq } from "drizzle-orm";
import {
  calendarSyncs,
  CalendarSyncSelect,
} from "../services/db/schema/calender-sync";
import { createCalendarInstance, fetchCalenderEvent } from "../utils/calendar";

export const calendarRouter = new Hono<{
  Variables: AppVariables;
}>();

calendarRouter.post("/sync", async (c) => {
  try {
    const body = await c.req.json();

    const {
      id,
      lastSyncedAt,
      sourceAccountId,
      syncToken,
      targetAccountId,
      userId,
    } = body as CalendarSyncSelect;

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

    if (!sourceAccount || !targetAccount) {
      return c.json(
        errorResponse({
          error: ERROR_TYPE.NOT_FOUND,
          message: "Source or target account not found",
        }),
        404
      );
    }

    const sourceAccessToken = sourceAccount.accessToken;
    const targetAccessToken = targetAccount.accessToken;

    if (!sourceAccessToken || !targetAccessToken) {
      return c.json(
        errorResponse({
          error: ERROR_TYPE.UNKNOWN_ERROR,
          message: "Source or target account is missing access token",
        }),
        400
      );
    }

    const sourceCalendar = await createCalendarInstance(sourceAccessToken);
    const targetCalendar = await createCalendarInstance(targetAccessToken);

    const { events, nextPageToken } = await fetchCalenderEvent(
      targetAccessToken
    );

    for (const event of events) {
      await sourceCalendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });
    }

    await db
      .update(calendarSyncs)
      .set({ syncToken: nextPageToken, lastSyncedAt: new Date() })
      .where(eq(calendarSyncs.id, id));

    return c.json(
      successResponse({
        message: "Sync completed successfully",
      }),
      200
    );
  } catch (error) {
    return c.json(
      errorResponse({
        error: ERROR_TYPE.INTERNAL_SERVER_ERROR,
        message: `${error}`,
      }),
      500
    );
  }
});

calendarRouter.post("/initiate-sync", async (c) => {
  const { sourceSessionId, targetSessionId } = await c.req.json();

  const sourceSession = await db
    .select()
    .from(session)
    .where(eq(session.id, sourceSessionId))
    .limit(1)
    .then((res) => res[0]);

  const targetSession = await db
    .select()
    .from(session)
    .where(eq(session.id, targetSessionId))
    .limit(1)
    .then((res) => res[0]);

  if (!sourceSession || !targetSession) {
    return c.json(
      errorResponse({
        error: ERROR_TYPE.USER_NOT_FOUND,
      }),
      404
    );
  }

  const sourceUserId = sourceSession.userId;
  const targetUserId = targetSession.userId;

  const sourceAccount = await db
    .select()
    .from(account)
    .where(eq(account.userId, sourceUserId))
    .limit(1)
    .then((res) => res[0]);

  const targetAccount = await db
    .select()
    .from(account)
    .where(eq(account.userId, targetUserId))
    .limit(1)
    .then((res) => res[0]);

  if (!sourceAccount || !targetAccount) {
    return c.json(
      errorResponse({
        error: ERROR_TYPE.NOT_FOUND,
        message: "Source or target account not found",
      }),
      404
    );
  }

  const sourceAccountId = sourceAccount.id;
  const targetAccountId = targetAccount.id;

  if (sourceAccount.userId === targetAccount.userId) {
    return c.json(
      errorResponse({
        error: ERROR_TYPE.INVALID_REQUEST,
        message: "Source and target accounts must be different",
      }),
      400
    );
  }

  const exsitingSync = await db
    .select()
    .from(calendarSyncs)
    .where(
      eq(calendarSyncs.sourceAccountId, sourceAccountId) &&
        eq(calendarSyncs.targetAccountId, targetAccountId)
    )
    .limit(1)
    .then((res) => res[0]);

  if (exsitingSync) {
    return c.json(
      successResponse({
        sync: exsitingSync,
        message: "Sync relationship already exisits",
      }),
      200
    );
  }

  const sync = await db
    .insert(calendarSyncs)
    .values({
      userId: sourceUserId,
      sourceAccountId,
      targetAccountId,
    })
    .returning()
    .then((res) => res[0]);

  return c.json(
    successResponse({
      sync,
      message: "Sync relationship created successfully",
    }),
    200
  );
});
