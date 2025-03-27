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
import { syncCalendar } from "../utils/calendar";

export const calendarRouter = new Hono<{
  Variables: AppVariables;
}>();

calendarRouter.get("/sessions", async (c) => {
  const user = await c.get("user");

  if (!user) {
    return c.json(
      errorResponse({
        error: ERROR_TYPE.UNAUTHORIZED,
      }),
      401
    );
  }

  const sessions = await db
    .select()
    .from(session)
    .where(
      eq(session.userId, user.id) &&
        eq(session.expiresAt, new Date(Date.now() + 1000))
    )
    .then((res) => res);

  return c.json(successResponse({ sessions }), 200);
});

calendarRouter.post("/sync", async (c) => {
  const body = await c.req.json();
  await syncCalendar(body as CalendarSyncSelect);

  return c.json(
    successResponse({
      message: "Sync completed successfully",
    }),
    200
  );
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

  // Find source and target accounts based on the user IDs
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
